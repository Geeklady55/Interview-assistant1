import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Code,
  Copy,
  Check,
  ArrowLeft,
  Send,
  Loader2,
  Shield,
  Play,
  Trash2,
  FileCode,
  MessageSquare,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CodeInterview = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  // Session state
  const [session, setSession] = useState(null);

  // Code state
  const [code, setCode] = useState(`// Write your code here
function solution(nums) {
  // Your implementation
  return nums;
}
`);
  const [language, setLanguage] = useState("javascript");
  const [question, setQuestion] = useState("");

  // AI state
  const [aiModel, setAiModel] = useState("gpt-5.2");
  const [isGenerating, setIsGenerating] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [copied, setCopied] = useState(false);

  // Chat history
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API}/sessions/${sessionId}`);
      setSession(response.data);
    } catch (error) {
      console.error("Failed to fetch session:", error);
    }
  };

  const analyzeCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code to analyze");
      return;
    }

    const userQuestion = question.trim() || "Explain this code and suggest improvements";

    setIsGenerating(true);
    setExplanation("");

    try {
      const response = await axios.post(`${API}/code-assist`, {
        code: code.trim(),
        language,
        question: userQuestion,
        ai_model: aiModel,
      });

      setExplanation(response.data.explanation);
      setChatHistory(prev => [
        ...prev,
        { type: "user", content: userQuestion, code: code.trim() },
        { type: "assistant", content: response.data.explanation },
      ]);
      setQuestion("");
    } catch (error) {
      console.error("Failed to analyze code:", error);
      toast.error("Failed to analyze code. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const askFollowUp = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsGenerating(true);

    try {
      const context = chatHistory
        .slice(-4)
        .map(msg => `${msg.type}: ${msg.content}`)
        .join("\n");

      const response = await axios.post(`${API}/generate-answer`, {
        question: question.trim(),
        ai_model: aiModel,
        tone: "technical",
        domain: "dsa",
        context: `Previous conversation:\n${context}\n\nCurrent code:\n${code}`,
        session_id: sessionId || null,
      });

      setChatHistory(prev => [
        ...prev,
        { type: "user", content: question.trim() },
        { type: "assistant", content: response.data.answer },
      ]);
      setExplanation(response.data.answer);
      setQuestion("");
    } catch (error) {
      console.error("Failed to get follow-up answer:", error);
      toast.error("Failed to get answer. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const clearCode = () => {
    setCode("");
    setExplanation("");
    setChatHistory([]);
  };

  const languageOptions = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "sql", label: "SQL" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
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
              <Code className="w-5 h-5 text-accent" />
              <span className="font-secondary font-bold tracking-tight text-sm">
                {session?.name || "CODE INTERVIEW"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger data-testid="ai-model-select" className="w-[140px] h-8 text-xs bg-surface border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-white/10">
                <SelectItem value="gpt-5.2">GPT-5.2</SelectItem>
                <SelectItem value="claude-sonnet-4.5">Claude 4.5</SelectItem>
                <SelectItem value="gemini-3-flash">Gemini 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-120px)]">
          {/* Code Editor Panel */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <Card className="h-full bg-surface border-white/10 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <FileCode className="w-4 h-4 text-accent" />
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger data-testid="language-select" className="w-[130px] h-7 text-xs bg-black/40 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-white/10">
                      {languageOptions.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    data-testid="copy-code-btn"
                    variant="ghost"
                    size="sm"
                    onClick={copyCode}
                    className="h-7 px-2 text-xs"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 mr-1 text-secondary" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    data-testid="clear-code-btn"
                    variant="ghost"
                    size="sm"
                    onClick={clearCode}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              <CardContent className="flex-1 p-0">
                <Textarea
                  data-testid="code-editor"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-full w-full resize-none code-editor border-0 rounded-none focus-visible:ring-0 p-4"
                  placeholder="Paste your code here..."
                  spellCheck={false}
                />
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle className="w-2 bg-transparent hover:bg-primary/20 transition-colors" />

          {/* AI Assistant Panel */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <Card className="h-full bg-surface border-white/10 flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="font-secondary font-bold text-xs tracking-wide uppercase">
                  AI ASSISTANT
                </span>
              </div>

              <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                {/* Chat History */}
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4 pr-4">
                    {chatHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <Code className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 text-sm font-primary">
                          Paste your code and ask for help!
                        </p>
                        <p className="text-white/30 text-xs mt-2">
                          I can explain algorithms, optimize code, or help debug issues.
                        </p>
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-sm ${
                            msg.type === "user"
                              ? "bg-primary/10 border border-primary/20 ml-8"
                              : "bg-black/40 border border-white/5 mr-8"
                          }`}
                        >
                          <p className="text-xs font-bold uppercase tracking-wide text-white/50 mb-2">
                            {msg.type === "user" ? "YOU" : "AI"}
                          </p>
                          <div className="answer-content text-sm whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        </motion.div>
                      ))
                    )}

                    {isGenerating && (
                      <div className="p-3 rounded-sm bg-black/40 border border-white/5 mr-8">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Question Input */}
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      data-testid="question-input"
                      placeholder="Ask about your code..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="h-10 bg-black/40 border-white/10 focus:border-primary/50 font-primary text-sm pr-24"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          chatHistory.length > 0 ? askFollowUp() : analyzeCode();
                        }
                      }}
                    />
                    <Button
                      data-testid="send-question-btn"
                      size="sm"
                      onClick={chatHistory.length > 0 ? askFollowUp : analyzeCode}
                      disabled={isGenerating}
                      className="absolute right-1.5 top-1.5 h-7 bg-primary hover:bg-primary/90"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      data-testid="analyze-code-btn"
                      variant="outline"
                      size="sm"
                      onClick={analyzeCode}
                      disabled={isGenerating || !code.trim()}
                      className="flex-1 h-8 text-xs border-white/10 hover:border-primary/50"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Analyze Code
                    </Button>
                    <Button
                      data-testid="explain-btn"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuestion("Explain the time and space complexity");
                        analyzeCode();
                      }}
                      disabled={isGenerating || !code.trim()}
                      className="h-8 text-xs border-white/10 hover:border-accent/50"
                    >
                      Complexity
                    </Button>
                    <Button
                      data-testid="optimize-btn"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuestion("How can I optimize this code?");
                        analyzeCode();
                      }}
                      disabled={isGenerating || !code.trim()}
                      className="h-8 text-xs border-white/10 hover:border-secondary/50"
                    >
                      Optimize
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};

export default CodeInterview;
