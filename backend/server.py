from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

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
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_active: bool = True

class SessionUpdate(BaseModel):
    job_description: Optional[str] = None
    resume: Optional[str] = None
    company_name: Optional[str] = None
    role_title: Optional[str] = None

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

# Session Management
@api_router.post("/sessions", response_model=Session)
async def create_session(input: SessionCreate):
    session = Session(
        name=input.name,
        interview_type=input.interview_type,
        domain=input.domain,
        job_description=input.job_description,
        resume=input.resume,
        company_name=input.company_name,
        role_title=input.role_title
    )
    doc = session.model_dump()
    await db.sessions.insert_one(doc)
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
