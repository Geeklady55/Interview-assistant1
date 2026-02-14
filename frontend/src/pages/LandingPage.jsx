import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  Code, 
  Eye, 
  Zap, 
  Shield, 
  ChevronRight,
  Monitor,
  Headphones,
  Video,
  Download,
  Apple,
  MonitorDown,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      icon: Mic,
      title: "REAL-TIME TRANSCRIPTION",
      description: "Instantly capture interview questions with advanced speech recognition. Works with any video conferencing tool.",
      color: "#007AFF"
    },
    {
      icon: Zap,
      title: "AI-POWERED ANSWERS",
      description: "Get human-like responses from GPT-5.2, Claude, or Gemini. Sounds natural, not robotic.",
      color: "#32D74B"
    },
    {
      icon: Code,
      title: "CODING ASSISTANCE",
      description: "Built-in code editor with syntax highlighting. Get explanations and improvements in real-time.",
      color: "#FFD60A"
    },
    {
      icon: Eye,
      title: "STEALTH MODE",
      description: "Transparent, draggable overlay that's invisible to screen sharing. Only you can see it.",
      color: "#FF453A"
    }
  ];

  const interviewTypes = [
    { icon: Headphones, label: "Phone Interviews", desc: "Audio-only calls" },
    { icon: Video, label: "Video Interviews", desc: "Zoom, Teams, Meet" },
    { icon: Code, label: "Coding Interviews", desc: "LeetCode, HackerRank" }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-4 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-secondary font-bold text-lg tracking-tight">STEALTH<span className="text-primary">INTERVIEW</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              data-testid="nav-pricing-btn"
              variant="ghost"
              onClick={() => navigate("/pricing")}
              className="text-white/70 hover:text-white hover:bg-white/5 font-bold"
            >
              PRICING
            </Button>
            <Button 
              data-testid="nav-get-started-btn"
              onClick={() => navigate("/dashboard")}
              className="bg-primary hover:bg-primary/90 text-white rounded-sm font-bold tracking-wide btn-glow"
            >
              GET STARTED
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-bg relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-transparent to-[#050505]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            <span className="text-sm font-primary text-white/70">Stealth Mode Active</span>
          </div>
          
          <h1 className="font-secondary font-black text-5xl sm:text-6xl lg:text-7xl tracking-tight mb-6 uppercase">
            DOMINATE THE<br />
            <span className="text-primary">INTERVIEW</span>
          </h1>
          
          <p className="text-base lg:text-lg text-white/60 font-primary mb-10 max-w-2xl mx-auto">
            Your invisible AI co-pilot for technical interviews. Real-time answers that sound human, 
            work across all platforms, and stay completely hidden from screen sharing.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              data-testid="hero-start-interview-btn"
              onClick={() => navigate("/dashboard")}
              className="bg-primary hover:bg-primary/90 text-white rounded-sm font-bold text-base px-8 py-6 btn-glow animate-pulse-glow"
            >
              START INTERVIEW
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              data-testid="hero-see-demo-btn"
              variant="outline"
              onClick={() => navigate("/live-interview")}
              className="border-white/20 hover:border-white/40 text-white bg-transparent rounded-sm font-bold text-base px-8 py-6"
            >
              TRY DEMO
            </Button>
          </div>

          {/* Interview Types */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {interviewTypes.map((type, i) => (
              <motion.div
                key={type.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 px-5 py-4 bg-surface/50 border border-white/10 rounded-sm"
              >
                <type.icon className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-primary font-semibold text-sm">{type.label}</p>
                  <p className="font-primary text-xs text-white/50">{type.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-[#050505] relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-secondary font-black text-3xl sm:text-4xl tracking-tight uppercase mb-4">
              TACTICAL <span className="text-primary">FEATURES</span>
            </h2>
            <p className="text-white/50 font-primary max-w-xl mx-auto">
              Everything you need to ace your technical interviews
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="bento-item p-8 cursor-pointer card-interactive"
                style={{
                  borderColor: hoveredFeature === i ? `${feature.color}50` : undefined,
                  boxShadow: hoveredFeature === i ? `0 0 30px ${feature.color}20` : undefined
                }}
              >
                <div 
                  className="w-12 h-12 rounded-sm flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="font-secondary font-bold text-lg tracking-tight mb-3">
                  {feature.title}
                </h3>
                <p className="font-primary text-white/50 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Support Section */}
      <section className="py-24 px-6 bg-surface border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-secondary font-black text-3xl sm:text-4xl tracking-tight uppercase mb-6">
                WORKS ON<br /><span className="text-primary">ANY PLATFORM</span>
              </h2>
              <p className="text-white/50 font-primary mb-8">
                StealthInterview runs in your browser - compatible with Windows, Mac, and Linux. 
                Use it with Zoom, Google Meet, Microsoft Teams, or any other video conferencing tool.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Zoom", "Google Meet", "Teams", "WebEx", "Discord"].map((platform) => (
                  <span 
                    key={platform}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-sm font-primary"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1608181204104-5b49c215fcba?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                alt="Clean monitor setup"
                className="rounded-sm border border-white/10 w-full"
              />
              <div className="absolute bottom-4 right-4 glass px-4 py-2 rounded-sm flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono">Cross-platform</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Desktop Download Section */}
      <section className="py-24 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-secondary font-black text-3xl sm:text-4xl tracking-tight uppercase mb-4">
              DOWNLOAD <span className="text-secondary">DESKTOP APP</span>
            </h2>
            <p className="text-white/50 font-primary max-w-xl mx-auto">
              Get the full desktop experience with system tray integration, global shortcuts, and native stealth mode
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Windows Download */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="bento-item p-8 text-center card-interactive group">
                <div className="w-16 h-16 rounded-sm bg-primary/20 flex items-center justify-center mb-6 mx-auto group-hover:bg-primary/30 transition-colors">
                  <MonitorDown className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-secondary font-bold text-lg tracking-tight mb-2">
                  WINDOWS
                </h3>
                <p className="text-white/40 text-sm font-primary mb-4">
                  Windows 10/11 (64-bit)
                </p>
                <a 
                  href="/api/desktop/download?platform=windows"
                  download="StealthInterview-Desktop-Windows.zip"
                >
                  <Button
                    data-testid="download-windows-btn"
                    className="bg-primary hover:bg-primary/90 font-bold w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download for Windows
                  </Button>
                </a>
                <p className="text-xs text-white/30 mt-3 font-mono">v1.2.0 • Source + Build Script</p>
              </div>
            </motion.div>

            {/* Mac Download */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="bento-item p-8 text-center card-interactive group">
                <div className="w-16 h-16 rounded-sm bg-white/10 flex items-center justify-center mb-6 mx-auto group-hover:bg-white/20 transition-colors">
                  <Apple className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-secondary font-bold text-lg tracking-tight mb-2">
                  macOS
                </h3>
                <p className="text-white/40 text-sm font-primary mb-4">
                  macOS 10.15+ (Intel & Apple Silicon)
                </p>
                <a 
                  href="/api/desktop/download?platform=mac"
                  download="StealthInterview-Desktop-Mac.zip"
                >
                  <Button
                    data-testid="download-mac-btn"
                    variant="outline"
                    className="border-white/20 hover:border-white/40 font-bold w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download for Mac
                  </Button>
                </a>
                <p className="text-xs text-white/30 mt-3 font-mono">v1.2.0 • Source + Build Script</p>
              </div>
            </motion.div>
          </div>

          {/* Build Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="mt-8 max-w-3xl mx-auto"
          >
            <div className="bg-surface/80 border border-white/10 rounded-sm p-6">
              <h4 className="font-secondary font-bold text-sm tracking-tight mb-4 flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                QUICK BUILD INSTRUCTIONS
              </h4>
              <div className="font-mono text-xs text-white/60 space-y-2">
                <p className="text-white/40"># 1. Extract the downloaded zip</p>
                <p className="text-white/40"># 2. Open terminal in the extracted folder</p>
                <p>yarn install</p>
                <p className="text-white/40"># 3. Build for your platform:</p>
                <p>yarn build:win  <span className="text-white/30"># Windows</span></p>
                <p>yarn build:mac  <span className="text-white/30"># macOS</span></p>
                <p className="text-white/40"># 4. Find installer in dist/ folder</p>
              </div>
            </div>
          </motion.div>

          {/* Desktop Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 max-w-3xl mx-auto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "System Tray", desc: "Quick access" },
                { label: "Global Shortcuts", desc: "Ctrl+Shift+S" },
                { label: "Auto Updates", desc: "Always current" },
                { label: "Native Stealth", desc: "True invisibility" },
              ].map((item) => (
                <div key={item.label} className="text-center p-4 bg-surface/50 border border-white/5 rounded-sm">
                  <p className="font-secondary font-bold text-xs tracking-tight text-white/80">{item.label}</p>
                  <p className="text-xs text-white/40 font-primary mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-[#050505]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="font-secondary font-black text-3xl sm:text-4xl tracking-tight uppercase mb-6">
            READY TO <span className="text-secondary">ACE</span> YOUR INTERVIEW?
          </h2>
          <p className="text-white/50 font-primary mb-10">
            Join thousands of technical candidates who landed their dream jobs with StealthInterview.
          </p>
          <Button 
            data-testid="cta-start-now-btn"
            onClick={() => navigate("/dashboard")}
            className="bg-primary hover:bg-primary/90 text-white rounded-sm font-bold text-base px-10 py-6 btn-glow"
          >
            START NOW - IT'S FREE
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-primary text-sm text-white/50">StealthInterview.ai</span>
          </div>
          <p className="font-primary text-xs text-white/30">
            Your interviews. Your privacy. Your success.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
