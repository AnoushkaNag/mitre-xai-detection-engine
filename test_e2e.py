#!/usr/bin/env python
"""End-to-end test of RBAC + file upload"""

import requests
import json

BASE_URL = "http://localhost:8001"

def test_login():
    """Test login endpoint"""
    print("🔐 Testing login...")
    response = requests.post(
        f"{BASE_URL}/login",
        json={"username": "analyst", "password": "analyst123"}
    )
    assert response.status_code == 200, f"Login failed: {response.status_code}"
    data = response.json()
    assert "access_token" in data
    print(f"✅ Login successful, role: {data['user_role']}")
    return data["access_token"]

def test_upload(token):
    """Test file upload with token"""
    print("\n📤 Testing file upload...")
    with open("test_sample.csv", "rb") as f:
        files = {"file": f}
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/analyze",
            files=files,
            headers=headers
        )
    
    assert response.status_code == 200, f"Upload failed: {response.status_code} - {response.text}"
    data = response.json()
    print(f"✅ Upload successful")
    print(f"   - Status: {data['status']}")
    print(f"   - Total alerts: {len(data['alerts'])}")
    print(f"   - Detected format: {data.get('detected_format', 'N/A')}")
    print(f"   - Warnings: {len(data.get('warnings', []))}")
    return data

def test_health():
    """Test health endpoint"""
    print("\n💚 Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    print(f"✅ Health check passed")
    print(f"   - Model loaded: {data['model_loaded']}")
    print(f"   - Explainer loaded: {data['explainer_loaded']}")

if __name__ == "__main__":
    print("=" * 60)
    print("THREATXAI END-TO-END TEST")
    print("=" * 60)
    
    try:
        test_health()
        token = test_login()
        result = test_upload(token)
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print("\n📊 Sample Alert Details:")
        if result['alerts']:
            alert = result['alerts'][0]
            print(f"   - Risk: {alert['risk']}")
            print(f"   - Confidence: {alert['confidence']:.2%}")
            print(f"   - Duration: {alert['behavior']['dur']}")
            print(f"   - Top feature: {alert['explanation'][0]['feature']}")
    
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
