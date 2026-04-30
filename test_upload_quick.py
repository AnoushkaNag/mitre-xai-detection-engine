#!/usr/bin/env python
"""Quick test of upload functionality after performance optimization"""

import requests
import json
import time

BASE_URL = "http://localhost:8001"

# Get analyst token
print("Getting analyst token...")
response = requests.post(
    f"{BASE_URL}/login",
    json={"username": "analyst", "password": "analyst123"}
)
token = response.json()["access_token"]
print(f"✅ Got analyst token")

# Try uploading
print("\nUploading test_sample.csv...")
start = time.time()
with open("test_sample.csv", "rb") as f:
    files = {"file": f}
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/analyze", files=files, headers=headers)

elapsed = time.time() - start

print(f"Response time: {elapsed:.2f} seconds")
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"✅ Success! Generated {data['total']} alerts")
    if data['alerts']:
        alert = data['alerts'][0]
        print(f"\nFirst alert details:")
        print(f"  - Prediction: {alert['prediction']}")
        print(f"  - Confidence: {alert['confidence']:.4f}")
        print(f"  - Risk: {alert['risk']}")
        print(f"  - Explanation features: {len(alert['explanation'])}")
        print(f"  - Reasoning: {', '.join(alert['reasoning'][:2])}")
else:
    print(f"❌ Error: {response.text}")

print("\n✅ TEST COMPLETE")
