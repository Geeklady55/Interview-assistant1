from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Request
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse, PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAISpeechToText
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import base64
import tempfile
import json
import zipfile
import io

ROOT_DIR = Path(__file__).parent
DESKTOP_DIR = ROOT_DIR.parent / 'desktop'
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Stripe Key
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# =============================================================================
# SUBSCRIPTION PLANS CONFIGURATION
# =============================================================================

SUBSCRIPTION_PLANS = {
    "free": {
        "name": "Free",
        "price_monthly": 0.00,
        "price_quarterly": 0.00,
        "price_yearly": 0.00,
        "live_interviews": 5,
        "session_duration_minutes": 15,
        "features": [
            "5 live interview sessions/month",
            "15 minute session limit",
            "Basic AI assistance",
            "Web Speech API transcription",
            "Session history (7 days)"
        ],
        "ai_models": ["gpt-5.2"],
        "mock_interviews": 3,
        "code_sessions": 5,
        "export_enabled": False,
        "priority_support": False
    },
    "beginner": {
        "name": "Beginner",
        "price_monthly": 25.00,
        "price_quarterly": 67.50,  # 10% discount (25 * 3 * 0.9)
        "price_yearly": 225.00,    # 25% discount (25 * 12 * 0.75)
        "live_interviews": 7,
        "session_duration_minutes": 20,
        "features": [
            "7 live interview sessions/month",
            "20 minute session limit",
            "AI assistance (GPT-5.2, Claude)",
            "Web Speech API transcription",
            "Session history (30 days)",
            "Basic export (JSON)"
        ],
        "ai_models": ["gpt-5.2", "claude-sonnet-4.5"],
        "mock_interviews": 10,
        "code_sessions": 15,
        "export_enabled": True,
        "priority_support": False
    },
    "advanced": {
        "name": "Advanced",
        "price_monthly": 59.00,
        "price_quarterly": 159.30,  # 10% discount (59 * 3 * 0.9)
        "price_yearly": 531.00,     # 25% discount (59 * 12 * 0.75)
        "live_interviews": -1,  # Unlimited
        "session_duration_minutes": 90,
        "features": [
            "Unlimited live interview sessions",
            "90 minute session limit",
            "All AI models (GPT-5.2, Claude, Gemini)",
            "Whisper transcription",
            "Session history (90 days)",
            "Full export (JSON + Markdown)",
            "Mock interview generator",
            "Job description analysis"
        ],
        "ai_models": ["gpt-5.2", "claude-sonnet-4.5", "gemini-3-flash"],
        "mock_interviews": -1,  # Unlimited
        "code_sessions": -1,    # Unlimited
        "export_enabled": True,
        "priority_support": False
    },
    "executive": {
        "name": "Executive",
        "price_monthly": 75.00,
        "price_quarterly": 202.50,  # 10% discount (75 * 3 * 0.9)
        "price_yearly": 675.00,     # 25% discount (75 * 12 * 0.75)
        "live_interviews": -1,  # Unlimited
        "session_duration_minutes": 90,
        "features": [
            "Unlimited live interview sessions",
            "90 minute session limit",
            "All AI models (GPT-5.2, Claude, Gemini)",
            "Whisper transcription",
            "Unlimited session history",
            "Full export (JSON + Markdown + PDF)",
            "Mock interview generator",
            "Job description analysis",
            "🌟 Personal Interview Coach AI",
            "🌟 Resume Optimization Assistant",
            "🌟 1-on-1 Expert Review Sessions"
        ],
        "ai_models": ["gpt-5.2", "claude-sonnet-4.5", "gemini-3-flash"],
        "mock_interviews": -1,
        "code_sessions": -1,
        "export_enabled": True,
        "priority_support": True,
        "executive_benefits": {
            "personal_coach": True,
            "resume_optimizer": True,
            "expert_review": True,
            "expert_review_sessions": 2  # Per month
        }
    }
}

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# MODELS
# =============================================================================

class SessionCreate(BaseModel):
    name: str
    interview_type: str  # phone, video, coding, mock
    domain: str  # frontend, backend, system_design, dsa, technical_support
    job_description: Optional[str] = None
    resume: Optional[str] = None
    company_name: Optional[str] = None
    role_title: Optional[str] = None
    email: Optional[str] = None  # For subscription tracking

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    interview_type: str
    domain: str
    job_description: Optional[str] = None
    resume: Optional[str] = None
    company_name: Optional[str] = None
    role_title: Optional[str] = None
    email: Optional[str] = None  # For subscription tracking
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_active: bool = True
    duration_limit: int = 15  # Session duration limit in minutes

