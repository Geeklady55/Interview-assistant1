import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import LiveInterview from "@/pages/LiveInterview";
import CodeInterview from "@/pages/CodeInterview";
import SessionHistory from "@/pages/SessionHistory";
import Settings from "@/pages/Settings";

function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-interview" element={<LiveInterview />} />
          <Route path="/live-interview/:sessionId" element={<LiveInterview />} />
          <Route path="/code-interview" element={<CodeInterview />} />
          <Route path="/code-interview/:sessionId" element={<CodeInterview />} />
          <Route path="/history" element={<SessionHistory />} />
          <Route path="/history/:sessionId" element={<SessionHistory />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
