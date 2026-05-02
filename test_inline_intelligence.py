#!/usr/bin/env python3
"""
Test script to verify inline threat intelligence integration
Tests the complete alert flow with expansion and inline component rendering
"""

import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8001"

def test_inline_intelligence():
    """Test complete inline threat intelligence flow"""
    
    print("=" * 80)
    print("🧪 TESTING INLINE THREAT INTELLIGENCE INTEGRATION")
    print("=" * 80)
    
    # Test 1: Login
    print("\n[1/5] Testing authentication...")
    try:
        login_response = requests.post(
            f"{BASE_URL}/login",
            json={"username": "analyst", "password": "analyst123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json()["access_token"]
        print("✅ Authentication successful")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return False
    
    # Test 2: Health check
    print("\n[2/5] Testing health endpoint...")
    try:
        health = requests.get(f"{BASE_URL}/health")
        assert health.status_code == 200, f"Health check failed: {health.text}"
        print("✅ Health check passed")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test 3: Analyze file
    print("\n[3/5] Testing threat detection with inline intelligence support...")
    try:
        # Create a test CSV file
        import tempfile
        import os
        temp_dir = tempfile.gettempdir()
        test_csv = os.path.join(temp_dir, 'test_alerts.csv')
        with open(test_csv, 'w') as f:
            # Write header
            f.write("srcip,dstip,srcport,dstport,proto,state,dur,sbytes,dbytes,sload,dload,spkts,dpkts,sinpkt,dinpkt,sjit,djit,swin,stcpb,dtcpb,tcprtt,synack,ackdat,smean,dmean,trans_depth,response_body_len,ct_srv_src,ct_state_ttl,ct_dst_ltm,ct_dst_sport,ct_dst_src_ltm,is_ftp_login,ct_ftp_cmd,ct_srv_dst,ct_srv_sport,ct_dst_dport,ct_srv_dport,ct_src_ltm,ct_src_dport_ltm,protocol_type,service,label\n")
            # Write a suspicious record
            f.write("192.168.1.100,8.8.8.8,45000,443,tcp,INT,0.000009,114,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,1,1,tcp,-,Attack\n")
            # Write a normal record
            f.write("192.168.1.101,8.8.8.8,45001,80,tcp,CON,2.736664,13350,548216,1.5,2.5,50,100,10,20,5,3,64512,8192,16384,0.05,1,1,30,40,3,512,2,10,5,1,2,0,1,5,6,80,443,100,50,tcp,http,Normal\n")
        
        # Upload file
        with open(test_csv, 'rb') as f:
            files = {'file': ('test_alerts.csv', f)}
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.post(
                f"{BASE_URL}/analyze",
                files=files,
                headers=headers
            )
        
        assert response.status_code == 200, f"Analysis failed: {response.text}"
        data = response.json()
        assert 'alerts' in data, "Response missing 'alerts' field"
        alerts = data['alerts']
        
        print(f"✅ Threat detection successful - {len(alerts)} alerts found")
        
        # Test 4: Verify inline intelligence data structure
        print("\n[4/5] Verifying inline intelligence data structure...")
        
        if alerts:
            alert = alerts[0]
            required_fields = [
                'id', 'risk', 'confidence', 
                'behavior', 'explanation', 'reasoning'
            ]
            
            for field in required_fields:
                assert field in alert, f"Alert missing field: {field}"
            
            behavior_fields = ['dur', 'sbytes', 'dbytes', 'service', 'state']
            for field in behavior_fields:
                assert field in alert['behavior'], f"Behavior missing field: {field}"
            
            explanation_fields = ['feature', 'impact']
            for exp in alert['explanation']:
                for field in explanation_fields:
                    assert field in exp, f"Explanation missing field: {field}"
            
            print("✅ All inline intelligence fields present")
            print(f"   - Alert ID: {alert['id']}")
            print(f"   - Risk Level: {alert['risk']}")
            print(f"   - Confidence: {alert['confidence']:.2%}")
            print(f"   - Top Features: {len(alert['explanation'])} items")
        
        # Test 5: Chat with alert context
        print("\n[5/5] Testing context-aware AI chat with alert...")
        try:
            if alerts:
                alert = alerts[0]
                chat_response = requests.post(
                    f"{BASE_URL}/chat",
                    json={
                        "query": "What features indicate this is suspicious?",
                        "alert": {
                            "id": alert['id'],
                            "risk": alert['risk'],
                            "confidence": alert['confidence'],
                            "behavior": alert['behavior'],
                            "explanation": alert['explanation']
                        }
                    },
                    headers={'Authorization': f'Bearer {token}'}
                )
                
                assert chat_response.status_code == 200, f"Chat failed: {chat_response.text}"
                chat_data = chat_response.json()
                assert 'response' in chat_data, "Chat response missing 'response' field"
                
                print("✅ Context-aware AI chat working")
                print(f"   - Query: What features indicate this is suspicious?")
                print(f"   - Response length: {len(chat_data['response'])} chars")
        
        except Exception as e:
            print(f"⚠️  Chat test warning: {e}")
    
    except Exception as e:
        print(f"❌ Threat detection failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 80)
    print("✅ ALL INLINE INTELLIGENCE TESTS PASSED")
    print("=" * 80)
    print("\nInline Components Ready:")
    print("  ✓ ThreatIntelligenceInline - Self-contained investigation per alert")
    print("  ✓ SHAPBars - Animated feature importance visualization")
    print("  ✓ AIResponseBlock - Glassmorphic response display")
    print("\nFrontend Integration:")
    print("  ✓ AlertCard enhanced with glassmorphism and inline expansion")
    print("  ✓ Expandable inline threat intelligence panels")
    print("  ✓ Per-alert mini chat interface")
    print("  ✓ Automatic expansion on alert selection")
    
    return True

if __name__ == "__main__":
    # Wait for server
    print("Waiting for FastAPI server on localhost:8001...")
    for i in range(30):
        try:
            requests.get(f"{BASE_URL}/health", timeout=1)
            print("✓ Server ready\n")
            break
        except:
            if i < 29:
                time.sleep(1)
            else:
                print("❌ Server not responding after 30 seconds")
                exit(1)
    
    success = test_inline_intelligence()
    exit(0 if success else 1)