class SessionUpdate(BaseModel):
    job_description: Optional[str] = None
    resume: Optional[str] = None
    company_name: Optional[str] = None
    role_title: Optional[str] = None

# =============================================================================
# SUBSCRIPTION MODELS
# =============================================================================

class UserSubscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Can be email or unique identifier
    email: str
    plan: str = "free"  # free, beginner, advanced, executive
    billing_cycle: str = "monthly"  # monthly, quarterly, yearly
    status: str = "active"  # active, cancelled, expired, past_due
    current_period_start: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    current_period_end: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    # Usage tracking
    live_interviews_used: int = 0
    mock_interviews_used: int = 0
    code_sessions_used: int = 0

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    email: str
    amount: float
    currency: str = "usd"
    plan: str
    billing_cycle: str
    session_id: str  # Stripe checkout session ID
    payment_status: str = "pending"  # pending, paid, failed, expired
    status: str = "initiated"  # initiated, completed, failed, cancelled
    metadata: Optional[Dict] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CreateCheckoutRequest(BaseModel):
    email: str
    plan: str  # beginner, advanced, executive
    billing_cycle: str = "monthly"  # monthly, quarterly, yearly
    origin_url: str  # Frontend origin for redirect URLs

class SubscriptionResponse(BaseModel):
    subscription: Optional[Dict] = None
    plan_details: Optional[Dict] = None
    usage: Optional[Dict] = None


