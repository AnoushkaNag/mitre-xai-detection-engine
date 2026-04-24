"""
FastAPI Backend for XAI Threat Detection Engine
Handles threat analysis, SHAP explanations, and Q&A
"""

import os
import io
import json
import pickle
import numpy as np
import pandas as pd
import shap
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# ============================================================================
# SETUP & INITIALIZATION
# ============================================================================

app = FastAPI(title="ThreatXAI API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
model = None
explainer = None
feature_names = None
label_encoder = None

MODEL_PATH = "trained_model.pkl"
EXPLAINER_PATH = "shap_explainer.pkl"


# ============================================================================
# PYDANTIC MODELS (Request/Response schemas)
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    alert: dict = None


class AlertResponse(BaseModel):
    id: str
    prediction: str  # "attack" or "normal"
    confidence: float
    risk: str  # "HIGH", "MEDIUM", "LOW"
    behavior: dict
    explanation: list
    reasoning: list


# ============================================================================
# INITIALIZATION FUNCTIONS
# ============================================================================

def train_and_save_model():
    """Train model on UNSW-NB15 and save to disk"""
    global model, explainer, feature_names, label_encoder

    print("📊 Loading UNSW-NB15 dataset...")
    df = pd.read_parquet("data/UNSW_NB15_training-set.parquet")

    # Feature selection (NO attack_cat to prevent data leakage)
    behavioral_features = ["dur", "sbytes", "dbytes", "service", "state"]
    df = df[behavioral_features + ["label"]].copy()

    # One-hot encode categorical features
    df = pd.get_dummies(df, columns=["service", "state"], drop_first=False)

    # Separate features and target
    X = df.drop(columns=["label"])
    y = df["label"]

    feature_names = X.columns.tolist()

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Train model
    print("🤖 Training RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=100, random_state=42, n_jobs=-1, max_depth=15
    )
    model.fit(X_train, y_train)

    # Evaluate
    accuracy = model.score(X_test, y_test)
    print(f"✓ Model Accuracy: {accuracy:.4f}")

    # Create SHAP explainer
    print("📈 Creating SHAP explainer...")
    explainer = shap.TreeExplainer(model)

    # Save to disk
    print(f"💾 Saving model to {MODEL_PATH}")
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"model": model, "feature_names": feature_names}, f)

    print(f"💾 Saving explainer to {EXPLAINER_PATH}")
    with open(EXPLAINER_PATH, "wb") as f:
        pickle.dump(explainer, f)

    print("✓ Model training and saving complete!")
    return True


def load_model():
    """Load trained model from disk"""
    global model, explainer, feature_names

    if Path(MODEL_PATH).exists() and Path(EXPLAINER_PATH).exists():
        print(f"📂 Loading model from {MODEL_PATH}")
        with open(MODEL_PATH, "rb") as f:
            data = pickle.load(f)
            model = data["model"]
            feature_names = data["feature_names"]

        print(f"📂 Loading explainer from {EXPLAINER_PATH}")
        with open(EXPLAINER_PATH, "rb") as f:
            explainer = pickle.load(f)

        print("✓ Model and explainer loaded successfully")
        return True
    else:
        print("⚠ Model not found. Training new model...")
        return train_and_save_model()


# ============================================================================
# PREPROCESSING FUNCTIONS
# ============================================================================

