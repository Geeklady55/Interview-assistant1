import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Mic,
  Code,
  History,
  Settings,
  Plus,
  ArrowRight,
  Clock,
  Shield,
  Headphones,
  Video,
  Trash2,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    name: "",
    interview_type: "video",
    domain: "general",
  });

  useEffect(() => {
    fetchSessions();
  }, []);

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

  const createSession = async () => {
    if (!newSession.name.trim()) {
      toast.error("Please enter a session name");
      return;
    }

    try {
      const response = await axios.post(`${API}/sessions`, newSession);
      toast.success("Session created successfully!");
      setCreateDialogOpen(false);
      setNewSession({ name: "", interview_type: "video", domain: "general" });
      
      // Navigate to appropriate interview mode
      if (newSession.interview_type === "coding") {
        navigate(`/code-interview/${response.data.id}`);
      } else {
        navigate(`/live-interview/${response.data.id}`);
      }
    } catch (error) {
      toast.error("Failed to create session");
      console.error(error);
    }
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/sessions/${sessionId}`);
      toast.success("Session deleted");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to delete session");
    }
  };

  const interviewTypeIcon = (type) => {
    switch (type) {
      case "phone": return Headphones;
      case "video": return Video;
      case "coding": return Code;
      default: return Mic;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-secondary font-bold tracking-tight">STEALTH<span className="text-primary">INTERVIEW</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              data-testid="nav-history-btn"
              variant="ghost" 
              onClick={() => navigate("/history")}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button 
              data-testid="nav-settings-btn"
              variant="ghost" 
              onClick={() => navigate("/settings")}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="font-secondary font-black text-3xl sm:text-4xl tracking-tight uppercase mb-2">
              COMMAND <span className="text-primary">CENTER</span>
            </h1>
            <p className="text-white/50 font-primary">
              Start a new interview session or continue where you left off
            </p>
          </motion.div>

          {/* Quick Start Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* New Session Card - Large */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 lg:row-span-2"
            >
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Card 
                    data-testid="new-session-card"
                    className="h-full bg-primary/10 border-primary/30 hover:border-primary/50 cursor-pointer transition-all card-interactive"
                  >
                    <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-pulse-glow">
                        <Plus className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-secondary font-bold text-xl tracking-tight uppercase mb-2">
                        START NEW SESSION
                      </h3>
                      <p className="text-white/50 font-primary text-sm">
                        Begin a new interview preparation session
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="bg-surface border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle className="font-secondary font-bold tracking-tight uppercase">
                      CREATE SESSION
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <Label className="text-white/70 font-primary text-sm uppercase tracking-wide">
                        Session Name
                      </Label>
                      <Input
                        data-testid="session-name-input"
                        placeholder="e.g., Google SWE Interview"
                        value={newSession.name}
                        onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                        className="bg-[#0A0A0A] border-white/10 focus:border-primary/50 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 font-primary text-sm uppercase tracking-wide">
                        Interview Type
                      </Label>
                      <Select
                        value={newSession.interview_type}
                        onValueChange={(value) => setNewSession({ ...newSession, interview_type: value })}
                      >
                        <SelectTrigger data-testid="interview-type-select" className="bg-[#0A0A0A] border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-white/10">
                          <SelectItem value="phone">Phone Interview</SelectItem>
                          <SelectItem value="video">Video Interview</SelectItem>
                          <SelectItem value="coding">Coding Interview</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 font-primary text-sm uppercase tracking-wide">
                        Domain
                      </Label>
                      <Select
                        value={newSession.domain}
                        onValueChange={(value) => setNewSession({ ...newSession, domain: value })}
                      >
                        <SelectTrigger data-testid="domain-select" className="bg-[#0A0A0A] border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-white/10">
                          <SelectItem value="general">General Technical</SelectItem>
                          <SelectItem value="frontend">Frontend Development</SelectItem>
                          <SelectItem value="backend">Backend Development</SelectItem>
                          <SelectItem value="system_design">System Design</SelectItem>
                          <SelectItem value="dsa">Data Structures & Algorithms</SelectItem>
                          <SelectItem value="technical_support">Technical Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      data-testid="create-session-btn"
                      onClick={createSession}
                      className="w-full bg-primary hover:bg-primary/90 font-bold tracking-wide btn-glow"
                    >
                      CREATE & START
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card 
                data-testid="quick-live-interview-card"
                className="bg-surface border-white/10 hover:border-secondary/50 cursor-pointer transition-all card-interactive h-full"
                onClick={() => navigate("/live-interview")}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-sm bg-secondary/20 flex items-center justify-center mb-4">
                    <Mic className="w-5 h-5 text-secondary" />
                  </div>
                  <h3 className="font-secondary font-bold text-sm tracking-tight uppercase mb-1">
                    LIVE MODE
                  </h3>
                  <p className="text-white/40 text-xs font-primary">
                    Real-time transcription
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card 
                data-testid="quick-code-interview-card"
                className="bg-surface border-white/10 hover:border-accent/50 cursor-pointer transition-all card-interactive h-full"
                onClick={() => navigate("/code-interview")}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-sm bg-accent/20 flex items-center justify-center mb-4">
                    <Code className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-secondary font-bold text-sm tracking-tight uppercase mb-1">
                    CODE MODE
                  </h3>
                  <p className="text-white/40 text-xs font-primary">
                    Coding assistance
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card 
                data-testid="quick-history-card"
                className="bg-surface border-white/10 hover:border-white/30 cursor-pointer transition-all card-interactive h-full"
                onClick={() => navigate("/history")}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-sm bg-white/10 flex items-center justify-center mb-4">
                    <History className="w-5 h-5 text-white/70" />
                  </div>
                  <h3 className="font-secondary font-bold text-sm tracking-tight uppercase mb-1">
                    HISTORY
                  </h3>
                  <p className="text-white/40 text-xs font-primary">
                    Past sessions
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card 
                data-testid="quick-settings-card"
                className="bg-surface border-white/10 hover:border-white/30 cursor-pointer transition-all card-interactive h-full"
                onClick={() => navigate("/settings")}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-sm bg-white/10 flex items-center justify-center mb-4">
                    <Settings className="w-5 h-5 text-white/70" />
                  </div>
                  <h3 className="font-secondary font-bold text-sm tracking-tight uppercase mb-1">
                    SETTINGS
                  </h3>
                  <p className="text-white/40 text-xs font-primary">
                    Configure AI
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-secondary font-bold text-lg tracking-tight uppercase">
                RECENT SESSIONS
              </h2>
              {sessions.length > 0 && (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/history")}
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-surface border border-white/10 rounded-sm animate-pulse" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <Card className="bg-surface border-white/10">
                <CardContent className="p-12 text-center">
                  <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40 font-primary">
                    No sessions yet. Start your first interview!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.slice(0, 6).map((session, i) => {
                  const Icon = interviewTypeIcon(session.interview_type);
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                    >
                      <Card 
                        data-testid={`session-card-${session.id}`}
                        className="bg-surface border-white/10 hover:border-primary/30 cursor-pointer transition-all card-interactive group"
                        onClick={() => {
                          if (session.interview_type === "coding") {
                            navigate(`/code-interview/${session.id}`);
                          } else {
                            navigate(`/live-interview/${session.id}`);
                          }
                        }}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-8 h-8 rounded-sm bg-primary/20 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => deleteSession(e, session.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <h3 className="font-primary font-semibold text-sm mb-1 truncate">
                            {session.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-white/40 font-primary">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(session.created_at)}</span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-white/5 rounded text-xs font-mono text-white/50 capitalize">
                              {session.interview_type}
                            </span>
                            <span className="px-2 py-0.5 bg-white/5 rounded text-xs font-mono text-white/50 capitalize">
                              {session.domain.replace("_", " ")}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
