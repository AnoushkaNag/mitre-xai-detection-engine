#!/usr/bin/env python
"""Test missing column handling"""
import requests
import json

test_file = "test_missing_columns.csv"

print("=" * 60)
print("Testing Missing Column Handling")
print("=" * 60)
print(f"\n1. Testing with: {test_file}")
print("   Available columns: duration, protocol")
print("   Missing columns: source_bytes, destination_bytes, connection_state")
print("   Expected: Should fill missing with defaults (0 for numeric, 'unknown' for categorical)")

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
            print(f"\n3. Warnings (Shows Missing Column Fills):")
            for warning in data['warnings']:
                print(f"   • {warning}")
        else:
            print(f"\n3. No warnings")
        
        if 'alerts' in data and data['alerts']:
            print(f"\n4. Alerts Generated Successfully:")
            print(f"   First alert prediction: {data['alerts'][0].get('prediction')}")
            print(f"   First alert confidence: {data['alerts'][0].get('confidence'):.2%}")
        
        print(f"\n✅ TEST PASSED: Missing columns handled gracefully!")
        
    else:
        print(f"   Response: {response.text}")
        print(f"❌ TEST FAILED: Got status code {response.status_code}")
        
except FileNotFoundError:
    print(f"❌ Test file not found: {test_file}")
except Exception as e:
    print(f"❌ Error: {e}")
