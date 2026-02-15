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
- Features: Real-time transcription, code editor, answer history, customizable tone
- Domains: Frontend, Backend, System Design, DSA, Technical Support
- UI: Professional, dark theme, stealth-focused

## What's Been Implemented (v1.3.0) - Feb 14, 2026

### Backend (FastAPI)
- ✅ Session CRUD operations with subscription tracking
- ✅ AI answer generation with GPT-5.2, Claude Sonnet 4.5, Gemini 3 Flash
- ✅ Context-aware answers using job description and resume
- ✅ Mock interview questions generation endpoint
- ✅ Code assistance endpoint
- ✅ Q&A history management
- ✅ Settings persistence
- ✅ MongoDB integration
- ✅ OpenAI Whisper transcription endpoint
- ✅ Session export (JSON & Markdown formats)
- ✅ **NEW: Subscription plans with tiered pricing**
- ✅ **NEW: Stripe checkout integration**
- ✅ **NEW: Feature gating based on subscription limits**
- ✅ **NEW: Usage tracking per user**

### Frontend (React)
- ✅ Landing page with hero section and features
- ✅ Desktop download section (Windows/Mac)
- ✅ Dashboard with session management
- ✅ Live Interview mode with real-time transcription
- ✅ **NEW: Session timer with duration limits**
- ✅ **NEW: Time warning notifications (2 min remaining)**
- ✅ **NEW: Session expiry handling with upgrade prompts**
- ✅ Stealth mode overlay (draggable, semi-transparent)
- ✅ Code Interview mode with split-pane editor
- ✅ Mock Interview mode for practice
- ✅ **NEW: Pricing page with 4 subscription tiers**
- ✅ **NEW: Billing cycle toggle (Monthly/Quarterly/Yearly)**
- ✅ **NEW: Executive exclusive benefits section**
- ✅ **NEW: Stripe checkout flow**
- ✅ Session History page with export functionality
- ✅ Settings page (AI model, tone, stealth opacity)
- ✅ Dark theme with Chivo/Manrope fonts
- ✅ Framer Motion animations
- ✅ Keyboard shortcuts throughout app

### Subscription System (NEW)
- ✅ **4 Tiers:** Free, Beginner ($25), Advanced ($59), Executive ($75)
- ✅ **Discounts:** 10% quarterly, 25% yearly (pre-calculated)
- ✅ **Feature Limits:** Interview count and duration enforced
- ✅ **Usage Tracking:** Tracks live interviews, mock interviews, code sessions
- ✅ **Stripe Integration:** Test mode checkout with real sessions
- ✅ **Payment Methods:** Card (Visa, Mastercard), Affirm, Venmo shown

### Desktop App (Electron)
- ✅ Native Windows app (.exe installer)
- ✅ Native macOS app (.dmg, Intel & Apple Silicon)
- ✅ System tray integration with quick menu
- ✅ Global shortcuts (Ctrl+Shift+S for stealth)
- ✅ Native stealth overlay window (always-on-top, transparent)
- ✅ Auto-update support with version checking

### CI/CD & Distribution
- ✅ GitHub Actions workflow for automated builds
- ✅ Multi-platform builds (Windows/Mac/Linux)
- ✅ Mac code signing & notarization configuration
- ✅ Auto-update server with version management
- ✅ Release management API

## API Endpoints

### Subscription Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plans` | GET | Get all subscription plans |
| `/api/plans/{plan_id}` | GET | Get specific plan details |
| `/api/subscriptions/checkout` | POST | Create Stripe checkout session |
| `/api/subscriptions/status/{session_id}` | GET | Check payment status |
| `/api/subscriptions/check-limits` | GET | Check user's usage limits |
| `/api/subscriptions/{email}` | GET | Get user subscription details |
| `/api/webhook/stripe` | POST | Handle Stripe webhooks |

### Core Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions` | POST | Create new interview session |
| `/api/generate-answer` | POST | Generate AI answer |
| `/api/transcribe` | POST | Transcribe audio with Whisper |
| `/api/code-assist` | POST | Get code assistance |

## Database Schema

### subscriptions Collection
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "plan": "free|beginner|advanced|executive",
  "billing_cycle": "monthly|quarterly|yearly",
  "status": "active|cancelled|expired",
  "live_interviews_used": 0,
  "mock_interviews_used": 0,
  "code_sessions_used": 0,
  "current_period_start": "ISO datetime",
  "current_period_end": "ISO datetime"
}
```

### sessions Collection (Updated)
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

### P1 (High Priority) - Remaining
- ⬜ Code signing for macOS desktop builds
- ⬜ Windows code signing certificate
- ⬜ Production Stripe keys integration

### P2 (Medium Priority)
- ⬜ Audio output (text-to-speech for answers)
- ⬜ Export session history to PDF
- ⬜ Email notifications for subscription events
- ⬜ Usage analytics dashboard

### P3 (Nice to Have)
- ⬜ Team/shared sessions
- ⬜ Browser extension for easier access
- ⬜ Interview recording (with consent)
- ⬜ Integration with job boards

## Known Issues

### Pending Issues
1. **Desktop Download (P1):** Currently serves zip of source code instead of pre-built installers. CI/CD pipeline exists but needs GitHub repository setup.
2. **Whisper Testing (P2):** Speech-to-text endpoint not fully tested with real audio data.

### Resolved Issues
- ✅ Subscription feature gating now enforces limits
- ✅ Interview timer shows remaining time and warns users

## Architecture
```
Frontend (React + Tailwind + shadcn/ui)
├── Landing Page (with Desktop Downloads)
├── Dashboard
├── Live Interview Mode (with Timer)
├── Code Interview Mode
├── Mock Interview Mode
├── Pricing Page (NEW)
├── Session History (with Export)
└── Settings

Backend (FastAPI)
├── /api/plans (Subscription tiers)
├── /api/subscriptions/* (Payment & limits)
├── /api/sessions (with feature gating)
├── /api/generate-answer (AI)
├── /api/transcribe (Whisper STT)
├── /api/code-assist
└── /api/desktop/* (Updates)

Database (MongoDB)
├── sessions
├── subscriptions (NEW)
├── payment_transactions (NEW)
├── qa_pairs
├── settings
└── releases

AI Integration (Emergent LLM)
├── OpenAI GPT-5.2
├── Anthropic Claude Sonnet 4.5
├── Google Gemini 3 Flash
└── OpenAI Whisper (STT)

Payments (Stripe - TEST MODE)
└── Checkout Sessions
```

## Testing Status
- Backend API: ✅ All endpoints tested via curl
- Feature Gating: ✅ Verified blocks users at limit
- Pricing Discounts: ✅ 10% quarterly, 25% yearly verified
- Session Timer: ✅ Displays correctly with warnings
- Stripe Checkout: ✅ Creates valid checkout URLs (test mode)
