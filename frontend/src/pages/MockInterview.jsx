import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Shield,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Lightbulb,
  Copy,
  Check,
  Brain,
  Target,
  Code,
  Users,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MockInterview = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  // Session state
  const [session, setSession] = useState(null);
  
  // Questions state
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Answer state
  const [userAnswer, setUserAnswer] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [showAiAnswer, setShowAiAnswer] = useState(false);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Settings
  const [aiModel, setAiModel] = useState("gpt-5.2");
  const [tone, setTone] = useState("professional");
  
  // Stats
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  useEffect(() => {
    if (session) {
      generateQuestions();
    }
  }, [session]);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API}/sessions/${sessionId}`);
      setSession(response.data);
    } catch (error) {
      console.error("Failed to fetch session:", error);
      toast.error("Failed to load session");
    }
  };

  const generateQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const response = await axios.post(`${API}/generate-mock-questions`, {
        domain: session?.domain || "general",
        job_description: session?.job_description,
        resume: session?.resume,
        count: 10,
        ai_model: aiModel,
      });
      setQuestions(response.data.questions);
      setCurrentIndex(0);
      setAnsweredCount(0);
      setUserAnswer("");
      setAiAnswer("");
      setShowAiAnswer(false);
    } catch (error) {
      console.error("Failed to generate questions:", error);
      toast.error("Failed to generate questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const generateAiAnswer = async () => {
    if (!questions[currentIndex]) return;
    
    setGeneratingAnswer(true);
    try {
      const response = await axios.post(`${API}/generate-answer`, {
        question: questions[currentIndex].question,
        ai_model: aiModel,
        tone,
        domain: session?.domain || "general",
        session_id: sessionId,
        job_description: session?.job_description,
        resume: session?.resume,
        company_name: session?.company_name,
        role_title: session?.role_title,
      });
      setAiAnswer(response.data.answer);
      setShowAiAnswer(true);
    } catch (error) {
      console.error("Failed to generate answer:", error);
      toast.error("Failed to generate AI answer");
    } finally {
      setGeneratingAnswer(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      if (userAnswer.trim() || aiAnswer) {
        setAnsweredCount(prev => prev + 1);
      }
      setCurrentIndex(prev => prev + 1);
      setUserAnswer("");
      setAiAnswer("");
      setShowAiAnswer(false);
      setShowTips(false);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setUserAnswer("");
      setAiAnswer("");
      setShowAiAnswer(false);
      setShowTips(false);
    }
  };

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(aiAnswer);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "behavioral": return Users;
      case "technical": return Brain;
      case "coding": return Code;
      case "system_design": return Target;
      default: return MessageSquare;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy": return "bg-secondary/20 text-secondary";
      case "medium": return "bg-accent/20 text-accent";
      case "hard": return "bg-destructive/20 text-destructive";
      default: return "bg-white/10 text-white/50";
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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
              <Brain className="w-5 h-5 text-secondary" />
              <span className="font-secondary font-bold tracking-tight text-sm">
                {session?.name || "MOCK INTERVIEW"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger data-testid="ai-model-select" className="w-[130px] h-8 text-xs bg-surface border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-white/10">
                <SelectItem value="gpt-5.2">GPT-5.2</SelectItem>
                <SelectItem value="claude-sonnet-4.5">Claude 4.5</SelectItem>
                <SelectItem value="gemini-3-flash">Gemini 3</SelectItem>
              </SelectContent>
            </Select>
            <Button
              data-testid="refresh-questions-btn"
              variant="outline"
              size="sm"
              onClick={generateQuestions}
              disabled={loadingQuestions}
              className="border-white/10 hover:border-primary/50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingQuestions ? 'animate-spin' : ''}`} />
              New Set
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-white/50">
                QUESTION {currentIndex + 1} OF {questions.length}
              </span>
              <span className="text-xs font-mono text-secondary">
                {answeredCount} ANSWERED
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          {loadingQuestions ? (
            <Card className="bg-surface border-white/10">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-white/50 font-primary">Generating interview questions...</p>
              </CardContent>
            </Card>
          ) : questions.length === 0 ? (
            <Card className="bg-surface border-white/10">
              <CardContent className="p-12 text-center">
                <Brain className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 font-primary mb-4">No questions generated yet</p>
                <Button onClick={generateQuestions} className="bg-primary hover:bg-primary/90">
                  Generate Questions
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Question Card */}
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-surface border-white/10">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {currentQuestion && (() => {
                          const Icon = getCategoryIcon(currentQuestion.category);
                          return (
                            <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                          );
                        })()}
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wide text-white/50">
                            {currentQuestion?.category}
                          </span>
                          <Badge className={`ml-2 text-xs ${getDifficultyColor(currentQuestion?.difficulty)}`}>
                            {currentQuestion?.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        data-testid="show-tips-btn"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTips(!showTips)}
                        className="text-accent hover:text-accent/80"
                      >
                        <Lightbulb className="w-4 h-4 mr-1" />
                        Tips
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <h2 className="font-primary text-lg font-semibold leading-relaxed">
                      {currentQuestion?.question}
                    </h2>
                    
                    <AnimatePresence>
                      {showTips && currentQuestion?.tips && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-accent/10 border border-accent/20 rounded-sm">
                            <p className="text-sm text-accent/90 font-primary">
                              <Lightbulb className="w-4 h-4 inline-block mr-2" />
                              {currentQuestion.tips}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Your Answer */}
              <Card className="bg-surface border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="font-secondary font-bold text-sm tracking-tight uppercase flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    YOUR ANSWER
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    data-testid="user-answer-input"
                    placeholder="Practice your answer here... Think out loud as you would in a real interview."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="min-h-[150px] bg-black/40 border-white/10 focus:border-primary/50 resize-none font-primary"
                  />
                </CardContent>
              </Card>

              {/* AI Answer */}
              <Card className="bg-surface border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-secondary font-bold text-sm tracking-tight uppercase flex items-center gap-2">
                      <Brain className="w-4 h-4 text-secondary" />
                      AI SUGGESTED ANSWER
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {aiAnswer && (
                        <>
                          <Button
                            data-testid="toggle-answer-btn"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAiAnswer(!showAiAnswer)}
                            className="text-white/50 hover:text-white"
                          >
                            {showAiAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            data-testid="copy-ai-answer-btn"
                            variant="ghost"
                            size="sm"
                            onClick={copyAnswer}
                            className="text-white/50 hover:text-white"
                          >
                            {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </>
                      )}
                      <Button
                        data-testid="generate-ai-answer-btn"
                        size="sm"
                        onClick={generateAiAnswer}
                        disabled={generatingAnswer}
                        className="bg-secondary hover:bg-secondary/90 font-bold"
                      >
                        {generatingAnswer ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {generatingAnswer ? (
                    <div className="p-6 text-center">
                      <div className="typing-indicator justify-center">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <p className="text-xs text-white/40 mt-2">Generating personalized answer...</p>
                    </div>
                  ) : aiAnswer ? (
                    <AnimatePresence>
                      {showAiAnswer && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="answer-content text-sm text-white/80 whitespace-pre-wrap p-4 bg-black/40 rounded-sm"
                        >
                          {aiAnswer}
                        </motion.div>
                      )}
                      {!showAiAnswer && (
                        <div className="p-6 text-center border border-dashed border-white/10 rounded-sm">
                          <Eye className="w-8 h-8 text-white/20 mx-auto mb-2" />
                          <p className="text-sm text-white/40">Answer hidden. Click the eye icon to reveal.</p>
                        </div>
                      )}
                    </AnimatePresence>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-white/10 rounded-sm">
                      <Brain className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-sm text-white/40">
                        Click "Generate" to get an AI-suggested answer tailored to your resume and the job.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  data-testid="prev-question-btn"
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={currentIndex === 0}
                  className="border-white/10 hover:border-white/20"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button
                  data-testid="next-question-btn"
                  onClick={nextQuestion}
                  disabled={currentIndex === questions.length - 1}
                  className="bg-primary hover:bg-primary/90 font-bold"
                >
                  Next Question
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MockInterview;
