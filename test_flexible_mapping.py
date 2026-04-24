#!/usr/bin/env python
"""Test flexible column mapping with alternative column names"""
import requests
import json

# Test file path
test_file = "test_flexible_columns.csv"

print("=" * 60)
print("Testing Flexible Column Mapping")
print("=" * 60)
print(f"\n1. Testing with: {test_file}")
print("   Column names: duration, source_bytes, destination_bytes, protocol, connection_state")
print("   Expected mapping: dur, sbytes, dbytes, service, state")

# Open and upload file
try:
    with open(test_file, 'rb') as f:
        files = {'file': (test_file, f)}
        response = requests.post('http://localhost:8001/analyze', files=files)
    
    print(f"\n2. Backend Response:")
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   Status: {data.get('status')}")
        print(f"   Total: {data.get('total')} alerts")
        print(f"   File: {data.get('file')}")
        
        if 'warnings' in data and data['warnings']:
            print(f"\n3. Warnings (Column Mapping Details):")
            for warning in data['warnings']:
                print(f"   • {warning}")
        else:
            print(f"\n3. No warnings - perfect mapping!")
        
        if 'alerts' in data and data['alerts']:
            print(f"\n4. Sample Alert:")
            alert = data['alerts'][0]
            print(f"   Prediction: {alert.get('prediction')}")
            print(f"   Confidence: {alert.get('confidence'):.2%}")
            print(f"   Risk Level: {alert.get('risk')}")
        
        print(f"\n✅ TEST PASSED: Flexible column mapping works!")
        
    else:
        print(f"   Response: {response.text}")
        print(f"❌ TEST FAILED: Got status code {response.status_code}")
        
except FileNotFoundError:
    print(f"❌ Test file not found: {test_file}")
except Exception as e:
    print(f"❌ Error: {e}")
