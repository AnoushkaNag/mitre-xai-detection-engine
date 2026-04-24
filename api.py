"""
API layer for XAI Threat Detection Engine
Connects the Next.js frontend to the main.py ML pipeline
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import shap

# Add parent directory to path to import main
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)

# Global model and explainer (loaded on startup)
model = None
explainer = None
scaler_data = None


def load_model_and_explainer():
    """Load the trained model and SHAP explainer"""
    global model, explainer, scaler_data

    try:
        # Load training data for SHAP explainer background
        df = pd.read_parquet("data/UNSW_NB15_training-set.parquet")

        # Feature engineering
        features = ["dur", "sbytes", "dbytes", "service", "state"]
        X = df[features].copy()
        y = df["label"]

        # Encode categorical features
        X = pd.get_dummies(X, columns=["service", "state"], drop_first=False)

        # Train model
        model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        model.fit(X, y)

        # Create SHAP explainer (use sample of data for background)
        sample_data = X.sample(n=min(100, len(X)), random_state=42)
        explainer = shap.TreeExplainer(model)
        scaler_data = X

        print("✓ Model and explainer loaded successfully")
        return True
    except Exception as e:
        print(f"✗ Error loading model: {e}")
        return False


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "model_loaded": model is not None})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    Analyze uploaded file and generate threat alerts
    Expects: CSV, JSON, or Parquet file
    Returns: Array of Alert objects
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]

        # Load file based on extension
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file)
        elif file.filename.endswith(".json"):
            df = pd.read_json(file)
        elif file.filename.endswith(".parquet"):
            df = pd.read_parquet(file)
        else:
            return jsonify({"error": "Unsupported file format"}), 400

        # Ensure required columns exist
        required_cols = ["dur", "sbytes", "dbytes", "service", "state"]
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            return jsonify({"error": f"Missing columns: {', '.join(missing)}"}), 400

        # Feature engineering
        X = df[required_cols].copy()
        X = pd.get_dummies(X, columns=["service", "state"], drop_first=False)

        # Align columns with training data
        missing_cols = set(scaler_data.columns) - set(X.columns)
        for col in missing_cols:
            X[col] = 0
        X = X[scaler_data.columns]

        # Predict
        predictions = model.predict(X)
        probabilities = model.predict_proba(X)[:, 1]  # Attack class probability

        # Get SHAP values for attack predictions (class 1)
        shap_values = explainer.shap_values(X)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]  # Get values for attack class

        # Generate alerts
        alerts = []
        for idx, (pred, prob, shap_val) in enumerate(zip(predictions, probabilities, shap_values)):
            if pred == 1:  # Only create alerts for predicted attacks
                # Get top SHAP features
                top_indices = np.argsort(np.abs(shap_val))[-5:][::-1]
                top_features = [
                    {
                        "name": scaler_data.columns[i],
                        "value": float(shap_val[i]),
                        "direction": "up" if shap_val[i] > 0 else "down",
                    }
                    for i in top_indices
                ]

                # Generate reasoning
                reasoning = [
                    f"Unusual {scaler_data.columns[top_indices[0]]} value detected",
                    f"Multiple anomalous features indicate potential attack",
                    f"SHAP model attribution confidence: {prob:.1%}",
                ]

                alert = {
                    "id": f"alert-{idx}",
                    "title": f"Suspicious Network Traffic Detected",
                    "riskLevel": "high" if prob > 0.8 else "medium",
                    "confidence": float(prob),
                    "duration": float(df.iloc[idx]["dur"]),
                    "sourceBytes": int(df.iloc[idx]["sbytes"]),
                    "destBytes": int(df.iloc[idx]["dbytes"]),
                    "service": str(df.iloc[idx]["service"]),
                    "state": str(df.iloc[idx]["state"]),
                    "topFeatures": top_features,
                    "reasoning": reasoning,
                    "timestamp": pd.Timestamp.now().isoformat(),
                }
                alerts.append(alert)

        return jsonify({"alerts": alerts, "total": len(alerts), "file": file.filename})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Chat interface for threat Q&A
    Expects: {message: str, alertId?: str}
    Returns: {response: str}
    """
    try:
        data = request.get_json()
        message = data.get("message", "")
        alert_id = data.get("alertId")

        if not message:
            return jsonify({"error": "No message provided"}), 400

        # Simple threat intelligence responses
        responses = {
            "shap": "SHAP (SHapley Additive exPlanations) explains how each feature contributes to the model's prediction. Positive SHAP values increase attack likelihood, negative decrease it.",
            "confidence": "Confidence represents the model's certainty that this is a real attack. Higher values (closer to 100%) indicate stronger indicators.",
            "false positive": "To reduce false positives, we use SHAP values to verify that anomalies are truly suspicious rather than normal behavior variations.",
            "attack": "This appears to be an attack based on unusual network behavior patterns learned from the UNSW-NB15 dataset.",
            "normal": "This traffic pattern matches normal network behavior in the training data.",
            "duration": "Connection duration is a key indicator - unusually short or long connections may indicate attack behavior.",
            "bytes": "Data transfer volumes (source and destination bytes) can reveal data exfiltration or command injection attempts.",
            "service": "Service type (like http, ssh, dns) helps classify the attack vector and appropriate response.",
        }

        # Find relevant response
        message_lower = message.lower()
        response = None

        for key, value in responses.items():
            if key in message_lower:
                response = value
                break

        if not response:
            response = "I can explain SHAP features, confidence scores, threat types, and network indicators. What would you like to know about this alert?"

        return jsonify({"response": response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Load model on startup
    if load_model_and_explainer():
        print("🚀 Starting API server on http://localhost:8000")
        app.run(debug=True, port=8000, host="0.0.0.0")
    else:
        print("✗ Failed to start server - model loading failed")
