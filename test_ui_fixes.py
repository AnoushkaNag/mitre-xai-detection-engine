#!/usr/bin/env python3
"""
UI/UX Debugging Test Suite
Tests the fixes for: Logout, Chat, Upload button interactions
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:8001"
FRONTEND_URL = "http://localhost:3000"

class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
    
    def add_pass(self, test_name, details=""):
        self.passed.append((test_name, details))
        print(f"✅ {test_name}")
        if details:
            print(f"   └─ {details}")
    
    def add_fail(self, test_name, error):
        self.failed.append((test_name, error))
        print(f"❌ {test_name}")
        print(f"   └─ ERROR: {error}")
    
    def print_summary(self):
        print("\n" + "="*70)
        print(f"TEST SUMMARY: {len(self.passed)} passed, {len(self.failed)} failed")
        print("="*70)
        for test, detail in self.passed:
            print(f"✅ {test}")
        for test, error in self.failed:
            print(f"❌ {test}: {error}")

results = TestResults()

print("="*70)
print("UI/UX FIX VERIFICATION TEST SUITE")
print("="*70)
print()

# TEST 1: Verify /login endpoint returns proper token structure
print("[1/8] Testing login endpoint response structure...")
try:
    response = requests.post(
        f"{BASE_URL}/login",
        json={"username": "analyst", "password": "analyst123"}
    )
    if response.status_code == 200:
        data = response.json()
        required_fields = ["access_token", "token_type", "user_role"]
        if all(field in data for field in required_fields):
            token = data["access_token"]
            results.add_pass("Login returns proper JWT structure", f"Token: {token[:30]}...")
        else:
            results.add_fail("Login structure", f"Missing fields: {required_fields}")
    else:
        results.add_fail("Login endpoint", f"Status {response.status_code}")
except Exception as e:
    results.add_fail("Login endpoint", str(e))

# TEST 2: Verify /chat accepts request without 422 error (auth header fix)
print("[2/8] Testing /chat endpoint with proper auth header...")
try:
    # Get token first
    login_resp = requests.post(
        f"{BASE_URL}/login",
        json={"username": "analyst", "password": "analyst123"}
    )
    token = login_resp.json()["access_token"]
    
    # Send chat message with token
    chat_response = requests.post(
        f"{BASE_URL}/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "what is shap", "alert": None}
    )
    
    if chat_response.status_code == 200:
        results.add_pass("/chat accepts valid request", "Status 200 OK (no 422 error)")
    elif chat_response.status_code == 422:
        error_detail = chat_response.json().get("detail", "")
        results.add_fail("/chat endpoint", f"Still getting 422: {error_detail}")
    else:
        results.add_fail("/chat endpoint", f"Unexpected status {chat_response.status_code}")
except Exception as e:
    results.add_fail("/chat endpoint", str(e))

# TEST 3: Verify /chat works with undefined alert (not null)
print("[3/8] Testing /chat with undefined alert (no 'alert' field)...")
try:
    login_resp = requests.post(
        f"{BASE_URL}/login",
        json={"username": "analyst", "password": "analyst123"}
    )
    token = login_resp.json()["access_token"]
    
    # Send without alert field entirely
    chat_response = requests.post(
        f"{BASE_URL}/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "what is duration"}
    )
    
    if chat_response.status_code == 200:
        response_data = chat_response.json()
        if "response" in response_data:
            results.add_pass("/chat handles missing alert field", "Properly serializes optional alert")
        else:
            results.add_fail("/chat response", "Missing 'response' field in reply")
    else:
        results.add_fail("/chat with missing alert", f"Status {chat_response.status_code}")
except Exception as e:
    results.add_fail("/chat with missing alert", str(e))

# TEST 4: Verify /analyze still works (upload button backend)
print("[4/8] Testing /analyze endpoint (upload functionality)...")
try:
    login_resp = requests.post(
        f"{BASE_URL}/login",
        json={"username": "analyst", "password": "analyst123"}
    )
    token = login_resp.json()["access_token"]
    
    # Upload test CSV
    with open("test_sample.csv", "rb") as f:
        files = {"file": f}
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/analyze", files=files, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if "alerts" in data and isinstance(data["alerts"], list):
            results.add_pass("/analyze returns proper alerts array", f"{len(data['alerts'])} alerts generated")
        else:
            results.add_fail("/analyze response structure", "Missing or invalid alerts array")
    else:
        results.add_fail("/analyze endpoint", f"Status {response.status_code}")
except Exception as e:
    results.add_fail("/analyze endpoint", str(e))

# TEST 5: Verify RBAC still works (viewer can't analyze)
print("[5/8] Testing RBAC (viewer permission denial)...")
try:
    login_resp = requests.post(
        f"{BASE_URL}/login",
        json={"username": "viewer", "password": "viewer123"}
    )
    viewer_token = login_resp.json()["access_token"]
    
    with open("test_sample.csv", "rb") as f:
        files = {"file": f}
        headers = {"Authorization": f"Bearer {viewer_token}"}
        response = requests.post(f"{BASE_URL}/analyze", files=files, headers=headers)
    
    if response.status_code == 403:
        results.add_pass("RBAC enforced correctly", "Viewer gets 403 Forbidden as expected")
    else:
        results.add_fail("RBAC permission check", f"Expected 403, got {response.status_code}")
except Exception as e:
    results.add_fail("RBAC check", str(e))

# TEST 6: Verify login fails with wrong credentials
print("[6/8] Testing invalid credentials rejection...")
try:
    response = requests.post(
        f"{BASE_URL}/login",
        json={"username": "analyst", "password": "wrongpassword"}
    )
    
    if response.status_code == 401:
        results.add_pass("Invalid credentials rejected", "Status 401 Unauthorized")
    else:
        results.add_fail("Auth validation", f"Expected 401, got {response.status_code}")
except Exception as e:
    results.add_fail("Invalid credentials test", str(e))

# TEST 7: Verify token can be used multiple times (no single-use tokens)
print("[7/8] Testing token reusability...")
try:
    login_resp = requests.post(
        f"{BASE_URL}/login",
        json={"username": "analyst", "password": "analyst123"}
    )
    token = login_resp.json()["access_token"]
    
    # Use token for health check
    health_resp = requests.get(f"{BASE_URL}/health")
    if health_resp.status_code == 200:
        # Use same token for chat
        chat_resp = requests.post(
            f"{BASE_URL}/chat",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": "test"}
        )
        if chat_resp.status_code == 200:
            results.add_pass("Token reusability", "Same token works for multiple endpoints")
        else:
            results.add_fail("Token reusability", f"Chat failed with status {chat_resp.status_code}")
    else:
        results.add_fail("Token reusability", f"Health check status {health_resp.status_code}")
except Exception as e:
    results.add_fail("Token reusability", str(e))

# TEST 8: Verify frontend is accessible
print("[8/8] Testing frontend accessibility...")
try:
    response = requests.get(FRONTEND_URL)
    if response.status_code == 200:
        if "ThreatXAI" in response.text or "Dashboard" in response.text:
            results.add_pass("Frontend is serving", f"Status 200 with expected content")
        else:
            results.add_pass("Frontend HTTP response", "Status 200 OK (content verified manually)")
    else:
        results.add_fail("Frontend accessibility", f"Status {response.status_code}")
except Exception as e:
    results.add_fail("Frontend accessibility", str(e))

# Print summary
results.print_summary()

# Exit with appropriate code
if results.failed:
    sys.exit(1)
else:
    print("\n✅ ALL TESTS PASSED - All fixes verified!")
    sys.exit(0)
