import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  History,
  ArrowLeft,
  Shield,
  Clock,
  Trash2,
  MessageSquare,
  Copy,
  Check,
  ChevronRight,
  Headphones,
  Video,
  Code,
  Download,
  FileJson,
  FileText,
  Brain,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SessionHistory = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [qaHistory, setQaHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails(sessionId);
    } else if (sessions.length > 0) {
      fetchSessionDetails(sessions[0].id);
    }
  }, [sessionId, sessions]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API}/sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (id) => {
    try {
      const [sessionRes, qaRes] = await Promise.all([
        axios.get(`${API}/sessions/${id}`),
        axios.get(`${API}/qa-pairs/${id}`),
      ]);
      setSelectedSession(sessionRes.data);
      setQaHistory(qaRes.data);
    } catch (error) {
      console.error("Failed to fetch session details:", error);
    }
  };

  const deleteSession = async (id) => {
    try {
      await axios.delete(`${API}/sessions/${id}`);
      toast.success("Session deleted");
      fetchSessions();
      if (selectedSession?.id === id) {
        setSelectedSession(null);
        setQaHistory([]);
      }
    } catch (error) {
      toast.error("Failed to delete session");
    }
  };

  const deleteQAPair = async (qaId) => {
    try {
      await axios.delete(`${API}/qa-pairs/${qaId}`);
      toast.success("Q&A deleted");
      if (selectedSession) {
        fetchSessionDetails(selectedSession.id);
      }
    } catch (error) {
      toast.error("Failed to delete Q&A");
    }
  };

  const copyAnswer = async (answer, qaId) => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopiedId(qaId);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const interviewTypeIcon = (type) => {
    switch (type) {
      case "phone":
        return Headphones;
      case "video":
        return Video;
      case "coding":
        return Code;
      case "mock":
        return Brain;
      default:
        return MessageSquare;
    }
  };

  const exportSession = async (format) => {
    if (!selectedSession) return;
    
    try {
      const response = await axios.get(`${API}/sessions/${selectedSession.id}/export?format=${format}`);
      
      if (format === "json") {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedSession.name.replace(/\s+/g, '_')}_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Session exported as JSON!");
      } else if (format === "markdown") {
        const blob = new Blob([response.data.markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedSession.name.replace(/\s+/g, '_')}_export.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Session exported as Markdown!");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export session");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              data-testid="back-btn"
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <span className="font-secondary font-bold tracking-tight text-sm">
                SESSION HISTORY
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="lg:col-span-1">
              <Card className="bg-surface border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="font-secondary font-bold text-sm tracking-tight uppercase">
                    ALL SESSIONS
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-6">
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-16 bg-black/40 rounded-sm animate-pulse"
                          />
                        ))}
                      </div>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="p-12 text-center">
                      <History className="w-10 h-10 text-white/20 mx-auto mb-4" />
                      <p className="text-white/40 text-sm">No sessions yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[60vh]">
                      <div className="p-3 space-y-2">
                        {sessions.map((session) => {
                          const Icon = interviewTypeIcon(session.interview_type);
                          const isSelected = selectedSession?.id === session.id;
                          return (
                            <motion.div
                              key={session.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`p-4 rounded-sm cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-primary/20 border border-primary/30"
                                  : "bg-black/40 border border-white/5 hover:border-white/10"
                              }`}
                              onClick={() => {
                                navigate(`/history/${session.id}`);
                                fetchSessionDetails(session.id);
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-primary" />
                                  <span className="font-primary font-semibold text-sm truncate max-w-[150px]">
                                    {session.name}
                                  </span>
                                </div>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-surface border-white/10">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-white">
                                        Delete Session?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-white/60">
                                        This will permanently delete the session
                                        and all associated Q&A pairs.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-surface border-white/10 text-white hover:bg-white/5">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteSession(session.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-white/40">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(session.created_at)}</span>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-white/5 rounded text-xs font-mono text-white/50 capitalize">
                                  {session.interview_type}
                                </span>
                                <span className="px-2 py-0.5 bg-white/5 rounded text-xs font-mono text-white/50 capitalize">
                                  {session.domain.replace("_", " ")}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Q&A Details */}
            <div className="lg:col-span-2">
              <Card className="bg-surface border-white/10 h-full">
                <CardHeader className="pb-3 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-secondary font-bold text-sm tracking-tight uppercase">
                      {selectedSession?.name || "SELECT A SESSION"}
                    </CardTitle>
                    {selectedSession && (
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              data-testid="export-session-btn"
                              variant="outline"
                              size="sm"
                              className="border-white/10 hover:border-white/20"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Export
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-surface border-white/10">
                            <DropdownMenuItem 
                              onClick={() => exportSession("json")}
                              className="cursor-pointer"
                            >
                              <FileJson className="w-4 h-4 mr-2" />
                              Export as JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => exportSession("markdown")}
                              className="cursor-pointer"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Export as Markdown
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          data-testid="continue-session-btn"
                          size="sm"
                          onClick={() => {
                            if (selectedSession.interview_type === "coding") {
                              navigate(`/code-interview/${selectedSession.id}`);
                            } else if (selectedSession.interview_type === "mock") {
                              navigate(`/mock-interview/${selectedSession.id}`);
                            } else {
                              navigate(`/live-interview/${selectedSession.id}`);
                            }
                          }}
                          className="bg-primary hover:bg-primary/90 font-bold text-xs"
                        >
                          Continue
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!selectedSession ? (
                    <div className="p-12 text-center">
                      <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-4" />
                      <p className="text-white/40 text-sm">
                        Select a session to view Q&A history
                      </p>
                    </div>
                  ) : qaHistory.length === 0 ? (
                    <div className="p-12 text-center">
                      <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-4" />
                      <p className="text-white/40 text-sm">
                        No Q&A pairs in this session
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[60vh]">
                      <div className="p-6 space-y-6">
                        {qaHistory.map((qa, i) => (
                          <motion.div
                            key={qa.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="space-y-3"
                          >
                            {/* Question */}
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-sm ml-8">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wide text-primary/70">
                                  QUESTION
                                </span>
                                <span className="text-xs text-white/30">
                                  {formatDate(qa.created_at)}
                                </span>
                              </div>
                              <p className="font-primary text-sm text-white/90">
                                {qa.question}
                              </p>
                            </div>

                            {/* Answer */}
                            <div className="p-4 bg-black/40 border border-white/5 rounded-sm mr-8">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold uppercase tracking-wide text-white/50">
                                    ANSWER
                                  </span>
                                  <span className="px-2 py-0.5 bg-white/5 rounded text-xs font-mono text-white/40">
                                    {qa.ai_model}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyAnswer(qa.answer, qa.id)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    {copiedId === qa.id ? (
                                      <Check className="w-3 h-3 mr-1 text-secondary" />
                                    ) : (
                                      <Copy className="w-3 h-3 mr-1" />
                                    )}
                                    {copiedId === qa.id ? "Copied" : "Copy"}
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-surface border-white/10">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white">
                                          Delete Q&A?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-white/60">
                                          This will permanently delete this Q&A
                                          pair.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-surface border-white/10 text-white hover:bg-white/5">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteQAPair(qa.id)}
                                          className="bg-destructive hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                              <div className="answer-content text-sm text-white/80 whitespace-pre-wrap">
                                {qa.answer}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionHistory;