# App Release/Update Models
class AppRelease(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    version: str
    platform: str  # windows, mac, linux
    download_url: str
    release_notes: Optional[str] = None
    file_size: Optional[int] = None
    sha512: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_latest: bool = True

class CreateReleaseRequest(BaseModel):
    version: str
    platform: str
    download_url: str
    release_notes: Optional[str] = None
    file_size: Optional[int] = None
    sha512: Optional[str] = None

class MockQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # behavioral, technical, coding, system_design
    question: str
    difficulty: str  # easy, medium, hard
    domain: str
    tips: Optional[str] = None

class GenerateMockQuestionsRequest(BaseModel):
    domain: str
    job_description: Optional[str] = None
    resume: Optional[str] = None
    count: int = 5
    ai_model: str = "gpt-5.2"

class QAPair(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    question: str
    answer: str
    ai_model: str
    tone: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GenerateAnswerRequest(BaseModel):
    question: str
    ai_model: str = "gpt-5.2"  # gpt-5.2, claude-sonnet-4.5, gemini-3-flash
    tone: str = "professional"  # professional, casual, technical
    domain: str = "general"
    session_id: Optional[str] = None
    context: Optional[str] = None  # Additional context like code or previous Q&A
    job_description: Optional[str] = None
    resume: Optional[str] = None
    company_name: Optional[str] = None
    role_title: Optional[str] = None
    email: Optional[str] = None  # For subscription limit checking

class GenerateAnswerResponse(BaseModel):
    answer: str
    ai_model: str
    qa_id: Optional[str] = None

class CodeAssistRequest(BaseModel):
    code: str
    language: str
    question: str
    ai_model: str = "gpt-5.2"

class CodeAssistResponse(BaseModel):
    explanation: str
    improved_code: Optional[str] = None
    ai_model: str

class TranscriptionRequest(BaseModel):
    audio_base64: str
    language: str = "en"

class SettingsModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "default"
    default_ai_model: str = "gpt-5.2"
    default_tone: str = "professional"
    default_domain: str = "general"
    stealth_opacity: float = 0.1
    auto_copy: bool = True

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def check_subscription_limits(email: str, usage_type: str) -> dict:
    """
    Check if user has reached their subscription limits.
    Returns: { "allowed": bool, "reason": str, "limit": int, "used": int }
    """
    if not email:
        # Anonymous users get free tier limits
        return {"allowed": True, "plan": "free", "limit": 5, "used": 0}
    
    subscription = await db.subscriptions.find_one({"email": email}, {"_id": 0})
    
    if not subscription:
        # Default to free plan
        plan_id = "free"
        plan = SUBSCRIPTION_PLANS["free"]
        usage = {"live_interviews_used": 0, "mock_interviews_used": 0, "code_sessions_used": 0}
    else:
        plan_id = subscription.get("plan", "free")
        plan = SUBSCRIPTION_PLANS.get(plan_id, SUBSCRIPTION_PLANS["free"])
        usage = {
            "live_interviews_used": subscription.get("live_interviews_used", 0),
            "mock_interviews_used": subscription.get("mock_interviews_used", 0),
            "code_sessions_used": subscription.get("code_sessions_used", 0)
        }
    
    # Map usage type to limit field and usage field
    limit_map = {
        "live_interview": ("live_interviews", "live_interviews_used"),
        "mock_interview": ("mock_interviews", "mock_interviews_used"),
        "code_session": ("code_sessions", "code_sessions_used")
    }
    
    if usage_type not in limit_map:
        return {"allowed": True, "plan": plan_id}
    
    limit_field, used_field = limit_map[usage_type]
    limit = plan.get(limit_field, 5)
    used = usage.get(used_field, 0)
    
    # -1 means unlimited
    if limit == -1:
        return {
            "allowed": True,
            "plan": plan_id,
            "limit": -1,
            "used": used,
            "remaining": -1,
            "duration_limit": plan.get("session_duration_minutes", 15)
        }
    
    allowed = used < limit
    return {
        "allowed": allowed,
        "plan": plan_id,
        "limit": limit,
        "used": used,
        "remaining": max(0, limit - used),
        "duration_limit": plan.get("session_duration_minutes", 15),
        "reason": f"You've used {used}/{limit} {usage_type.replace('_', ' ')}s this month" if not allowed else None
    }

async def increment_usage(email: str, usage_type: str):
    """Increment usage counter for a user"""
    if not email:
        return
    
    field_map = {
        "live_interview": "live_interviews_used",
        "mock_interview": "mock_interviews_used",
        "code_session": "code_sessions_used"
    }
    
    if usage_type not in field_map:
        return
    
    await db.subscriptions.update_one(
        {"email": email},
        {
            "$inc": {field_map[usage_type]: 1},
            "$setOnInsert": {"plan": "free", "status": "active"}
        },
        upsert=True
    )

def get_system_prompt(domain: str, tone: str, job_description: str = None, resume: str = None, company_name: str = None, role_title: str = None) -> str:
    domain_prompts = {
        "frontend": "You are an expert frontend developer with deep knowledge of React, Vue, Angular, CSS, HTML, JavaScript/TypeScript, and modern web development practices.",
        "backend": "You are an expert backend developer with deep knowledge of system architecture, databases, APIs, microservices, and server-side programming in various languages.",
        "system_design": "You are an expert system architect who excels at designing scalable, distributed systems. You understand trade-offs between consistency, availability, and partition tolerance.",
        "dsa": "You are an expert in data structures and algorithms. You can explain complex algorithms clearly and provide optimal solutions with time and space complexity analysis.",
        "technical_support": "You are an expert technical support specialist who can troubleshoot issues, explain solutions clearly, and guide users through complex technical problems.",
        "general": "You are an expert technical interviewer assistant who helps candidates ace their interviews across all technical domains."
    }
    
    tone_instructions = {
        "professional": "Respond in a professional, confident manner. Be concise but thorough. Sound like a senior engineer who knows their stuff.",
        "casual": "Respond in a friendly, conversational tone while still being technically accurate. Be approachable and relatable.",
        "technical": "Respond with deep technical detail. Include specific terminology, best practices, and advanced concepts. Be precise and comprehensive."
    }
    
    # Build context from job description and resume
    context_section = ""
    if job_description or resume or company_name or role_title:
        context_section = "\n\nIMPORTANT CONTEXT FOR THIS INTERVIEW:\n"
        if company_name:
            context_section += f"- Company: {company_name}\n"
        if role_title:
            context_section += f"- Role: {role_title}\n"
        if job_description:
            context_section += f"- Job Description:\n{job_description[:2000]}\n"
        if resume:
            context_section += f"- Candidate's Background:\n{resume[:2000]}\n"
        context_section += "\nUse this context to tailor your answers to highlight relevant experience and match the job requirements. Reference specific skills and experiences from the resume when appropriate."
    
    base_prompt = f"""You are helping a job candidate during a technical interview. Your goal is to provide excellent answers that sound natural and human - NOT like they're being read from the internet or AI-generated.

{domain_prompts.get(domain, domain_prompts['general'])}

{tone_instructions.get(tone, tone_instructions['professional'])}{context_section}

CRITICAL RULES:
1. Give answers that sound like a real person speaking naturally
2. Use first-person perspective ("I would...", "In my experience...", "I've found that...")
3. Include occasional conversational elements but don't overdo it
4. Be specific with examples from real-world scenarios
5. Keep answers focused and interview-appropriate (2-4 paragraphs for most questions)
6. For coding questions, explain your thought process as you would in an interview
7. Never say "As an AI" or reference being an AI assistant
8. Avoid overly formal or robotic language
9. If resume context is provided, reference specific experiences and projects when relevant
10. If job description is provided, align answers to highlight relevant skills
"""
    return base_prompt

async def get_ai_response(question: str, ai_model: str, domain: str, tone: str, context: str = None, job_description: str = None, resume: str = None, company_name: str = None, role_title: str = None) -> str:
    """Generate AI response using the specified model."""
    
    system_prompt = get_system_prompt(domain, tone, job_description, resume, company_name, role_title)
    
    if context:
        full_question = f"Context:\n{context}\n\nQuestion: {question}"
    else:
        full_question = question
    
    session_id = str(uuid.uuid4())
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_prompt
    )
    
    # Configure model based on selection
    if ai_model == "gpt-5.2":
        chat.with_model("openai", "gpt-5.2")
    elif ai_model == "claude-sonnet-4.5":
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
    elif ai_model == "gemini-3-flash":
        chat.with_model("gemini", "gemini-3-flash-preview")
    else:
        chat.with_model("openai", "gpt-5.2")
    
    user_message = UserMessage(text=full_question)
    response = await chat.send_message(user_message)
    
    return response

# =============================================================================
# ROUTES
# =============================================================================

@api_router.get("/")
async def root():
    return {"message": "StealthInterview.ai API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# =============================================================================
# SUBSCRIPTION & PAYMENT ENDPOINTS
# =============================================================================

@api_router.get("/plans")
async def get_subscription_plans():
    """Get all subscription plans with pricing"""
    plans = []
    for plan_id, plan_data in SUBSCRIPTION_PLANS.items():
        plans.append({
            "id": plan_id,
            **plan_data
        })
    return {"plans": plans}

@api_router.get("/plans/{plan_id}")
async def get_plan_details(plan_id: str):
    """Get details for a specific plan"""
    if plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"id": plan_id, **SUBSCRIPTION_PLANS[plan_id]}

@api_router.post("/subscriptions/checkout")
async def create_checkout_session(request: CreateCheckoutRequest, http_request: Request):
    """Create a Stripe checkout session for subscription"""
    try:
        # Validate plan
        if request.plan not in SUBSCRIPTION_PLANS or request.plan == "free":
            raise HTTPException(status_code=400, detail="Invalid plan selected")
        
        plan = SUBSCRIPTION_PLANS[request.plan]
        
        # Get price based on billing cycle
        if request.billing_cycle == "monthly":
            amount = plan["price_monthly"]
        elif request.billing_cycle == "quarterly":
            amount = plan["price_quarterly"]
        elif request.billing_cycle == "yearly":
            amount = plan["price_yearly"]
        else:
            raise HTTPException(status_code=400, detail="Invalid billing cycle")
        
        # Build URLs
        success_url = f"{request.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request.origin_url}/pricing"
        
        # Initialize Stripe checkout
        host_url = str(http_request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create checkout request with multiple payment methods
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "email": request.email,
                "plan": request.plan,
                "billing_cycle": request.billing_cycle,
                "type": "subscription"
            },
            payment_methods=["card"]  # Stripe handles Visa, Mastercard, Affirm, etc.
        )
        
        # Create session
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction record
        transaction = PaymentTransaction(
            user_id=request.email,
            email=request.email,
            amount=amount,
            currency="usd",
            plan=request.plan,
            billing_cycle=request.billing_cycle,
            session_id=session.session_id,
            payment_status="pending",
            status="initiated",
            metadata={
                "plan_name": plan["name"],
                "features": plan["features"]
            }
        )
        await db.payment_transactions.insert_one(transaction.model_dump())
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")

