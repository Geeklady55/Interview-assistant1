"""
Test suite for new Interview Assistant features:
- Mock Interview with pre-generated suggested answers
- Key Points + Brief Explanation format
- TTS (browser-based, no backend testing needed)
- Session timer
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMockInterviewSuggestedAnswers:
    """Test Mock Interview generates questions with suggested_answer field"""
    
    def test_generate_mock_questions_returns_suggested_answer(self):
        """Verify generate-mock-questions endpoint returns suggested_answer field"""
        response = requests.post(
            f"{BASE_URL}/api/generate-mock-questions",
            json={
                "domain": "frontend",
                "count": 2,
                "ai_model": "gpt-5.2"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "questions" in data, "Response should contain 'questions' field"
        assert len(data["questions"]) > 0, "Should return at least one question"
        
        # Check first question has suggested_answer
        first_question = data["questions"][0]
        assert "suggested_answer" in first_question, "Question should have 'suggested_answer' field"
        assert len(first_question["suggested_answer"]) > 0, "suggested_answer should not be empty"
        
        # Verify Key Points format in suggested_answer
        suggested_answer = first_question["suggested_answer"]
        assert "Key Points" in suggested_answer or "**Key Points:**" in suggested_answer, \
            "suggested_answer should contain Key Points format"
    
    def test_generate_mock_questions_with_job_description(self):
        """Test mock questions generation with job description context"""
        response = requests.post(
            f"{BASE_URL}/api/generate-mock-questions",
            json={
                "domain": "backend",
                "count": 2,
                "ai_model": "gpt-5.2",
                "job_description": "Senior Python Developer with FastAPI experience"
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["questions"]) > 0
        
        # All questions should have suggested_answer
        for q in data["questions"]:
            assert "suggested_answer" in q, f"Question '{q.get('question', 'unknown')}' missing suggested_answer"


class TestLiveInterviewKeyPointsFormat:
    """Test Live Interview generates answers in Key Points + Brief Explanation format"""
    
    def test_generate_answer_key_points_format(self):
        """Verify generate-answer returns Key Points + Brief Explanation format"""
        response = requests.post(
            f"{BASE_URL}/api/generate-answer",
            json={
                "question": "What is React?",
                "ai_model": "gpt-5.2",
                "tone": "professional",
                "domain": "frontend"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "answer" in data, "Response should contain 'answer' field"
        
        answer = data["answer"]
        assert len(answer) > 0, "Answer should not be empty"
        
        # Verify Key Points format
        assert "Key Points" in answer or "**Key Points:**" in answer, \
            "Answer should contain Key Points section"
        
        # Verify Brief Explanation format
        assert "Brief Explanation" in answer or "**Brief Explanation:**" in answer, \
            "Answer should contain Brief Explanation section"
    
    def test_generate_answer_with_session_context(self):
        """Test answer generation with session context"""
        # First create a session
        session_response = requests.post(
            f"{BASE_URL}/api/sessions",
            json={
                "name": "Test Session",
                "interview_type": "phone",
                "domain": "backend"
            }
        )
        assert session_response.status_code == 200
        session_id = session_response.json()["id"]
        
        # Generate answer with session context
        response = requests.post(
            f"{BASE_URL}/api/generate-answer",
            json={
                "question": "Explain microservices architecture",
                "ai_model": "gpt-5.2",
                "tone": "technical",
                "domain": "backend",
                "session_id": session_id
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "Key Points" in data["answer"] or "**Key Points:**" in data["answer"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/sessions/{session_id}")


class TestSessionTimer:
    """Test session timer and duration limit functionality"""
    
    def test_session_has_duration_limit(self):
        """Verify session creation includes duration_limit field"""
        response = requests.post(
            f"{BASE_URL}/api/sessions",
            json={
                "name": "Timer Test Session",
                "interview_type": "phone",
                "domain": "frontend"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "duration_limit" in data, "Session should have duration_limit field"
        assert isinstance(data["duration_limit"], int), "duration_limit should be an integer"
        assert data["duration_limit"] > 0, "duration_limit should be positive"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/sessions/{data['id']}")
    
    def test_session_duration_limit_default_free_tier(self):
        """Verify free tier gets default 15 minute duration limit"""
        response = requests.post(
            f"{BASE_URL}/api/sessions",
            json={
                "name": "Free Tier Test",
                "interview_type": "phone",
                "domain": "general"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Free tier should have 15 minute limit
        assert data["duration_limit"] == 15, f"Expected 15 min limit, got {data['duration_limit']}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/sessions/{data['id']}")


class TestHealthAndBasicEndpoints:
    """Basic health and endpoint tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_plans_endpoint(self):
        """Test subscription plans endpoint"""
        response = requests.get(f"{BASE_URL}/api/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert len(data["plans"]) > 0


class TestMockInterviewQuestionFields:
    """Test all required fields in mock interview questions"""
    
    def test_question_has_all_required_fields(self):
        """Verify each question has category, question, difficulty, tips, and suggested_answer"""
        response = requests.post(
            f"{BASE_URL}/api/generate-mock-questions",
            json={
                "domain": "system_design",
                "count": 3,
                "ai_model": "gpt-5.2"
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["category", "question", "difficulty", "tips", "suggested_answer"]
        
        for q in data["questions"]:
            for field in required_fields:
                assert field in q, f"Question missing required field: {field}"
            
            # Validate category values
            valid_categories = ["behavioral", "technical", "coding", "system_design"]
            assert q["category"] in valid_categories, f"Invalid category: {q['category']}"
            
            # Validate difficulty values
            valid_difficulties = ["easy", "medium", "hard"]
            assert q["difficulty"] in valid_difficulties, f"Invalid difficulty: {q['difficulty']}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
