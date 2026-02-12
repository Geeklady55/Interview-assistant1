import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LiveInterview = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  
  // Session state
  const [session, setSession] = useState(null);
  const [qaHistory, setQaHistory] = useState([]);
  
  // UI state
  const [stealthMode, setStealthMode] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Input state
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  // AI state
  const [aiModel, setAiModel] = useState("gpt-5.2");
  const [tone, setTone] = useState("professional");
  const [domain, setDomain] = useState("general");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Refs
  const recognitionRef = useRef(null);
  const dragRef = useRef(null);
  const answerRef = useRef(null);

  // Fetch session data
  useEffect(() => {
    if (sessionId) {
      fetchSession();
      fetchQAHistory();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API}/sessions/${sessionId}`);
      setSession(response.data);
      setDomain(response.data.domain);
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

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
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
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setTranscript("");
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
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
  const renderContent = () => (
    <>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-4">
        <Select value={aiModel} onValueChange={setAiModel}>
          <SelectTrigger data-testid="ai-model-select" className="w-[140px] h-8 text-xs bg-black/40 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-white/10">
            <SelectItem value="gpt-5.2">GPT-5.2</SelectItem>
            <SelectItem value="claude-sonnet-4.5">Claude 4.5</SelectItem>
            <SelectItem value="gemini-3-flash">Gemini 3</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger data-testid="tone-select" className="w-[120px] h-8 text-xs bg-black/40 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-white/10">
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger data-testid="domain-select" className="w-[130px] h-8 text-xs bg-black/40 border-white/10">
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
      </div>

      {/* Question Input */}
      <div className="relative mb-4">
        <Textarea
          data-testid="question-input"
          placeholder="Type or speak your interview question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[80px] bg-black/40 border-white/10 focus:border-primary/50 resize-none font-primary text-sm pr-24"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
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
                {isListening ? 'Stop listening' : 'Start voice input'}
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
          <span className="text-xs font-mono text-destructive">LISTENING...</span>
        </div>
      )}

      {/* Answer Display */}
      {(isGenerating || currentAnswer) && (
        <div ref={answerRef} className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-white/50">ANSWER</span>
            {currentAnswer && (
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
                  <span className="text-xs font-mono text-white/50">STEALTH MODE</span>
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  data-testid="stealth-mode-btn"
                  variant="outline"
                  onClick={() => setStealthMode(true)}
                  className="border-primary/30 text-primary hover:bg-primary/10 font-bold"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  STEALTH MODE
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Minimize to a floating overlay for video calls</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