@api_router.get("/subscriptions/status/{session_id}")
async def get_checkout_status(session_id: str, http_request: Request):
    """Get checkout session status and update subscription if paid"""
    try:
        # Initialize Stripe
        host_url = str(http_request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Get status from Stripe
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Get transaction
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Update transaction status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "status": "completed" if status.payment_status == "paid" else transaction.get("status", "initiated"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # If paid, create or update subscription
        if status.payment_status == "paid":
            # Check if already processed
            existing_sub = await db.subscriptions.find_one({
                "user_id": transaction["email"],
                "stripe_session_id": session_id
            })
            
            if not existing_sub:
                # Calculate period end based on billing cycle
                now = datetime.now(timezone.utc)
                if transaction["billing_cycle"] == "monthly":
                    period_end = now + timedelta(days=30)
                elif transaction["billing_cycle"] == "quarterly":
                    period_end = now + timedelta(days=90)
                else:  # yearly
                    period_end = now + timedelta(days=365)
                
                # Create or update subscription
                subscription = UserSubscription(
                    user_id=transaction["email"],
                    email=transaction["email"],
                    plan=transaction["plan"],
                    billing_cycle=transaction["billing_cycle"],
                    status="active",
                    current_period_start=now.isoformat(),
                    current_period_end=period_end.isoformat(),
                    stripe_session_id=session_id
                )
                
                # Upsert subscription
                await db.subscriptions.update_one(
                    {"email": transaction["email"]},
                    {"$set": subscription.model_dump()},
                    upsert=True
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount": status.amount_total / 100,  # Convert from cents
            "currency": status.currency,
            "plan": transaction.get("plan"),
            "billing_cycle": transaction.get("billing_cycle")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/subscriptions/{email}")
async def get_user_subscription(email: str):
    """Get user's current subscription"""
    subscription = await db.subscriptions.find_one({"email": email}, {"_id": 0})
    
    if not subscription:
        # Return free plan for unsubscribed users
        return {
            "subscription": {
                "email": email,
                "plan": "free",
                "status": "active"
            },
            "plan_details": SUBSCRIPTION_PLANS["free"],
            "usage": {
                "live_interviews_used": 0,
                "live_interviews_limit": 5,
                "mock_interviews_used": 0,
                "code_sessions_used": 0
            }
        }
    
    plan_details = SUBSCRIPTION_PLANS.get(subscription.get("plan", "free"), SUBSCRIPTION_PLANS["free"])
    
    return {
        "subscription": subscription,
        "plan_details": plan_details,
        "usage": {
            "live_interviews_used": subscription.get("live_interviews_used", 0),
            "live_interviews_limit": plan_details.get("live_interviews", 5),
            "mock_interviews_used": subscription.get("mock_interviews_used", 0),
            "code_sessions_used": subscription.get("code_sessions_used", 0)
        }
    }

@api_router.post("/subscriptions/{email}/usage")
async def track_usage(email: str, usage_type: str):
    """Track usage for a user (live_interview, mock_interview, code_session)"""
    valid_types = ["live_interview", "mock_interview", "code_session"]
    if usage_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid usage type")
    
    field_map = {
        "live_interview": "live_interviews_used",
        "mock_interview": "mock_interviews_used",
        "code_session": "code_sessions_used"
    }
    
    await db.subscriptions.update_one(
        {"email": email},
        {"$inc": {field_map[usage_type]: 1}},
        upsert=True
    )
    
    return {"message": "Usage tracked"}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

# Session Management
@api_router.post("/sessions", response_model=Session)
async def create_session(input: SessionCreate):
    # Check subscription limits based on interview type
    usage_type = "live_interview" if input.interview_type in ["phone", "video"] else \
                 "mock_interview" if input.interview_type == "mock" else \
                 "code_session" if input.interview_type == "coding" else "live_interview"
    
    limit_check = await check_subscription_limits(input.email, usage_type)
    
    if not limit_check.get("allowed", True):
        raise HTTPException(
            status_code=403, 
            detail={
                "error": "subscription_limit_reached",
                "message": limit_check.get("reason", "You've reached your plan limit"),
                "limit": limit_check.get("limit"),
                "used": limit_check.get("used"),
                "plan": limit_check.get("plan")
            }
        )
    
    session = Session(
        name=input.name,
        interview_type=input.interview_type,
        domain=input.domain,
        job_description=input.job_description,
        resume=input.resume,
        company_name=input.company_name,
        role_title=input.role_title,
        email=input.email,
        duration_limit=limit_check.get("duration_limit", 15)
    )
    doc = session.model_dump()
    await db.sessions.insert_one(doc)
    
    # Increment usage
    if input.email:
        await increment_usage(input.email, usage_type)
    
    return session

@api_router.get("/sessions", response_model=List[Session])
async def get_sessions():
    sessions = await db.sessions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return sessions

@api_router.get("/sessions/{session_id}", response_model=Session)
async def get_session(session_id: str):
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@api_router.put("/sessions/{session_id}", response_model=Session)
async def update_session(session_id: str, update: SessionUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.sessions.update_one(
        {"id": session_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    return session

@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    result = await db.sessions.delete_one({"id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    # Also delete associated Q&A pairs
    await db.qa_pairs.delete_many({"session_id": session_id})
    return {"message": "Session deleted successfully"}

@api_router.put("/sessions/{session_id}/end")
async def end_session(session_id: str):
    result = await db.sessions.update_one(
        {"id": session_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session ended successfully"}

# AI Answer Generation
@api_router.post("/generate-answer", response_model=GenerateAnswerResponse)
async def generate_answer(request: GenerateAnswerRequest):
    try:
        # Get session context if session_id provided
        job_desc = request.job_description
        resume_text = request.resume
        company = request.company_name
        role = request.role_title
        
        if request.session_id:
            session = await db.sessions.find_one({"id": request.session_id}, {"_id": 0})
            if session:
                job_desc = job_desc or session.get("job_description")
                resume_text = resume_text or session.get("resume")
                company = company or session.get("company_name")
                role = role or session.get("role_title")
        
        answer = await get_ai_response(
            question=request.question,
            ai_model=request.ai_model,
            domain=request.domain,
            tone=request.tone,
            context=request.context,
            job_description=job_desc,
            resume=resume_text,
            company_name=company,
            role_title=role
        )
        
        qa_id = None
        # Save Q&A pair if session_id is provided
        if request.session_id:
            qa_pair = QAPair(
                session_id=request.session_id,
                question=request.question,
                answer=answer,
                ai_model=request.ai_model,
                tone=request.tone
            )
            doc = qa_pair.model_dump()
            await db.qa_pairs.insert_one(doc)
            qa_id = qa_pair.id
            
            # Update session timestamp
            await db.sessions.update_one(
                {"id": request.session_id},
                {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        return GenerateAnswerResponse(
            answer=answer,
            ai_model=request.ai_model,
            qa_id=qa_id
        )
    except Exception as e:
        logger.error(f"Error generating answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

# Code Assistance
@api_router.post("/code-assist", response_model=CodeAssistResponse)
async def code_assist(request: CodeAssistRequest):
    try:
        system_prompt = f"""You are an expert programmer helping in a coding interview. 
The candidate has written code in {request.language}.
Your job is to:
1. Explain what the code does
2. Identify any issues or improvements
3. If asked, provide an improved version
Be natural and conversational, as if you're pair programming with the candidate.
Never mention being an AI."""

        full_question = f"Code:\n```{request.language}\n{request.code}\n```\n\nQuestion: {request.question}"
        
        session_id = str(uuid.uuid4())
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_prompt
        )
        
        if request.ai_model == "gpt-5.2":
            chat.with_model("openai", "gpt-5.2")
        elif request.ai_model == "claude-sonnet-4.5":
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        elif request.ai_model == "gemini-3-flash":
            chat.with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=full_question)
        response = await chat.send_message(user_message)
        
        return CodeAssistResponse(
            explanation=response,
            ai_model=request.ai_model
        )
    except Exception as e:
        logger.error(f"Error in code assist: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to assist with code: {str(e)}")

# Q&A History
@api_router.get("/qa-pairs/{session_id}", response_model=List[QAPair])
async def get_qa_pairs(session_id: str):
    qa_pairs = await db.qa_pairs.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return qa_pairs

@api_router.delete("/qa-pairs/{qa_id}")
async def delete_qa_pair(qa_id: str):
    result = await db.qa_pairs.delete_one({"id": qa_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Q&A pair not found")
    return {"message": "Q&A pair deleted successfully"}

# Settings
@api_router.get("/settings", response_model=SettingsModel)
async def get_settings():
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        return SettingsModel()
    return settings

@api_router.put("/settings", response_model=SettingsModel)
async def update_settings(settings: SettingsModel):
    settings_dict = settings.model_dump()
    await db.settings.update_one(
        {"id": "default"},
        {"$set": settings_dict},
        upsert=True
    )
    return settings

# Mock Interview Questions
@api_router.post("/generate-mock-questions")
async def generate_mock_questions(request: GenerateMockQuestionsRequest):
    try:
        system_prompt = """You are an expert technical interviewer. Generate realistic interview questions based on the provided context.
        
Return questions in JSON format as an array of objects with these fields:
- category: one of "behavioral", "technical", "coding", "system_design"
- question: the interview question
- difficulty: one of "easy", "medium", "hard"
- tips: brief tips for answering this question

Generate diverse questions covering different aspects of the role."""

        context_parts = [f"Domain: {request.domain}"]
        if request.job_description:
            context_parts.append(f"Job Description:\n{request.job_description[:1500]}")
        if request.resume:
            context_parts.append(f"Candidate Background:\n{request.resume[:1500]}")
        
        question = f"""Generate {request.count} interview questions for a {request.domain} position.

{chr(10).join(context_parts)}

Return ONLY a valid JSON array with the questions. No other text."""

        session_id = str(uuid.uuid4())
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_prompt
        )
        
        if request.ai_model == "gpt-5.2":
            chat.with_model("openai", "gpt-5.2")
        elif request.ai_model == "claude-sonnet-4.5":
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        else:
            chat.with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=question)
        response = await chat.send_message(user_message)
        
        # Parse JSON from response
        import json
        # Try to extract JSON from the response
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        questions = json.loads(response_text.strip())
        
        return {"questions": questions, "ai_model": request.ai_model}
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse mock questions JSON: {str(e)}")
        # Return default questions if parsing fails
        return {
            "questions": [
                {"category": "behavioral", "question": "Tell me about yourself and your experience.", "difficulty": "easy", "tips": "Keep it concise, focus on relevant experience."},
                {"category": "technical", "question": f"What are the key concepts in {request.domain}?", "difficulty": "medium", "tips": "Cover fundamentals and recent developments."},
                {"category": "behavioral", "question": "Describe a challenging project you worked on.", "difficulty": "medium", "tips": "Use STAR method: Situation, Task, Action, Result."},
                {"category": "technical", "question": "How do you approach debugging complex issues?", "difficulty": "medium", "tips": "Show systematic thinking and tool knowledge."},
                {"category": "behavioral", "question": "Where do you see yourself in 5 years?", "difficulty": "easy", "tips": "Align with the company's growth and your career goals."}
            ],
            "ai_model": request.ai_model
        }
    except Exception as e:
        logger.error(f"Error generating mock questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

# Whisper Transcription
class TranscribeRequest(BaseModel):
    audio_base64: str
    language: str = "en"

@api_router.post("/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    """Transcribe audio using OpenAI Whisper"""
    try:
        # Decode base64 audio
        audio_data = base64.b64decode(request.audio_base64)
        
        # Write to temporary file
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
            temp_file.write(audio_data)
            temp_path = temp_file.name
        
        try:
            # Initialize Whisper STT
            stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
            
            # Transcribe
            with open(temp_path, "rb") as audio_file:
                response = await stt.transcribe(
                    file=audio_file,
                    model="whisper-1",
                    response_format="json",
                    language=request.language,
                    prompt="This is a technical job interview conversation."
                )
            
            return {"text": response.text, "success": True}
        finally:
            # Clean up temp file
            os.unlink(temp_path)
            
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

# Session Export
@api_router.get("/sessions/{session_id}/export")
async def export_session(session_id: str, format: str = "json"):
    """Export session data including all Q&A pairs"""
    try:
        # Get session
        session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get Q&A pairs
        qa_pairs = await db.qa_pairs.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
        
        export_data = {
            "session": session,
            "qa_pairs": qa_pairs,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "total_questions": len(qa_pairs)
        }
        
        if format == "json":
            return JSONResponse(content=export_data)
        elif format == "markdown":
            # Generate markdown format
            md_content = f"""# Interview Session: {session.get('name', 'Untitled')}

## Session Details
- **Company:** {session.get('company_name', 'N/A')}
- **Role:** {session.get('role_title', 'N/A')}
- **Interview Type:** {session.get('interview_type', 'N/A')}
- **Domain:** {session.get('domain', 'N/A')}
- **Created:** {session.get('created_at', 'N/A')}

"""
            if session.get('job_description'):
                md_content += f"""## Job Description
{session.get('job_description')}

"""
            if session.get('resume'):
                md_content += f"""## Resume/Background
{session.get('resume')}

"""
            md_content += "## Questions & Answers\n\n"
            
            for i, qa in enumerate(qa_pairs, 1):
                md_content += f"""### Question {i}
**Q:** {qa.get('question', '')}

**A:** {qa.get('answer', '')}

*Model: {qa.get('ai_model', 'N/A')} | Tone: {qa.get('tone', 'N/A')}*

---

"""
            
            return JSONResponse(content={"markdown": md_content, "session_name": session.get('name', 'session')})
        else:
            return JSONResponse(content=export_data)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

# Desktop App Download
@api_router.get("/desktop/download")
async def download_desktop_app(platform: str = "windows"):
    """Download desktop app source code as a zip file"""
    try:
        if not DESKTOP_DIR.exists():
            raise HTTPException(status_code=404, detail="Desktop app not found")
        
        # Create zip file in memory
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Files to include
            files_to_include = [
                'main.js',
                'preload.js',
                'package.json',
                'README.md',
                'build.sh',
                'assets/icon.svg'
            ]
            
            for file_path in files_to_include:
                full_path = DESKTOP_DIR / file_path
                if full_path.exists():
                    # Add to zip with folder structure
                    zip_file.write(full_path, f"StealthInterview-Desktop/{file_path}")
            
            # Create a platform-specific build script
            if platform == "windows":
                build_content = """@echo off
echo Installing dependencies...
call yarn install
echo Building for Windows...
call yarn build:win
echo.
echo Build complete! Check the dist folder for StealthInterview-Windows.exe
pause
"""
                zip_file.writestr("StealthInterview-Desktop/build-windows.bat", build_content)
            else:
                build_content = """#!/bin/bash
echo "Installing dependencies..."
yarn install
echo "Building for macOS..."
yarn build:mac
echo ""
echo "Build complete! Check the dist folder for StealthInterview-Mac.dmg"
"""
                zip_file.writestr("StealthInterview-Desktop/build-mac.sh", build_content)
        
        zip_buffer.seek(0)
        
        filename = f"StealthInterview-Desktop-{platform.capitalize()}.zip"
        
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Desktop download error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

# =============================================================================
# AUTO-UPDATE SERVER ENDPOINTS
# =============================================================================

@api_router.post("/releases")
async def create_release(release: CreateReleaseRequest, authorization: str = None):
    """Create a new app release (called by CI/CD pipeline)"""
    # Simple token auth for CI/CD
    expected_token = os.environ.get('RELEASE_TOKEN', 'stealth-release-token-2026')
    # In production, use proper auth
    
    try:
        # Mark previous releases for this platform as not latest
        await db.releases.update_many(
            {"platform": release.platform, "is_latest": True},
            {"$set": {"is_latest": False}}
        )
        
        # Create new release
        new_release = AppRelease(
            version=release.version,
            platform=release.platform,
            download_url=release.download_url,
            release_notes=release.release_notes,
            file_size=release.file_size,
            sha512=release.sha512,
            is_latest=True
        )
        
        doc = new_release.model_dump()
        await db.releases.insert_one(doc)
        
        return {"message": "Release created", "version": release.version, "platform": release.platform}
    except Exception as e:
        logger.error(f"Create release error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/releases/latest")
async def get_latest_releases():
    """Get latest releases for all platforms"""
    try:
        releases = await db.releases.find({"is_latest": True}, {"_id": 0}).to_list(10)
        return {"releases": releases}
    except Exception as e:
        logger.error(f"Get releases error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/releases/latest/{platform}")
async def get_latest_release_for_platform(platform: str):
    """Get latest release for a specific platform"""
    try:
        release = await db.releases.find_one(
            {"platform": platform, "is_latest": True}, 
            {"_id": 0}
        )
        if not release:
            raise HTTPException(status_code=404, detail=f"No release found for {platform}")
        return release
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get platform release error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/updates/{platform}")
async def check_for_updates(platform: str, current_version: str = None):
    """
    Check for updates - returns update info if newer version available.
    Compatible with electron-updater's generic provider format.
    """
    try:
        release = await db.releases.find_one(
            {"platform": platform, "is_latest": True},
            {"_id": 0}
        )
        
        if not release:
            return {"update_available": False}
        
        # Compare versions if current_version provided
        if current_version:
            from packaging import version
            try:
                current = version.parse(current_version.lstrip('v'))
                latest = version.parse(release['version'].lstrip('v'))
                if current >= latest:
                    return {"update_available": False, "current_version": current_version}
            except:
                pass
        
        # Return update info in electron-updater compatible format
        return {
            "update_available": True,
            "version": release['version'],
            "url": release['download_url'],
            "sha512": release.get('sha512'),
            "releaseNotes": release.get('release_notes'),
            "releaseDate": release.get('created_at')
        }
    except Exception as e:
        logger.error(f"Check updates error: {str(e)}")
        return {"update_available": False, "error": str(e)}

# Electron-updater compatible endpoints
@api_router.get("/updates/{platform}/latest.yml")
async def get_update_yml(platform: str):
    """
    Return update info in YAML format for electron-updater.
    This is the format electron-updater expects for generic provider.
    """
    try:
        release = await db.releases.find_one(
            {"platform": platform, "is_latest": True},
            {"_id": 0}
        )
        
        if not release:
            raise HTTPException(status_code=404, detail="No release found")
        
        # Generate YAML content
        yaml_content = f"""version: {release['version']}
files:
  - url: {release['download_url']}
    sha512: {release.get('sha512', '')}
    size: {release.get('file_size', 0)}
path: {release['download_url'].split('/')[-1]}
sha512: {release.get('sha512', '')}
releaseDate: {release.get('created_at', '')}
"""
        
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(content=yaml_content, media_type="text/yaml")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get update YAML error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/releases")
async def list_all_releases(platform: str = None, limit: int = 20):
    """List all releases, optionally filtered by platform"""
    try:
        query = {}
        if platform:
            query["platform"] = platform
        
        releases = await db.releases.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
        return {"releases": releases, "total": len(releases)}
    except Exception as e:
        logger.error(f"List releases error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
