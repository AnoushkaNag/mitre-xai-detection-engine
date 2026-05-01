import requests
import json

# Test 1: Get token
print('Test 1: Getting token...')
r = requests.post('http://localhost:8001/login', json={'username': 'analyst', 'password': 'analyst123'})
print(f'Status: {r.status_code}')
if r.status_code == 200:
    token = r.json()['access_token']
    print(f'Token: {token[:50]}...')
    
    # Test 2: Use token to analyze
    print('\nTest 2: Analyzing with token...')
    with open('test_sample.csv', 'rb') as f:
        headers = {'Authorization': f'Bearer {token}'}
        r2 = requests.post('http://localhost:8001/analyze', files={'file': f}, headers=headers)
        print(f'Status: {r2.status_code}')
        if r2.status_code == 200:
            print(f'Analysis succeeded, got {r2.json().get("total", 0)} alerts')
        else:
            print(f'Analysis failed: {r2.text}')
else:
    print(f'Login failed: {r.text}')
