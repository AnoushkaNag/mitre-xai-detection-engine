# 🐛 Debugging Guide for Frontend-Backend Integration

## How to Debug

### 1. Open Browser Developer Tools
- Press **F12** in your browser
- Go to **Console** tab
- You'll see color-coded logs from the frontend

### 2. Monitor Backend Logs
- Watch the terminal where you ran `python backend.py`
- You'll see server-side logs with 🔵🟡🟢 emojis

## Log Color Codes

### Frontend (Browser Console)
- 🔴 **Red** = TopBar / Button clicks
- 🔵 **Blue** = Main upload handler
- 🟢 **Green** = UploadBox file selection
- 🟡 **Yellow** = ChatBox messages

### Backend (Terminal)
- 🔵 **Blue** = `/analyze` endpoint
- 🟡 **Yellow** = `/chat` endpoint
- 🟢 **Green** = `/health` endpoint

## Complete Flow with Logs

### Upload File Flow:
```
1. Click Upload Button
   → 🔴 [TopBar] Upload button clicked
   
2. Select File
   → 🟢 [UploadBox] File selected: test.csv
   → 🟢 [UploadBox] Calling onUpload handler...
   
3. Frontend API Call
   → 🔵 [handleUpload] START - File selected
   → 🔵 [handleUpload] FormData created, calling API...
   → 🔵 [handleUpload] Endpoint: http://localhost:8001/analyze
   
4. Backend Processing
   → 🔵 [/analyze] REQUEST - File: test.csv, Size: 200
   → 🔵 [/analyze] File read: 200 bytes
   → 🔵 [/analyze] CSV loaded: (5, 5)
   → 🔵 [/analyze] Preprocessing data...
   → 🔵 [/analyze] Running predictions...
   → 🔵 [/analyze] Computing SHAP values...
   → ✅ [/analyze] Generated 3 alerts
   
5. Frontend Response
   → 🔵 [handleUpload] Response status: 200 OK
   → 🔵 [handleUpload] Alerts received: 3
   → ✅ [handleUpload] SUCCESS - Alerts updated
   
6. Display Results
   → Upload box closes
   → Alerts appear in list
```

### Chat Flow:
```
1. Type message and press Enter
   → 🟡 [ChatBox] Sending message: "What is SHAP?"
   → 🟡 [ChatBox] Calling API endpoint: http://localhost:8001/chat
   
2. Backend Response
   → 🟡 [/chat] REQUEST - Message: what is shap?
   → 🟡 [/chat] Matched keyword: shap
   → ✅ [/chat] Sending response
   
3. Display Response
   → 🟡 [ChatBox] Response status: 200
   → ✅ [ChatBox] Message received and displayed
```

## Troubleshooting

### Issue: No logs appearing in console
- **Check**: Is the browser console open? (F12 → Console tab)
- **Check**: Are you running http://localhost:3000 (NOT localhost:3001)?
- **Check**: Did you click the Upload button?

### Issue: Frontend logs show, but no backend logs
- **Problem**: API call not reaching backend
- **Check**: Is backend running on port 8001? (`python backend.py`)
- **Check**: Does terminal show "Uvicorn running on http://0.0.0.0:8001"?
- **Fix**: Restart backend with `python backend.py`

### Issue: Backend logs show error status
- **Check**: What's the HTTP status code? (200=OK, 400=bad request, 500=server error)
- **Check**: Look at the error message in logs
- **Fix**: Check file format (must be CSV with columns: dur, sbytes, dbytes, service, state)

### Issue: Upload shows success but no alerts appear
- **Check**: Did backend show "Generated X alerts"?
- **Check**: Is X > 0 (if 0, all records may be normal traffic)
- **Check**: Browser console for any JavaScript errors after upload

## Test with Sample File

Use the included `test_sample.csv`:
```powershell
# Windows PowerShell
cd c:\Users\KIIT0001\Desktop\mitre-xai-detection-engine
# Now use GUI to upload test_sample.csv
```

Expected result: Should see 2-3 alerts with HIGH risk

## Quick Fixes

### Port conflicts
```powershell
# Kill any processes on port 8001
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Restart backend
python backend.py
```

### Module not found
```powershell
# Ensure all dependencies installed
.\venv\Scripts\activate
pip install -r requirements.txt
```

### CORS errors
- Check browser console for "CORS policy" errors
- Ensure backend CORS config includes http://localhost:3000
- Restart both frontend and backend

## API Endpoints Reference

| Endpoint | Method | Purpose | Logs |
|----------|--------|---------|------|
| `/health` | GET | Health check | 🟢 [/health] |
| `/analyze` | POST | Upload & analyze | 🔵 [/analyze] |
| `/chat` | POST | Q&A | 🟡 [/chat] |
| `/docs` | GET | Swagger UI | - |
| `/redoc` | GET | ReDoc | - |

## Monitor Both Windows Simultaneously

**Setup**:
1. Terminal 1: `cd frontend && npm run dev` (runs on 3000)
2. Terminal 2: `python backend.py` (runs on 8001)
3. Browser: Open http://localhost:3000 (F12 for console)
4. Watch: 
   - Browser console (colored logs)
   - Terminal 2 output (backend logs)

**Action**:
- Click Upload in browser
- See logs flow from browser → backend → browser response

---

**Remember**: Every button click, file upload, and message sends logs to help you see what's happening! 🔍
