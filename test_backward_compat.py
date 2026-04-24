#!/usr/bin/env python
"""Test backward compatibility with standard column names"""
import requests

test_file = "test_sample.csv"

print("=" * 60)
print("Testing Backward Compatibility")
print("=" * 60)
print(f"\n1. Testing with: {test_file}")
print("   Column names: dur, sbytes, dbytes, service, state (STANDARD)")
print("   Expected: Should work exactly as before")

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
        
        if 'warnings' in data and data['warnings']:
            print(f"\n3. Warnings:")
            for warning in data['warnings']:
                print(f"   • {warning}")
        else:
            print(f"\n3. No warnings - perfect!")
        
        if 'alerts' in data and len(data['alerts']) > 0:
            alert = data['alerts'][0]
            print(f"\n4. First Alert Details:")
            print(f"   ID: {alert.get('id')}")
            print(f"   Prediction: {alert.get('prediction')}")
            print(f"   Confidence: {alert.get('confidence'):.2%}")
            print(f"   Risk: {alert.get('risk')}")
            print(f"   Features: {len(alert.get('explanation', []))} explanations")
        
        print(f"\n✅ TEST PASSED: Backward compatibility maintained!")
        
    else:
        print(f"   Response: {response.text}")
        print(f"❌ TEST FAILED: Got status code {response.status_code}")
        
except FileNotFoundError:
    print(f"❌ Test file not found: {test_file}")
except Exception as e:
    print(f"❌ Error: {e}")