def preprocess_data(df):
    """Apply same preprocessing as training data"""
    # Select behavioral features
    behavioral_features = ["dur", "sbytes", "dbytes", "service", "state"]
    df = df[behavioral_features].copy()

    # One-hot encode
    df = pd.get_dummies(df, columns=["service", "state"], drop_first=False)

    # Align with training feature names
    for col in feature_names:
        if col not in df.columns:
            df[col] = 0

    df = df[feature_names]
    return df


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health")
async def health():
    """Health check endpoint"""
    print("🟢 [/health] Health check request")
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "explainer_loaded": explainer is not None,
    }


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    Analyze uploaded file for threat detection
    
    Accepts: CSV or JSON
    Returns: Array of alerts with predictions and SHAP explanations
    """
    print(f"\n🔵 [/analyze] REQUEST - File: {file.filename}, Size: {file.size}")
    
    if not file.filename:
        print("❌ [/analyze] No file provided")
        raise HTTPException(status_code=400, detail="No file provided")

    try:
        # Read file
        contents = await file.read()
        print(f"🔵 [/analyze] File read: {len(contents)} bytes")

        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.StringIO(contents.decode()))
            print(f"🔵 [/analyze] CSV loaded: {df.shape}")
        elif file.filename.endswith(".json"):
            df = pd.read_json(io.StringIO(contents.decode()))
            print(f"🔵 [/analyze] JSON loaded: {df.shape}")
        else:
            print(f"❌ [/analyze] Unsupported format: {file.filename}")
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Use CSV or JSON.",
            )

        # Validate required columns
        required = ["dur", "sbytes", "dbytes", "service", "state"]
        missing = [col for col in required if col not in df.columns]
        if missing:
            print(f"❌ [/analyze] Missing columns: {missing}")
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing)}",
            )

        # Preprocess
        print("🔵 [/analyze] Preprocessing data...")
        X = preprocess_data(df)
        print(f"🔵 [/analyze] Data preprocessed: {X.shape}")

        # Predict
        print("🔵 [/analyze] Running predictions...")
        predictions = model.predict(X)
        probabilities = model.predict_proba(X)
        print(f"🔵 [/analyze] Predictions: {predictions}")

        # Get SHAP values
        print("🔵 [/analyze] Computing SHAP values...")
        shap_values = explainer.shap_values(X)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]  # Attack class
        print(f"🔵 [/analyze] SHAP computed: {shap_values.shape}")

        # Generate alerts
        alerts = []
        for idx, (pred, prob) in enumerate(
            zip(predictions, probabilities)
        ):
            # Calculate confidence for predicted class
            confidence = prob[pred]
            print(f"🔵 [/analyze] Row {idx}: prediction={pred}, confidence={confidence:.4f}")

            # Include all traffic (both normal and attack)
            # Normal traffic (pred=0) has low risk, attack traffic (pred=1) has high risk

            # Get top 5 SHAP features
            shap_val = shap_values[idx]
            top_indices = np.argsort(np.abs(shap_val))[-5:][::-1]

            explanation = []
            for i in top_indices:
                explanation.append({
                    "feature": feature_names[i],
                    "impact": float(shap_val[i]),
                })

            # Generate reasoning
            reasoning = []
            top_feature = feature_names[top_indices[0]]
            top_impact = shap_val[top_indices[0]]

            if "sbytes" in top_feature or top_impact > 0:
                reasoning.append("High outbound data transfer detected")
            if "dbytes" in top_feature or top_impact > 0:
                reasoning.append("Suspicious incoming data pattern")
            if "dur" in top_feature:
                reasoning.append("Unusual session duration detected")

            if not reasoning:
                reasoning.append("Anomalous network behavior detected")

            # Determine risk level based on prediction and confidence
            if pred == 1:  # Attack detected
                if confidence > 0.85:
                    risk = "HIGH"
                elif confidence > 0.70:
                    risk = "MEDIUM"
                else:
                    risk = "LOW"
            else:  # Normal traffic
                if confidence > 0.90:
                    risk = "LOW"
                else:
                    risk = "LOW"

            alert = {
                "id": f"alert-{idx}",
                "prediction": "attack" if pred == 1 else "normal",
                "confidence": float(confidence),
                "risk": risk,
                "behavior": {
                    "dur": float(df.iloc[idx]["dur"]),
                    "sbytes": int(df.iloc[idx]["sbytes"]),
                    "dbytes": int(df.iloc[idx]["dbytes"]),
                    "service": str(df.iloc[idx]["service"]),
                    "state": str(df.iloc[idx]["state"]),
                },
                "explanation": explanation,
                "reasoning": reasoning,
            }
            alerts.append(alert)
            print(f"🔵 [/analyze] Alert {idx} added: {alert['prediction']} ({risk})")

        print(f"✅ [/analyze] Generated {len(alerts)} alerts from {len(predictions)} total rows")
        print(f"✅ [/analyze] Response body: {{status: 'success', alerts: [{len(alerts)} items]}}")
        return {
            "status": "success",
            "total": len(alerts),
            "file": file.filename,
            "alerts": alerts,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [/analyze] ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Threat intelligence Q&A endpoint
    
    Accepts: {message: str, alert: dict}
    Returns: {response: str}
    """
    print(f"\n🟡 [/chat] REQUEST - Message: {request.message}")
    
    message = request.message.lower()

    # Rule-based threat intelligence responses
    threat_kb = {
        "shap": "SHAP explains how features contribute to the threat prediction. Positive values increase attack likelihood, negative values decrease it.",
        "confidence": "Confidence indicates the model's certainty (0-1). Higher values mean stronger attack indicators. >0.85 is HIGH risk.",
        "false positive": "False positives occur when normal traffic is flagged. SHAP helps verify by showing which features drove the decision.",
        "sbytes": "Source bytes (data sent) can indicate command injection, data exfiltration, or malware communication.",
        "dbytes": "Destination bytes (data received) patterns can reveal malware downloads or command & control communication.",
        "duration": "Connection duration: very short (<0.1s) often indicates scanning; very long may indicate reverse shell or data extraction.",
        "service": "Service type (http, ssh, ftp, dns) helps classify the attack vector and determine appropriate response.",
        "state": "Connection state (CON, FIN, RST) shows how the connection was terminated and can indicate abrupt disconnections.",
        "mitigate": "Mitigations: 1) Block source IP, 2) Inspect payloads, 3) Check for C&C domains, 4) Review firewall rules.",
        "attack": "This traffic matches attack patterns in UNSW-NB15. Recommend investigating connection details and flow logs.",
        "normal": "This traffic is benign - consistent with normal network behavior. No immediate action needed.",
    }

    # Find best matching response
    response = None
    for keyword, answer in threat_kb.items():
        if keyword in message:
            print(f"🟡 [/chat] Matched keyword: {keyword}")
            response = answer
            break

    if not response:
        print("🟡 [/chat] No keyword match, using default response")
        response = (
            "I can help explain: SHAP features, confidence scores, threat indicators "
            "(sbytes, dbytes, duration, service, state), false positives, or mitigation steps. "
            "What would you like to know?"
        )

    print(f"✅ [/chat] Sending response")
    return {"response": response}


# ============================================================================
# STARTUP
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    print("\n" + "="*70)
    print("🚀 Starting ThreatXAI Backend...")
    print("="*70)
    load_model()
    print("✅ Backend ready for requests")
    print("="*70 + "\n")


if __name__ == "__main__":
    import uvicorn

    print("🔧 FastAPI Backend - Threat Detection Engine")
    print("📡 Starting server on http://0.0.0.0:8001")
    print("📊 API Docs: http://localhost:8001/docs")
    print("🔗 ReDoc: http://localhost:8001/redoc")

    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
