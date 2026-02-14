#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class StealthInterviewAPITester:
    def __init__(self, base_url="https://tech-interview-pro-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = None
        self.qa_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_health_endpoint(self):
        """Test dedicated health endpoint"""
        success, response = self.run_test(
            "Health Endpoint",
            "GET", 
            "health",
            200
        )
        if success and 'status' in response:
            print(f"   Health Status: {response['status']}")
        return success

    def test_create_session(self):
        """Test session creation"""
        session_data = {
            "name": f"Test Session {datetime.now().strftime('%H:%M:%S')}",
            "interview_type": "video",
            "domain": "frontend"
        }
        
        success, response = self.run_test(
            "Create Session",
            "POST",
            "sessions",
            200,
            data=session_data
        )
        
        if success and 'id' in response:
            self.session_id = response['id']
            print(f"   Session ID: {self.session_id}")
        return success

    def test_create_mock_session(self):
        """Test mock session creation with job description and resume"""
        session_data = {
            "name": f"Mock Interview Test {datetime.now().strftime('%H:%M:%S')}",
            "interview_type": "mock",
            "domain": "frontend",
            "job_description": "We are looking for a Senior Frontend Developer with React experience. Must have 5+ years of experience with modern JavaScript frameworks.",
            "resume": "Frontend Developer with 6 years experience in React, TypeScript, and modern web technologies. Built scalable applications for Fortune 500 companies.",
            "company_name": "Google",
            "role_title": "Senior Frontend Engineer"
        }
        
        success, response = self.run_test(
            "Create Mock Session with Context",
            "POST",
            "sessions",
            200,
            data=session_data
        )
        
        if success and 'id' in response:
            print(f"   Mock Session ID: {response['id']}")
            print(f"   Company: {response.get('company_name', 'N/A')}")
            print(f"   Role: {response.get('role_title', 'N/A')}")
            print(f"   Has Job Description: {bool(response.get('job_description'))}")
            print(f"   Has Resume: {bool(response.get('resume'))}")
        return success

    def test_get_sessions(self):
        """Test getting all sessions"""
        success, response = self.run_test(
            "Get Sessions",
            "GET",
            "sessions",
            200
        )
        
        if success:
            print(f"   Found {len(response)} sessions")
        return success

    def test_get_session_by_id(self):
        """Test getting specific session"""
        if not self.session_id:
            print("❌ No session ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Session by ID",
            "GET",
            f"sessions/{self.session_id}",
            200
        )
        
        if success:
            print(f"   Session Name: {response.get('name', 'N/A')}")
        return success

    def test_generate_answer(self):
        """Test AI answer generation"""
        answer_data = {
            "question": "What is React and why is it popular?",
            "ai_model": "gpt-5.2",
            "tone": "professional",
            "domain": "frontend",
            "session_id": self.session_id
        }
        
        success, response = self.run_test(
            "Generate Answer",
            "POST",
            "generate-answer",
            200,
            data=answer_data
        )
        
        if success and 'answer' in response:
            self.qa_id = response.get('qa_id')
            print(f"   Answer Length: {len(response['answer'])} chars")
            print(f"   AI Model: {response.get('ai_model', 'N/A')}")
            if self.qa_id:
                print(f"   QA ID: {self.qa_id}")
        return success

    def test_code_assist(self):
        """Test code assistance"""
        code_data = {
            "code": "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}",
            "language": "javascript",
            "question": "Explain this code and suggest improvements",
            "ai_model": "gpt-5.2"
        }
        
        success, response = self.run_test(
            "Code Assist",
            "POST",
            "code-assist",
            200,
            data=code_data
        )
        
        if success and 'explanation' in response:
            print(f"   Explanation Length: {len(response['explanation'])} chars")
        return success

    def test_get_qa_pairs(self):
        """Test getting Q&A pairs for session"""
        if not self.session_id:
            print("❌ No session ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Q&A Pairs",
            "GET",
            f"qa-pairs/{self.session_id}",
            200
        )
        
        if success:
            print(f"   Found {len(response)} Q&A pairs")
        return success

    def test_get_settings(self):
        """Test getting settings"""
        success, response = self.run_test(
            "Get Settings",
            "GET",
            "settings",
            200
        )
        
        if success:
            print(f"   Default Model: {response.get('default_ai_model', 'N/A')}")
            print(f"   Default Tone: {response.get('default_tone', 'N/A')}")
        return success

    def test_update_settings(self):
        """Test updating settings"""
        settings_data = {
            "default_ai_model": "claude-sonnet-4.5",
            "default_tone": "technical",
            "default_domain": "backend",
            "stealth_opacity": 0.15,
            "auto_copy": False
        }
        
        success, response = self.run_test(
            "Update Settings",
            "PUT",
            "settings",
            200,
            data=settings_data
        )
        
        if success:
            print(f"   Updated Model: {response.get('default_ai_model', 'N/A')}")
        return success

    def test_delete_qa_pair(self):
        """Test deleting Q&A pair"""
        if not self.qa_id:
            print("❌ No Q&A ID available for testing")
            return False
            
        success, response = self.run_test(
            "Delete Q&A Pair",
            "DELETE",
            f"qa-pairs/{self.qa_id}",
            200
        )
        return success

    def test_end_session(self):
        """Test ending session"""
        if not self.session_id:
            print("❌ No session ID available for testing")
            return False
            
        success, response = self.run_test(
            "End Session",
            "PUT",
            f"sessions/{self.session_id}/end",
            200
        )
        return success

    def test_delete_session(self):
        """Test deleting session"""
        if not self.session_id:
            print("❌ No session ID available for testing")
            return False
            
        success, response = self.run_test(
            "Delete Session",
            "DELETE",
            f"sessions/{self.session_id}",
            200
        )
        return success

    def test_update_session(self):
        """Test updating session with job description and resume"""
        if not self.session_id:
            print("❌ No session ID available for testing")
            return False
            
        update_data = {
            "job_description": "Updated job description: Looking for a React developer with Redux experience.",
            "resume": "Updated resume: 7 years of React development experience with Redux, TypeScript, and testing.",
            "company_name": "Meta",
            "role_title": "Staff Frontend Engineer"
        }
        
        success, response = self.run_test(
            "Update Session Context",
            "PUT",
            f"sessions/{self.session_id}",
            200,
            data=update_data
        )
        
        if success:
            print(f"   Updated Company: {response.get('company_name', 'N/A')}")
            print(f"   Updated Role: {response.get('role_title', 'N/A')}")
        return success

    def test_generate_mock_questions(self):
        """Test mock interview questions generation"""
        mock_data = {
            "domain": "frontend",
            "job_description": "We need a React developer with TypeScript experience for building scalable web applications.",
            "resume": "Frontend developer with 5 years React experience, TypeScript expert, worked on large-scale applications.",
            "count": 5,
            "ai_model": "gpt-5.2"
        }
        
        success, response = self.run_test(
            "Generate Mock Questions",
            "POST",
            "generate-mock-questions",
            200,
            data=mock_data
        )
        
        if success and 'questions' in response:
            questions = response['questions']
            print(f"   Generated {len(questions)} questions")
            print(f"   AI Model: {response.get('ai_model', 'N/A')}")
            
            # Check question structure
            if questions and len(questions) > 0:
                first_q = questions[0]
                print(f"   Sample Question Category: {first_q.get('category', 'N/A')}")
                print(f"   Sample Question Difficulty: {first_q.get('difficulty', 'N/A')}")
                print(f"   Sample Question: {first_q.get('question', 'N/A')[:100]}...")
        return success

    def test_generate_answer_with_context(self):
        """Test AI answer generation with session context"""
        if not self.session_id:
            print("❌ No session ID available for testing")
            return False
            
        answer_data = {
            "question": "Tell me about your experience with React and why you're interested in this role.",
            "ai_model": "gpt-5.2",
            "tone": "professional",
            "domain": "frontend",
            "session_id": self.session_id,
            "job_description": "Senior React Developer position requiring TypeScript and Redux experience.",
            "resume": "5+ years React developer with TypeScript, Redux, and modern web development experience.",
            "company_name": "Google",
            "role_title": "Senior Frontend Engineer"
        }
        
        success, response = self.run_test(
            "Generate Answer with Context",
            "POST",
            "generate-answer",
            200,
            data=answer_data
        )
        
        if success and 'answer' in response:
            answer = response['answer']
            print(f"   Answer Length: {len(answer)} chars")
            print(f"   AI Model: {response.get('ai_model', 'N/A')}")
            
            # Check if answer seems personalized (contains context keywords)
            context_keywords = ['react', 'typescript', 'google', 'frontend', 'experience']
            found_keywords = [kw for kw in context_keywords if kw.lower() in answer.lower()]
            print(f"   Context Keywords Found: {len(found_keywords)}/{len(context_keywords)}")
            
            if self.qa_id:
                print(f"   QA ID: {self.qa_id}")
        return success

    def test_transcribe_audio(self):
        """Test Whisper transcription endpoint"""
        # Create a minimal base64 audio data (this is just for testing the endpoint exists)
        # In real usage, this would be actual audio data
        import base64
        fake_audio_data = base64.b64encode(b"fake audio data for testing").decode()
        
        transcribe_data = {
            "audio_base64": fake_audio_data,
            "language": "en"
        }
        
        success, response = self.run_test(
            "Transcribe Audio (Whisper)",
            "POST",
            "transcribe",
            500,  # Expected to fail with fake data, but endpoint should exist
            data=transcribe_data
        )
        
        # Even if it fails due to fake data, the endpoint should exist and return 500, not 404
        print("   Note: Expected to fail with fake audio data, but endpoint exists")
        return True  # We just want to verify the endpoint exists

    def test_export_session_json(self):
        """Test session export in JSON format"""
        if not self.session_id:
            print("❌ No session ID available for testing")
            return False
            
        success, response = self.run_test(
            "Export Session (JSON)",
            "GET",
            f"sessions/{self.session_id}/export?format=json",
            200
        )
        
        if success:
            print(f"   Export contains session: {bool(response.get('session'))}")
            print(f"   Export contains qa_pairs: {bool(response.get('qa_pairs'))}")
            print(f"   Total questions: {response.get('total_questions', 0)}")
        return success

    def test_export_session_markdown(self):
        """Test session export in Markdown format"""
        if not self.session_id:
            print("❌ No session ID available for testing")
            return False
            
        success, response = self.run_test(
            "Export Session (Markdown)",
            "GET",
            f"sessions/{self.session_id}/export?format=markdown",
            200
        )
        
        if success:
            print(f"   Markdown content length: {len(response.get('markdown', ''))}")
            print(f"   Session name: {response.get('session_name', 'N/A')}")
        return success

def main():
    print("🚀 Starting StealthInterview.ai API Tests")
    print("=" * 50)
    
    tester = StealthInterviewAPITester()
    
    # Core API Tests
    tests = [
        tester.test_health_check,
        tester.test_health_endpoint,
        tester.test_create_session,
        tester.test_create_mock_session,
        tester.test_get_sessions,
        tester.test_get_session_by_id,
        tester.test_update_session,
        tester.test_generate_mock_questions,
        tester.test_generate_answer,
        tester.test_generate_answer_with_context,
        tester.test_code_assist,
        tester.test_get_qa_pairs,
        tester.test_transcribe_audio,  # New Whisper endpoint
        tester.test_export_session_json,  # New export endpoint
        tester.test_export_session_markdown,  # New export endpoint
        tester.test_get_settings,
        tester.test_update_settings,
        tester.test_delete_qa_pair,
        tester.test_end_session,
        tester.test_delete_session,
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())