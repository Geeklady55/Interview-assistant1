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

    def test_desktop_download_windows(self):
        """Test Windows desktop app download"""
        url = f"{self.base_url}/desktop/download?platform=windows"
        print(f"\n🔍 Testing Desktop Download (Windows)...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=30)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Check content type
                content_type = response.headers.get('content-type', '')
                print(f"   Content-Type: {content_type}")
                
                # Check content disposition
                content_disposition = response.headers.get('content-disposition', '')
                print(f"   Content-Disposition: {content_disposition}")
                
                # Check file size
                content_length = len(response.content)
                print(f"   File Size: {content_length} bytes")
                
                # Verify it's a zip file by checking magic bytes
                if response.content[:2] == b'PK':
                    print("   ✅ Valid ZIP file format")
                else:
                    print("   ❌ Invalid ZIP file format")
                    success = False
                    
                # Check filename in content disposition
                if 'StealthInterview-Desktop-Windows.zip' in content_disposition:
                    print("   ✅ Correct filename in response")
                else:
                    print("   ❌ Incorrect or missing filename")
                    
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                    
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            success = False
            
        self.tests_run += 1
        return success

    def test_desktop_download_mac(self):
        """Test Mac desktop app download"""
        url = f"{self.base_url}/desktop/download?platform=mac"
        print(f"\n🔍 Testing Desktop Download (Mac)...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=30)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Check content type
                content_type = response.headers.get('content-type', '')
                print(f"   Content-Type: {content_type}")
                
                # Check content disposition
                content_disposition = response.headers.get('content-disposition', '')
                print(f"   Content-Disposition: {content_disposition}")
                
                # Check file size
                content_length = len(response.content)
                print(f"   File Size: {content_length} bytes")
                
                # Verify it's a zip file by checking magic bytes
                if response.content[:2] == b'PK':
                    print("   ✅ Valid ZIP file format")
                else:
                    print("   ❌ Invalid ZIP file format")
                    success = False
                    
                # Check filename in content disposition
                if 'StealthInterview-Desktop-Mac.zip' in content_disposition:
                    print("   ✅ Correct filename in response")
                else:
                    print("   ❌ Incorrect or missing filename")
                    
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                    
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            success = False
            
        self.tests_run += 1
        return success

    def test_desktop_download_zip_contents(self):
        """Test desktop download zip contents"""
        import zipfile
        import io
        
        url = f"{self.base_url}/desktop/download?platform=windows"
        print(f"\n🔍 Testing Desktop Download ZIP Contents...")
        
        try:
            response = requests.get(url, timeout=30)
            success = response.status_code == 200
            
            if success:
                # Create a BytesIO object from the response content
                zip_buffer = io.BytesIO(response.content)
                
                # Expected files in the zip
                expected_files = [
                    'StealthInterview-Desktop/main.js',
                    'StealthInterview-Desktop/preload.js', 
                    'StealthInterview-Desktop/package.json',
                    'StealthInterview-Desktop/README.md',
                    'StealthInterview-Desktop/build.sh',
                    'StealthInterview-Desktop/build-windows.bat'  # Windows specific
                ]
                
                with zipfile.ZipFile(zip_buffer, 'r') as zip_file:
                    zip_contents = zip_file.namelist()
                    print(f"   ZIP contains {len(zip_contents)} files")
                    
                    # Check for expected files
                    missing_files = []
                    for expected_file in expected_files:
                        if expected_file in zip_contents:
                            print(f"   ✅ Found: {expected_file}")
                        else:
                            print(f"   ❌ Missing: {expected_file}")
                            missing_files.append(expected_file)
                    
                    if missing_files:
                        print(f"   ❌ Missing {len(missing_files)} expected files")
                        success = False
                    else:
                        print(f"   ✅ All expected files present")
                        
                    # Check package.json content
                    if 'StealthInterview-Desktop/package.json' in zip_contents:
                        package_content = zip_file.read('StealthInterview-Desktop/package.json')
                        try:
                            import json
                            package_data = json.loads(package_content)
                            print(f"   Package name: {package_data.get('name', 'N/A')}")
                            print(f"   Package version: {package_data.get('version', 'N/A')}")
                            
                            # Check for required scripts
                            scripts = package_data.get('scripts', {})
                            if 'build:win' in scripts and 'build:mac' in scripts:
                                print("   ✅ Build scripts present")
                            else:
                                print("   ❌ Missing build scripts")
                                success = False
                        except json.JSONDecodeError:
                            print("   ❌ Invalid package.json format")
                            success = False
                
                self.tests_passed += 1 if success else 0
                print(f"✅ Passed - ZIP contents validated" if success else "❌ Failed - ZIP contents invalid")
                
            else:
                print(f"❌ Failed - Could not download ZIP file")
                success = False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            success = False
            
        self.tests_run += 1
        return success

    # =============================================================================
    # AUTO-UPDATE SERVER TESTS
    # =============================================================================

    def test_create_release(self):
        """Test creating a new release"""
        release_data = {
            "version": "1.2.1",
            "platform": "windows",
            "download_url": "https://github.com/stealthinterview/desktop/releases/download/v1.2.1/StealthInterview-1.2.1-Windows-Setup.exe",
            "release_notes": "Bug fixes and performance improvements",
            "file_size": 89000000,
            "sha512": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890abcdef123456789"
        }
        
        success, response = self.run_test(
            "Create Release",
            "POST",
            "releases",
            200,
            data=release_data
        )
        
        if success:
            print(f"   Created release version: {response.get('version', 'N/A')}")
            print(f"   Platform: {response.get('platform', 'N/A')}")
        return success

    def test_create_mac_release(self):
        """Test creating a Mac release"""
        release_data = {
            "version": "1.2.1",
            "platform": "mac",
            "download_url": "https://github.com/stealthinterview/desktop/releases/download/v1.2.1/StealthInterview-1.2.1-Mac-x64.dmg",
            "release_notes": "Mac version with Apple Silicon support",
            "file_size": 95000000,
            "sha512": "def456ghi789jkl012mno345pqr678stu901vwx234yz567890abcdef123456789abc123"
        }
        
        success, response = self.run_test(
            "Create Mac Release",
            "POST",
            "releases",
            200,
            data=release_data
        )
        
        if success:
            print(f"   Created Mac release version: {response.get('version', 'N/A')}")
        return success

    def test_create_older_windows_release(self):
        """Test creating an older Windows release for update testing"""
        release_data = {
            "version": "1.0.0",
            "platform": "windows",
            "download_url": "https://github.com/stealthinterview/desktop/releases/download/v1.0.0/StealthInterview-1.0.0-Windows-Setup.exe",
            "release_notes": "Initial release",
            "file_size": 85000000,
            "sha512": "old123def456ghi789jkl012mno345pqr678stu901vwx234yz567890abcdef123456789"
        }
        
        success, response = self.run_test(
            "Create Older Windows Release",
            "POST",
            "releases",
            200,
            data=release_data
        )
        
        if success:
            print(f"   Created older release version: {response.get('version', 'N/A')}")
        return success

    def test_get_latest_releases(self):
        """Test getting latest releases for all platforms"""
        success, response = self.run_test(
            "Get Latest Releases (All Platforms)",
            "GET",
            "releases/latest",
            200
        )
        
        if success and 'releases' in response:
            releases = response['releases']
            print(f"   Found {len(releases)} latest releases")
            
            # Check platforms
            platforms = [r.get('platform') for r in releases]
            print(f"   Platforms: {', '.join(platforms)}")
            
            # Verify each release has required fields
            for release in releases:
                if all(field in release for field in ['version', 'platform', 'download_url']):
                    print(f"   ✅ {release['platform']} v{release['version']} - Complete")
                else:
                    print(f"   ❌ {release.get('platform', 'Unknown')} - Missing fields")
                    success = False
        return success

    def test_get_latest_windows_release(self):
        """Test getting latest Windows release"""
        success, response = self.run_test(
            "Get Latest Windows Release",
            "GET",
            "releases/latest/windows",
            200
        )
        
        if success:
            print(f"   Windows version: {response.get('version', 'N/A')}")
            print(f"   Download URL: {response.get('download_url', 'N/A')}")
            print(f"   File size: {response.get('file_size', 'N/A')} bytes")
            print(f"   Is latest: {response.get('is_latest', False)}")
            
            # Verify required fields
            required_fields = ['version', 'platform', 'download_url', 'created_at']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   ❌ Missing fields: {', '.join(missing_fields)}")
                success = False
            else:
                print(f"   ✅ All required fields present")
        return success

    def test_get_latest_mac_release(self):
        """Test getting latest Mac release"""
        success, response = self.run_test(
            "Get Latest Mac Release",
            "GET",
            "releases/latest/mac",
            200
        )
        
        if success:
            print(f"   Mac version: {response.get('version', 'N/A')}")
            print(f"   Download URL: {response.get('download_url', 'N/A')}")
            print(f"   File size: {response.get('file_size', 'N/A')} bytes")
            print(f"   Is latest: {response.get('is_latest', False)}")
        return success

    def test_check_updates_windows_old_version(self):
        """Test checking for updates with old Windows version"""
        success, response = self.run_test(
            "Check Updates (Windows v1.0.0)",
            "GET",
            "updates/windows?current_version=1.0.0",
            200
        )
        
        if success:
            update_available = response.get('update_available', False)
            print(f"   Update available: {update_available}")
            
            if update_available:
                print(f"   New version: {response.get('version', 'N/A')}")
                print(f"   Download URL: {response.get('url', 'N/A')}")
                print(f"   SHA512: {response.get('sha512', 'N/A')[:20]}...")
                print(f"   Release notes: {response.get('releaseNotes', 'N/A')[:50]}...")
                
                # Verify electron-updater compatible format
                required_fields = ['version', 'url']
                missing_fields = [field for field in required_fields if field not in response]
                if missing_fields:
                    print(f"   ❌ Missing electron-updater fields: {', '.join(missing_fields)}")
                    success = False
                else:
                    print(f"   ✅ Electron-updater compatible format")
            else:
                print(f"   ❌ Expected update to be available for v1.0.0")
                success = False
        return success

    def test_check_updates_windows_current_version(self):
        """Test checking for updates with current Windows version"""
        success, response = self.run_test(
            "Check Updates (Windows v1.2.1)",
            "GET",
            "updates/windows?current_version=1.2.1",
            200
        )
        
        if success:
            update_available = response.get('update_available', False)
            print(f"   Update available: {update_available}")
            
            if not update_available:
                print(f"   ✅ No update needed for current version")
                current_version = response.get('current_version')
                if current_version:
                    print(f"   Current version: {current_version}")
            else:
                print(f"   ⚠️  Update available even for latest version")
                print(f"   New version: {response.get('version', 'N/A')}")
        return success

    def test_check_updates_no_version(self):
        """Test checking for updates without specifying current version"""
        success, response = self.run_test(
            "Check Updates (No Version)",
            "GET",
            "updates/windows",
            200
        )
        
        if success:
            update_available = response.get('update_available', False)
            print(f"   Update available: {update_available}")
            
            if update_available:
                print(f"   Latest version: {response.get('version', 'N/A')}")
                print(f"   Download URL: {response.get('url', 'N/A')}")
        return success

    def test_get_update_yml_windows(self):
        """Test getting update YAML for electron-updater (Windows)"""
        success, response = self.run_test(
            "Get Update YAML (Windows)",
            "GET",
            "updates/windows/latest.yml",
            200
        )
        
        # For YAML endpoint, response will be text, not JSON
        if success:
            print(f"   ✅ YAML endpoint accessible")
            # Note: response would be YAML text, not JSON
        return success

    def test_get_update_yml_mac(self):
        """Test getting update YAML for electron-updater (Mac)"""
        success, response = self.run_test(
            "Get Update YAML (Mac)",
            "GET",
            "updates/mac/latest.yml",
            200
        )
        
        if success:
            print(f"   ✅ Mac YAML endpoint accessible")
        return success

    def test_list_all_releases(self):
        """Test listing all releases"""
        success, response = self.run_test(
            "List All Releases",
            "GET",
            "releases",
            200
        )
        
        if success and 'releases' in response:
            releases = response['releases']
            total = response.get('total', len(releases))
            print(f"   Found {len(releases)} releases (total: {total})")
            
            # Group by platform
            platforms = {}
            for release in releases:
                platform = release.get('platform', 'unknown')
                if platform not in platforms:
                    platforms[platform] = []
                platforms[platform].append(release.get('version', 'unknown'))
            
            for platform, versions in platforms.items():
                print(f"   {platform}: {', '.join(versions)}")
        return success

    def test_list_releases_by_platform(self):
        """Test listing releases filtered by platform"""
        success, response = self.run_test(
            "List Windows Releases",
            "GET",
            "releases?platform=windows",
            200
        )
        
        if success and 'releases' in response:
            releases = response['releases']
            print(f"   Found {len(releases)} Windows releases")
            
            # Verify all are Windows releases
            non_windows = [r for r in releases if r.get('platform') != 'windows']
            if non_windows:
                print(f"   ❌ Found {len(non_windows)} non-Windows releases in filtered results")
                success = False
            else:
                print(f"   ✅ All releases are Windows platform")
                
            # Show versions
            versions = [r.get('version', 'unknown') for r in releases]
            print(f"   Versions: {', '.join(versions)}")
        return success

    def test_nonexistent_platform_release(self):
        """Test getting release for non-existent platform"""
        success, response = self.run_test(
            "Get Non-existent Platform Release",
            "GET",
            "releases/latest/nonexistent",
            404  # Should return 404 for non-existent platform
        )
        
        if success:
            print(f"   ✅ Correctly returns 404 for non-existent platform")
        return success

def main():
    print("🚀 Starting StealthInterview.ai API Tests")
    print("=" * 50)
    
    tester = StealthInterviewAPITester()
    
    # Core API Tests
    tests = [
        tester.test_health_check,
        tester.test_health_endpoint,
        tester.test_desktop_download_windows,  # Test desktop downloads first
        tester.test_desktop_download_mac,
        tester.test_desktop_download_zip_contents,
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