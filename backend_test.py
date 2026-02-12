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

def main():
    print("🚀 Starting StealthInterview.ai API Tests")
    print("=" * 50)
    
    tester = StealthInterviewAPITester()
    
    # Core API Tests
    tests = [
        tester.test_health_check,
        tester.test_health_endpoint,
        tester.test_create_session,
        tester.test_get_sessions,
        tester.test_get_session_by_id,
        tester.test_generate_answer,
        tester.test_code_assist,
        tester.test_get_qa_pairs,
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