import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mic,
  MicOff,
  Copy,
  Check,
  Eye,
  EyeOff,
  GripVertical,
  ArrowLeft,
  Send,
  Loader2,
  X,
  Minimize2,
  Maximize2,
  Shield,
  History,
  Keyboard,
  Zap,
  Clock,
  AlertTriangle,
  Volume2,
  Square,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Text-to-Speech Hook
const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechId, setCurrentSpeechId] = useState(null);

  const speak = useCallback((text, id = null) => {
    window.speechSynthesis.cancel();
    
    if (!text) return;

    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/•/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => { setIsSpeaking(true); setCurrentSpeechId(id); };
    utterance.onend = () => { setIsSpeaking(false); setCurrentSpeechId(null); };
    utterance.onerror = () => { setIsSpeaking(false); setCurrentSpeechId(null); };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentSpeechId(null);
  }, []);

  useEffect(() => {
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, []);

  return { speak, stop, isSpeaking, currentSpeechId };
};

const LiveInterview = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  
  // TTS hook
  const { speak, stop, isSpeaking, currentSpeechId } = useTTS();
  
  // Session state
  const [session, setSession] = useState(null);
  const [qaHistory, setQaHistory] = useState([]);
  
  // Timer state
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [durationLimit, setDurationLimit] = useState(15); // Default 15 mins
  const [timeWarning, setTimeWarning] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  
  // UI state
  const [stealthMode, setStealthMode] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Input state
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [useWhisper, setUseWhisper] = useState(false);
  
  // AI state
  const [aiModel, setAiModel] = useState("gpt-5.2");
  const [tone, setTone] = useState("professional");
  const [domain, setDomain] = useState("general");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Refs
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const dragRef = useRef(null);
  const answerRef = useRef(null);
  const textareaRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch session data
  useEffect(() => {
    if (sessionId) {
      fetchSession();
      fetchQAHistory();
    }
    
    // Initialize session start time
    setSessionStartTime(Date.now());
    
    return () => {
      // Cleanup timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionId]);
  
  // Timer effect
  useEffect(() => {
    if (!sessionStartTime) return;
    
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      setElapsedTime(elapsed);
      
      const limitSeconds = durationLimit * 60;
      const remaining = limitSeconds - elapsed;
      
      // Warning at 2 minutes remaining
      if (remaining <= 120 && remaining > 0 && !timeWarning) {
        setTimeWarning(true);
        toast.warning("2 minutes remaining in this session!", {
          duration: 5000,
          icon: <AlertTriangle className="w-4 h-4" />
        });
      }
      
      // Session expired
      if (remaining <= 0 && !sessionExpired) {
        setSessionExpired(true);
        toast.error("Session time limit reached. Please upgrade your plan for longer sessions.", {
          duration: 10000
        });
      }
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionStartTime, durationLimit, timeWarning, sessionExpired]);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API}/sessions/${sessionId}`);
      setSession(response.data);
      setDomain(response.data.domain);
      // Set duration limit from session
      if (response.data.duration_limit) {
        setDurationLimit(response.data.duration_limit);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
    }
  };

  const fetchQAHistory = async () => {
    if (!sessionId) return;
    try {
      const response = await axios.get(`${API}/qa-pairs/${sessionId}`);
      setQaHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch Q&A history:", error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (question.trim() && !isGenerating) {
          generateAnswer();
        }
      }
      // Escape to toggle stealth mode
      if (e.key === 'Escape') {
        e.preventDefault();
        if (stealthMode) {
          setMinimized(!minimized);
        } else {
          setStealthMode(true);
        }
      }
      // Ctrl/Cmd + M to toggle mic
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleListening();
      }
      // Ctrl/Cmd + Shift + C to copy answer
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (currentAnswer) {
          copyAnswer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, isGenerating, stealthMode, minimized, currentAnswer]);

  // Web Speech API setup
  useEffect(() => {
    if (!useWhisper && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setQuestion(prev => prev + finalTranscript);
        }
        setTranscript(interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please enable it in your browser settings.");
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening && !useWhisper) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, useWhisper]);

  // Whisper recording setup
  const startWhisperRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeWithWhisper(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Failed to access microphone");
    }
  };

  const stopWhisperRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const transcribeWithWhisper = async (audioBlob) => {
    try {
      setTranscript("Transcribing...");
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        const response = await axios.post(`${API}/transcribe`, {
          audio_base64: base64Audio,
          language: "en"
        });
        
        if (response.data.success) {
          setQuestion(prev => prev + (prev ? ' ' : '') + response.data.text);
          toast.success("Transcription complete!");
        }
        setTranscript("");
      };
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Transcription failed");
      setTranscript("");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (useWhisper) {
        stopWhisperRecording();
      } else {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      setTranscript("");
    } else {
      if (useWhisper) {
        startWhisperRecording();
      } else {
        recognitionRef.current?.start();
        setIsListening(true);
      }
    }
  };

  // Generate answer
  const generateAnswer = async () => {
    if (!question.trim()) {
      toast.error("Please enter or speak a question");
      return;
    }

    setIsGenerating(true);
    setCurrentAnswer("");

    try {
      const response = await axios.post(`${API}/generate-answer`, {
        question: question.trim(),
        ai_model: aiModel,
        tone,
        domain,
        session_id: sessionId || null,
      });

      setCurrentAnswer(response.data.answer);
      setQuestion("");
      
      if (sessionId) {
        fetchQAHistory();
      }
      
      // Scroll to answer
      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error("Failed to generate answer:", error);
      toast.error("Failed to generate answer. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy answer to clipboard
  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(currentAnswer);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  // Drag handling
  const handleDragStart = useCallback((e) => {
    if (!stealthMode) return;
    setIsDragging(true);
    const startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startX, startY, initialX: position.x, initialY: position.y };
  }, [stealthMode, position]);

  const handleDrag = useCallback((e) => {
    if (!isDragging || !dragRef.current) return;
    e.preventDefault();
    const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const deltaX = currentX - dragRef.current.startX;
    const deltaY = currentY - dragRef.current.startY;
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 420, dragRef.current.initialX + deltaX)),
      y: Math.max(0, Math.min(window.innerHeight - 200, dragRef.current.initialY + deltaY)),
    });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  // Render content based on mode
  const renderContent = () => {
    // Format time display
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    const limitSeconds = durationLimit * 60;
    const remaining = Math.max(0, limitSeconds - elapsedTime);
    const progress = (elapsedTime / limitSeconds) * 100;
    const isLowTime = remaining <= 120;
    
    return (
    <>
      {/* Session Timer */}
      <div className={`mb-4 p-3 rounded-sm border ${
        sessionExpired ? 'bg-destructive/10 border-destructive/30' :
        isLowTime ? 'bg-orange-500/10 border-orange-500/30' :
        'bg-black/40 border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${
              sessionExpired ? 'text-destructive' :
              isLowTime ? 'text-orange-400' :
              'text-primary'
            }`} />
            <span className="text-xs font-mono uppercase tracking-wide text-white/70">
              Session Time
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-mono font-bold ${
              sessionExpired ? 'text-destructive' :
              isLowTime ? 'text-orange-400' :
              'text-white'
            }`}>
              {formatTime(elapsedTime)} / {formatTime(limitSeconds)}
            </span>
            {isLowTime && !sessionExpired && (
              <span className="text-xs text-orange-400 animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {formatTime(remaining)} left
              </span>
            )}
          </div>
        </div>
        <Progress 
          value={Math.min(progress, 100)} 
          className={`h-1.5 ${
            sessionExpired ? 'bg-destructive/20' :
            isLowTime ? 'bg-orange-500/20' :
            'bg-white/10'
          }`}
        />
        {sessionExpired && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-destructive">Session expired. Upgrade for longer sessions.</span>
            <Button 
              size="sm" 
              variant="outline"
              className="h-6 text-xs border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate('/pricing')}
            >
              Upgrade Plan
            </Button>
          </div>
        )}
      </div>
    
      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Select value={aiModel} onValueChange={setAiModel}>
          <SelectTrigger data-testid="ai-model-select" className="w-[130px] h-8 text-xs bg-black/40 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-white/10">
            <SelectItem value="gpt-5.2">GPT-5.2</SelectItem>
            <SelectItem value="claude-sonnet-4.5">Claude 4.5</SelectItem>
            <SelectItem value="gemini-3-flash">Gemini 3</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger data-testid="tone-select" className="w-[110px] h-8 text-xs bg-black/40 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-white/10">
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger data-testid="domain-select" className="w-[120px] h-8 text-xs bg-black/40 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-white/10">
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="frontend">Frontend</SelectItem>
            <SelectItem value="backend">Backend</SelectItem>
            <SelectItem value="system_design">System Design</SelectItem>
            <SelectItem value="dsa">DSA</SelectItem>
            <SelectItem value="technical_support">Tech Support</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Whisper Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="whisper-mode"
                    checked={useWhisper}
                    onCheckedChange={setUseWhisper}
                    className="data-[state=checked]:bg-secondary"
                  />
                  <Label htmlFor="whisper-mode" className="text-xs text-white/50 cursor-pointer flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Whisper
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use OpenAI Whisper for better transcription accuracy</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Question Input */}
      <div className="relative mb-4">
        <Textarea
          ref={textareaRef}
          data-testid="question-input"
          placeholder="Type or speak your interview question... (Ctrl+Enter to submit)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[80px] bg-black/40 border-white/10 focus:border-primary/50 resize-none font-primary text-sm pr-24"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              generateAnswer();
            }
          }}
        />
        
        {/* Live transcript indicator */}
        {transcript && (
          <div className="absolute bottom-12 left-3 text-xs text-primary/70 font-mono animate-pulse">
            {transcript}
          </div>
        )}
        
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="mic-toggle-btn"
                  variant="ghost"
                  size="sm"
                  onClick={toggleListening}
                  className={`h-8 w-8 p-0 ${isListening ? 'bg-destructive/20 text-destructive' : 'text-white/50 hover:text-white'}`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isListening ? 'Stop listening (Ctrl+M)' : 'Start voice input (Ctrl+M)'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            data-testid="generate-answer-btn"
            size="sm"
            onClick={generateAnswer}
            disabled={isGenerating || !question.trim()}
            className="h-8 bg-primary hover:bg-primary/90 font-bold"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Recording indicator */}
      {isListening && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm">
          <div className="recording-dot" />
          <span className="text-xs font-mono text-destructive">
            {useWhisper ? "RECORDING (WHISPER)..." : "LISTENING..."}
          </span>
        </div>
      )}

      {/* Answer Display */}
      {(isGenerating || currentAnswer) && (
        <div ref={answerRef} className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-white/50">ANSWER</span>
            {currentAnswer && (
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        data-testid="speak-answer-btn"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (isSpeaking && currentSpeechId === 'answer') {
                            stop();
                          } else {
                            speak(currentAnswer, 'answer');
                          }
                        }}
                        className={`h-6 px-2 ${isSpeaking && currentSpeechId === 'answer' ? 'text-primary' : 'text-white/50'}`}
                      >
                        {isSpeaking && currentSpeechId === 'answer' ? (
                          <Square className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isSpeaking && currentSpeechId === 'answer' ? 'Stop' : 'Read aloud'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  data-testid="copy-answer-btn"
                  variant="ghost"
                  size="sm"
                  onClick={copyAnswer}
                  className="h-6 px-2 text-xs"
                >
                  {copied ? <Check className="w-3 h-3 mr-1 text-secondary" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            )}
          </div>
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-4">
              {isGenerating ? (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <div className="answer-content text-sm font-primary whitespace-pre-wrap">
                  {currentAnswer}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Q&A History */}
      {qaHistory.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="w-3 h-3 text-white/50" />
            <span className="text-xs font-bold uppercase tracking-wide text-white/50">HISTORY</span>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {qaHistory.slice().reverse().map((qa, i) => (
                <Card key={qa.id} className="bg-black/20 border-white/5">
                  <CardContent className="p-3">
                    <p className="text-xs font-mono text-primary/70 mb-1">{qa.question}</p>
                    <p className="text-xs text-white/60 line-clamp-3">{qa.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </>
  );
  };

  // Stealth mode overlay
  if (stealthMode) {
    return (
      <AnimatePresence>
        <motion.div
          data-testid="stealth-overlay"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`fixed z-50 ${minimized ? 'stealth-minimized' : 'stealth-container'}`}
          style={{
            right: position.x,
            bottom: position.y,
            opacity: isDragging ? 1 : undefined,
          }}
        >
          <div className={`glass rounded-lg overflow-hidden ${!minimized && 'stealth-idle'}`}>
            {/* Stealth Header */}
            <div 
              className="flex items-center justify-between px-3 py-2 bg-black/60 border-b border-white/5 cursor-grab drag-handle"
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-white/30" />
                {!minimized && (
                  <span className="text-xs font-mono text-white/50">STEALTH (ESC to minimize)</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  data-testid="minimize-toggle-btn"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMinimized(!minimized)}
                  className="h-6 w-6 p-0 hover:bg-white/10"
                >
                  {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </Button>
                <Button
                  data-testid="exit-stealth-btn"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStealthMode(false)}
                  className="h-6 w-6 p-0 hover:bg-white/10"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {/* Stealth Content */}
            {!minimized && (
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {renderContent()}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Full page mode
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              data-testid="back-btn"
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-secondary font-bold tracking-tight text-sm">
                {session?.name || 'LIVE INTERVIEW'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/50 hover:text-white"
                  >
                    <Keyboard className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="text-xs space-y-1">
                    <p><kbd className="px-1 bg-white/20 rounded">Ctrl+Enter</kbd> Submit question</p>
                    <p><kbd className="px-1 bg-white/20 rounded">Ctrl+M</kbd> Toggle mic</p>
                    <p><kbd className="px-1 bg-white/20 rounded">Ctrl+Shift+C</kbd> Copy answer</p>
                    <p><kbd className="px-1 bg-white/20 rounded">Esc</kbd> Toggle stealth</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button 
              data-testid="stealth-mode-btn"
              variant="outline"
              onClick={() => setStealthMode(true)}
              className="border-primary/30 text-primary hover:bg-primary/10 font-bold"
            >
              <Eye className="w-4 h-4 mr-2" />
              STEALTH MODE
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default LiveInterview;
