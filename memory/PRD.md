# StealthInterview.ai - Product Requirements Document

## Original Problem Statement
Create an interview assistant for job seekers in the technical field, for phone interviews, video interviews, coding interviews all in one place, stealth so that it is not detected by anyone on video conference using any of the video conference tools, can be used on windows and mac. Need to be good at answering questions, need to sound human and not like it is being read off the internet.

## User Choices
- AI Models: GPT-5.2, Claude Sonnet 4.5, Gemini 3 Flash (all available)
- Speech-to-Text: Web Speech API (browser-based)
- Features: Real-time transcription, code editor, answer history, customizable tone
- Domains: Frontend, Backend, System Design, DSA, Technical Support
- UI: Professional, dark theme, stealth-focused

## User Personas
1. **Job Seeker (Primary)**: Technical professionals preparing for interviews who need real-time assistance
2. **Career Changer**: Professionals transitioning into tech who need domain-specific help
3. **Interview Preparer**: Candidates practicing Q&A before actual interviews

## Core Requirements (Static)
- Real-time speech-to-text transcription
- AI-powered answer generation (multiple models)
- Human-like responses (not robotic)
- Stealth mode for video conferences
- Code editor with AI assistance
- Session management and history
- Cross-platform (Windows/Mac via browser)
- Mock interview practice with AI-generated questions
- Job description and resume context for personalized answers

## What's Been Implemented (v1.2.0) - Feb 14, 2026

### Backend (FastAPI)
- ✅ Session CRUD operations with job description/resume fields
- ✅ AI answer generation with GPT-5.2, Claude Sonnet 4.5, Gemini 3 Flash
- ✅ Context-aware answers using job description and resume
- ✅ Mock interview questions generation endpoint
- ✅ Code assistance endpoint
- ✅ Q&A history management
- ✅ Settings persistence
- ✅ MongoDB integration
- ✅ OpenAI Whisper transcription endpoint
- ✅ Session export (JSON & Markdown formats)

### Frontend (React)
- ✅ Landing page with hero section and features
- ✅ **NEW: Desktop download section (Windows/Mac)**
- ✅ Dashboard with session management (including Mock Prep card)
- ✅ Live Interview mode with real-time transcription
- ✅ Stealth mode overlay (draggable, semi-transparent)
- ✅ Code Interview mode with split-pane editor
- ✅ Mock Interview mode for practice
- ✅ Job description & resume input in session creation
- ✅ Session History page with export functionality
- ✅ Settings page (AI model, tone, stealth opacity)
- ✅ Dark theme with Chivo/Manrope fonts
- ✅ Framer Motion animations
- ✅ Keyboard shortcuts throughout app
- ✅ Whisper transcription toggle
- ✅ Export dropdown (JSON/Markdown)

### Desktop App (Electron) - NEW
- ✅ **Native Windows app (.exe installer)**
- ✅ **Native macOS app (.dmg, Intel & Apple Silicon)**
- ✅ System tray integration with quick menu
- ✅ Global shortcuts (Ctrl+Shift+S for stealth)
- ✅ Native stealth overlay window (always-on-top, transparent)
- ✅ Auto-update support
- ✅ Single instance lock
- ✅ Custom application menu
- ✅ Build scripts for all platforms

### Key Features Working
- ✅ Web Speech API for voice input
- ✅ OpenAI Whisper for enhanced transcription
- ✅ AI model switching (GPT-5.2, Claude, Gemini)
- ✅ Tone customization (Professional, Casual, Technical)
- ✅ Domain expertise selection
- ✅ Copy-to-clipboard functionality
- ✅ Session persistence
- ✅ Stealth mode with adjustable opacity
- ✅ Mock interview with AI-generated questions
- ✅ Personalized answers based on job description/resume
- ✅ Question tips and difficulty levels
- ✅ Keyboard shortcuts (Ctrl+Enter, Ctrl+M, Esc, Ctrl+Shift+C)
- ✅ Session export to JSON/Markdown
- ✅ **Desktop app with native OS integration**

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl+Enter | Submit question |
| Ctrl+M | Toggle microphone |
| Escape | Toggle stealth mode / Minimize |
| Ctrl+Shift+C | Copy answer to clipboard |

## Prioritized Backlog

### P0 (Critical - Not Implemented)
- None - Core MVP complete

### P1 (High Priority)
- OpenAI Whisper integration for better transcription accuracy
- Audio output (text-to-speech for answers)
- Keyboard shortcuts for quick actions
- Export session history to PDF

### P2 (Medium Priority)
- Practice mode with mock interview questions
- Performance analytics (response time, topics covered)
- Team/shared sessions
- Browser extension for easier access
- Custom prompt templates

### P3 (Nice to Have)
- Mobile-responsive stealth mode
- Interview recording (with consent)
- Integration with job boards
- AI-suggested follow-up questions

## Architecture
```
Frontend (React + Tailwind)
├── Landing Page (with Desktop Downloads)
├── Dashboard
├── Live Interview Mode
├── Code Interview Mode
├── Mock Interview Mode
├── Session History (with Export)
└── Settings

Backend (FastAPI)
├── /api/sessions (CRUD with job desc/resume)
├── /api/generate-answer (AI with context)
├── /api/generate-mock-questions
├── /api/code-assist (Code AI)
├── /api/transcribe (Whisper STT)
├── /api/sessions/:id/export (JSON/Markdown)
├── /api/qa-pairs (History)
└── /api/settings (Config)

Desktop App (Electron)
├── main.js (Window management, Tray, Shortcuts)
├── preload.js (IPC bridge)
├── assets/ (Icons)
└── dist/ (Built installers)
   ├── StealthInterview-Windows.exe
   └── StealthInterview-Mac.dmg

Database (MongoDB)
├── sessions (with job_description, resume, company_name, role_title)
├── qa_pairs
└── settings

AI Integration (Emergent LLM)
├── OpenAI GPT-5.2
├── Anthropic Claude Sonnet 4.5
├── Google Gemini 3 Flash
└── OpenAI Whisper (STT)
```

## Next Tasks
1. Set up GitHub releases for desktop app distribution
2. Add interview timer/countdown feature
3. Add performance analytics dashboard
4. Browser extension for easier access
