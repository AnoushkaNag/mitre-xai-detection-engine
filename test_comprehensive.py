#!/usr/bin/env python
"""
Comprehensive integration test for ThreatXAI system
Tests RBAC, file upload, button workflow, and all features
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8001"
FRONTEND_URL = "http://localhost:3000"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []
    
    def add_pass(self, name):
        self.passed += 1
        self.tests.append(("✅ PASS", name))
        print(f"✅ {name}")
    
    def add_fail(self, name, error):
        self.failed += 1
        self.tests.append(("❌ FAIL", name, str(error)))
        print(f"❌ {name}: {error}")
    
    def summary(self):
        print("\n" + "="*70)
        print(f"TEST SUMMARY: {self.passed} passed, {self.failed} failed")
        print("="*70)
        for test in self.tests:
            if len(test) == 2:
                status, name = test
                print(f"{status}: {name}")
            else:
                status, name, error = test
                print(f"{status}: {name}")
                print(f"  └─ {error}")
        return self.failed == 0

results = TestResults()

print("="*70)
print("THREATXAI COMPREHENSIVE INTEGRATION TEST")
print("="*70)

# Test 1: Backend Health
print("\n[1/10] Testing backend health...")
try:
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data['model_loaded'] and data['explainer_loaded']
    results.add_pass("Backend health check")
except Exception as e:
    results.add_fail("Backend health check", e)

# Test 2: Frontend serving
print("[2/10] Testing frontend serving...")
try:
    response = requests.get(FRONTEND_URL)
    assert response.status_code == 200
    results.add_pass("Frontend HTTP response")
except Exception as e:
    results.add_fail("Frontend HTTP response", e)

# Test 3: Login with analyst role
print("[3/10] Testing analyst login...")
try:
    response = requests.post(
        f"{BASE_URL}/login",
        json={"username": "analyst", "password": "analyst123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data['user_role'] == 'analyst'
    analyst_token = data['access_token']
    results.add_pass("Analyst login (JWT token generated)")
except Exception as e:
    results.add_fail("Analyst login", e)
    analyst_token = None

# Test 4: Login with admin role
print("[4/10] Testing admin login...")
try:
    response = requests.post(
        f"{BASE_URL}/login",
        json={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data['user_role'] == 'admin'
    admin_token = data['access_token']
    results.add_pass("Admin login (JWT token generated)")
except Exception as e:
    results.add_fail("Admin login", e)
    admin_token = None

# Test 5: Login with viewer role
print("[5/10] Testing viewer login...")
try:
    response = requests.post(
        f"{BASE_URL}/login",
        json={"username": "viewer", "password": "viewer123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data['user_role'] == 'viewer'
    viewer_token = data['access_token']
    results.add_pass("Viewer login (JWT token generated)")
except Exception as e:
    results.add_fail("Viewer login", e)
    viewer_token = None

# Test 6: Analyst upload (should succeed)
print("[6/10] Testing analyst file upload (authorized)...")
try:
    if analyst_token:
        with open("test_sample.csv", "rb") as f:
            files = {"file": f}
            headers = {"Authorization": f"Bearer {analyst_token}"}
            response = requests.post(
                f"{BASE_URL}/analyze",
                files=files,
                headers=headers
            )
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'success'
        assert len(data['alerts']) == 5
        assert data['detected_format'] == 'csv'
        results.add_pass("Analyst upload successful (5 alerts generated)")
    else:
        results.add_fail("Analyst upload", "No token available")
except Exception as e:
    results.add_fail("Analyst upload", e)

# Test 7: Viewer upload (should fail - no analyze permission)
print("[7/10] Testing viewer file upload (should be denied)...")
try:
    if viewer_token:
        with open("test_sample.csv", "rb") as f:
            files = {"file": f}
            headers = {"Authorization": f"Bearer {viewer_token}"}
            response = requests.post(
                f"{BASE_URL}/analyze",
                files=files,
                headers=headers
            )
        # Viewer should get 403 (permission denied)
        if response.status_code == 403:
            results.add_pass("Viewer correctly denied (403 Forbidden)")
        else:
            results.add_fail("Viewer upload permission check", 
                           f"Expected 403, got {response.status_code}")
    else:
        results.add_fail("Viewer upload test", "No token available")
except Exception as e:
    results.add_fail("Viewer upload test", e)

# Test 8: Flexible file format (test with flexible columns)
print("[8/10] Testing flexible file format detection...")
try:
    if analyst_token:
        with open("test_flexible_columns.csv", "rb") as f:
            files = {"file": f}
            headers = {"Authorization": f"Bearer {analyst_token}"}
            response = requests.post(
                f"{BASE_URL}/analyze",
                files=files,
                headers=headers
            )
        assert response.status_code == 200
        data = response.json()
        assert data['detected_format'] == 'csv'
        assert len(data['alerts']) > 0
        results.add_pass("Flexible column mapping works (alternative names detected)")
    else:
        results.add_fail("Flexible format test", "No token available")
except Exception as e:
    results.add_fail("Flexible format test", e)

# Test 9: Missing columns handling
print("[9/10] Testing missing column handling...")
try:
    if analyst_token:
        with open("test_missing_columns.csv", "rb") as f:
            files = {"file": f}
            headers = {"Authorization": f"Bearer {analyst_token}"}
            response = requests.post(
                f"{BASE_URL}/analyze",
                files=files,
                headers=headers
            )
        assert response.status_code == 200
        data = response.json()
        assert len(data['warnings']) > 0  # Should have warnings about missing columns
        assert len(data['alerts']) > 0  # But still generates alerts with defaults
        results.add_pass(f"Missing columns handled (generated {len(data['warnings'])} warnings)")
    else:
        results.add_fail("Missing columns test", "No token available")
except Exception as e:
    results.add_fail("Missing columns test", e)

# Test 10: Invalid credentials
print("[10/10] Testing invalid login credentials...")
try:
    response = requests.post(
        f"{BASE_URL}/login",
        json={"username": "invalid", "password": "invalid"}
    )
    assert response.status_code == 401
    results.add_pass("Invalid credentials correctly rejected (401)")
except Exception as e:
    results.add_fail("Invalid credentials test", e)

# Summary
success = results.summary()
sys.exit(0 if success else 1)
