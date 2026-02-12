import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings as SettingsIcon,
  ArrowLeft,
  Shield,
  Save,
  Loader2,
  Bot,
  MessageSquare,
  Eye,
  Copy,
  Zap,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    default_ai_model: "gpt-5.2",
    default_tone: "professional",
    default_domain: "general",
    stealth_opacity: 0.1,
    auto_copy: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
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
              <SettingsIcon className="w-5 h-5 text-primary" />
              <span className="font-secondary font-bold tracking-tight text-sm">
                SETTINGS
              </span>
            </div>
          </div>
          <Button
            data-testid="save-settings-btn"
            onClick={saveSettings}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 font-bold"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-surface border border-white/10 rounded-sm animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* AI Model Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-surface border-white/10">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="font-secondary font-bold text-sm tracking-tight uppercase">
                          AI MODEL
                        </CardTitle>
                        <CardDescription className="text-white/50 text-xs">
                          Choose your default AI model for generating answers
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-white/70 font-primary text-sm uppercase tracking-wide">
                        Default Model
                      </Label>
                      <Select
                        value={settings.default_ai_model}
                        onValueChange={(value) =>
                          setSettings({ ...settings, default_ai_model: value })
                        }
                      >
                        <SelectTrigger data-testid="default-model-select" className="bg-black/40 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-white/10">
                          <SelectItem value="gpt-5.2">
                            <div className="flex items-center gap-2">
                              <Zap className="w-3 h-3 text-secondary" />
                              GPT-5.2 (Recommended)
                            </div>
                          </SelectItem>
                          <SelectItem value="claude-sonnet-4.5">
                            Claude Sonnet 4.5
                          </SelectItem>
                          <SelectItem value="gemini-3-flash">
                            Gemini 3 Flash
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-white/40">
                        GPT-5.2 offers the most natural, human-like responses.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Response Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-surface border-white/10">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-secondary/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <CardTitle className="font-secondary font-bold text-sm tracking-tight uppercase">
                          RESPONSE STYLE
                        </CardTitle>
                        <CardDescription className="text-white/50 text-xs">
                          Customize how AI answers sound
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-white/70 font-primary text-sm uppercase tracking-wide">
                        Default Tone
                      </Label>
                      <Select
                        value={settings.default_tone}
                        onValueChange={(value) =>
                          setSettings({ ...settings, default_tone: value })
                        }
                      >
                        <SelectTrigger data-testid="default-tone-select" className="bg-black/40 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-white/10">
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white/70 font-primary text-sm uppercase tracking-wide">
                        Default Domain
                      </Label>
                      <Select
                        value={settings.default_domain}
                        onValueChange={(value) =>
                          setSettings({ ...settings, default_domain: value })
                        }
                      >
                        <SelectTrigger data-testid="default-domain-select" className="bg-black/40 border-white/10">
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
                  </CardContent>
                </Card>
              </motion.div>

              {/* Stealth Mode Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-surface border-white/10">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-accent/20 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="font-secondary font-bold text-sm tracking-tight uppercase">
                          STEALTH MODE
                        </CardTitle>
                        <CardDescription className="text-white/50 text-xs">
                          Configure the invisible overlay behavior
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-white/70 font-primary text-sm uppercase tracking-wide">
                          Idle Opacity: {Math.round(settings.stealth_opacity * 100)}%
                        </Label>
                      </div>
                      <Slider
                        data-testid="stealth-opacity-slider"
                        value={[settings.stealth_opacity]}
                        min={0.05}
                        max={0.5}
                        step={0.05}
                        onValueChange={([value]) =>
                          setSettings({ ...settings, stealth_opacity: value })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-white/40">
                        Lower values make the overlay more invisible when not hovered.
                        Recommended: 10% for maximum stealth.
                      </p>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-white/70 font-primary text-sm uppercase tracking-wide flex items-center gap-2">
                          <Copy className="w-4 h-4" />
                          Auto-Copy Answers
                        </Label>
                        <p className="text-xs text-white/40">
                          Automatically copy answers to clipboard
                        </p>
                      </div>
                      <Switch
                        data-testid="auto-copy-switch"
                        checked={settings.auto_copy}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, auto_copy: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* About */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-surface border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-sm bg-primary/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-secondary font-bold text-sm tracking-tight">
                          STEALTH<span className="text-primary">INTERVIEW</span>.AI
                        </h3>
                        <p className="text-xs text-white/40 mt-1">
                          Version 1.0.0 • Your invisible interview co-pilot
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
