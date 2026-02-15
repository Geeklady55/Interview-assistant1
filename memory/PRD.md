# StealthInterview.ai - Product Requirements Document

## Original Problem Statement
Create an interview assistant for job seekers in the technical field, for phone interviews, video interviews, coding interviews all in one place, stealth so that it is not detected by anyone on video conference using any of the video conference tools, can be used on windows and mac. Need to be good at answering questions, need to sound human and not like it is being read off the internet.

## Subscription Requirements
- **Tiers:** Free, Beginner ($25/mo), Advanced ($59/mo), Executive ($75/mo)
- **Discounts:** 10% for quarterly payments, 25% for yearly
- **Payment Methods:** Visa, Mastercard, Affirm, Venmo (via Stripe)
- **Feature Limits:**
  - Live Interviews: 5 (Free), 7 (Beginner), Unlimited (Advanced & Executive)
  - Session Duration: 15 mins (Free), 20 mins (Beginner), 90 mins (Advanced & Executive)
- **Executive Benefits:** Personal Interview Coach AI, Resume Optimization Assistant, 1-on-1 Expert Review Sessions

## User Choices
- AI Models: GPT-5.2, Claude Sonnet 4.5, Gemini 3 Flash (all available)
- Speech-to-Text: Web Speech API (browser-based) + OpenAI Whisper
- **Text-to-Speech:** Browser's built-in Web Speech API (no external API needed)
- **Answer Format:** Key Points + Brief Explanation (shorter, interview-ready)
- Features: Real-time transcription, code editor, answer history, customizable tone
- Domains: Frontend, Backend, System Design, DSA, Technical Support
- UI: Professional, dark theme, stealth-focused

## What's Been Implemented (v1.4.0) - Feb 15, 2026

### Backend (FastAPI)
- ✅ Session CRUD operations with subscription tracking
- ✅ AI answer generation with GPT-5.2, Claude Sonnet 4.5, Gemini 3 Flash
- ✅ Context-aware answers using job description and resume
- ✅ **NEW: Shorter answers with Key Points + Brief Explanation format**
- ✅ **NEW: Mock interview questions with pre-generated suggested answers**
- ✅ Code assistance endpoint
- ✅ Q&A history management
- ✅ Settings persistence
- ✅ MongoDB integration
- ✅ OpenAI Whisper transcription endpoint
- ✅ Session export (JSON & Markdown formats)
- ✅ Subscription plans with tiered pricing
- ✅ Stripe checkout integration
- ✅ Feature gating based on subscription limits
- ✅ Usage tracking per user

### Frontend (React)
- ✅ Landing page with hero section and features
- ✅ Desktop download section (Windows/Mac)
- ✅ Dashboard with session management
- ✅ Live Interview mode with real-time transcription
- ✅ **NEW: Text-to-Speech (TTS) for answers using Web Speech API**
- ✅ **NEW: Speaker icon to read answers aloud**
- ✅ Session timer with duration limits
- ✅ Time warning notifications (2 min remaining)
- ✅ Session expiry handling with upgrade prompts
- ✅ Stealth mode overlay (draggable, semi-transparent)
- ✅ Code Interview mode with split-pane editor
- ✅ **NEW: Mock Interview with pre-generated suggested answers**
- ✅ **NEW: TTS for questions in Mock Interview**
- ✅ **NEW: TTS for suggested answers in Mock Interview**
- ✅ **NEW: Show/Hide toggle for suggested answers**
- ✅ Pricing page with 4 subscription tiers
- ✅ Billing cycle toggle (Monthly/Quarterly/Yearly)
- ✅ Executive exclusive benefits section
- ✅ Stripe checkout flow
- ✅ Session History page with export functionality
- ✅ Settings page (AI model, tone, stealth opacity)
- ✅ Dark theme with Chivo/Manrope fonts
- ✅ Framer Motion animations
- ✅ Keyboard shortcuts throughout app

### Answer Format (NEW)
All AI-generated answers now use this structure:
```
**Key Points:**
• [First key point - concise, actionable]
• [Second key point - with specific example]
• [Third key point - practical insight]

**Brief Explanation:**
[1-2 sentences expanding on key points in conversational style]
```

### Text-to-Speech Features (NEW)
- **Mock Interview:**
  - Speaker icon to read questions aloud
  - Speaker icon to read suggested answers aloud
  - Stop button to pause speech
- **Live Interview:**
  - Speaker icon next to Copy to read AI answers aloud
  - Uses browser's native Web Speech API (no API key needed)

## API Endpoints

### Core Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate-answer` | POST | Generate AI answer with Key Points format |
| `/api/generate-mock-questions` | POST | Generate questions with suggested answers |
| `/api/sessions` | POST | Create new interview session |
| `/api/transcribe` | POST | Transcribe audio with Whisper |

### Subscription Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plans` | GET | Get all subscription plans |
| `/api/subscriptions/checkout` | POST | Create Stripe checkout session |
| `/api/subscriptions/check-limits` | GET | Check user's usage limits |

## Database Schema

### sessions Collection
```json
{
  "id": "uuid",
  "name": "Session Name",
  "interview_type": "video|phone|coding|mock",
  "domain": "frontend|backend|...",
  "email": "user@example.com",
  "duration_limit": 15,
  "created_at": "ISO datetime"
}
```

## Prioritized Backlog

### P0 (Critical) - COMPLETE ✅
- ✅ Subscription system with Stripe
- ✅ Feature gating based on plan limits
- ✅ Session timer with duration enforcement
- ✅ Shorter answers with key points
- ✅ Text-to-Speech for questions and answers
- ✅ Pre-generated suggested answers in Mock Prep

### P1 (High Priority) - Remaining
- ⬜ Code signing for macOS desktop builds
- ⬜ Windows code signing certificate
- ⬜ Production Stripe keys integration

### P2 (Medium Priority)
- ⬜ Export session history to PDF
- ⬜ Email notifications for subscription events
- ⬜ Usage analytics dashboard

## Testing Status
- Backend API: ✅ All endpoints tested (9/9 passed)
- Frontend UI: ✅ All features verified
- TTS: ✅ Speaker icons present and functional
- Mock Answers: ✅ Pre-generated with Key Points format
- Session Timer: ✅ Displays correctly

## Architecture
```
Frontend (React + Tailwind + shadcn/ui)
├── Landing Page
├── Dashboard
├── Live Interview (with TTS + Timer)
├── Mock Interview (with Suggested Answers + TTS)
├── Code Interview
├── Pricing Page
├── Session History
└── Settings

Backend (FastAPI)
├── /api/generate-answer (Key Points format)
├── /api/generate-mock-questions (with suggested_answer)
├── /api/sessions (with duration_limit)
├── /api/subscriptions/*
└── /api/transcribe (Whisper STT)

AI Integration (Emergent LLM)
├── OpenAI GPT-5.2
├── Anthropic Claude Sonnet 4.5
├── Google Gemini 3 Flash
└── OpenAI Whisper (STT)

TTS (Browser Native)
└── Web Speech API (speechSynthesis)
```
