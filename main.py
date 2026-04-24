import pandas as pd
import numpy as np
import shap
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load the UNSW-NB15 training dataset
df = pd.read_parquet("data/UNSW_NB15_training-set.parquet")

# Select only behavioral features (NO attack_cat to avoid data leakage)
behavioral_features = ["dur", "sbytes", "dbytes", "service", "state"]
df = df[behavioral_features + ["label"]]

# Convert categorical features into numerical format using one-hot encoding
df = pd.get_dummies(df, columns=["service", "state"], drop_first=False)

# Separate features (X) and target (y)
X = df.drop(columns=["label"])
y = df["label"]

# Keep track of feature names before splitting
feature_names = X.columns.tolist()

# Split the data into training and testing sets (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a RandomForestClassifier on the training data
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# Make predictions on the test data
y_pred = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)

# Calculate and print the accuracy of the model
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy:.4f}\n")

# Explainability Layer: Use SHAP to explain predictions
print("=" * 70)
print("EXPLAINABLE AI THREAT DETECTION ENGINE")
print("=" * 70 + "\n")

# Create SHAP explainer using a sample of test data for efficiency
X_explain = X_test.iloc[:500].reset_index(drop=True)
y_explain = y_test.iloc[:500].reset_index(drop=True)
y_explain_proba = y_pred_proba[:500]

explainer = shap.TreeExplainer(model)
raw_shap_values = explainer.shap_values(X_explain)

# Handle SHAP output format differences across versions
if isinstance(raw_shap_values, list):
    attack_shap_values = raw_shap_values[1]
else:
    # Newer SHAP often returns shape: (samples, features, classes)
    if raw_shap_values.ndim == 3:
        attack_shap_values = raw_shap_values[:, :, 1]
    else:
        attack_shap_values = raw_shap_values

# Find a malicious sample (label=1) and a normal sample (label=0) for demonstration
malicious_indices = np.where(y_explain.values == 1)[0]
normal_indices = np.where(y_explain.values == 0)[0]

# Process malicious samples
if len(malicious_indices) > 0:
    mal_idx = malicious_indices[0]
    mal_sample = X_explain.iloc[mal_idx]
    mal_pred_proba = y_explain_proba[mal_idx]
    
    # Get SHAP values for the malicious sample
    if mal_idx < len(attack_shap_values):
        mal_shap = attack_shap_values[mal_idx]  # Class 1 (attack) SHAP values
        
        # Find top 3 contributing features
        top_features_idx = np.argsort(np.abs(mal_shap))[-3:][::-1]
        top_features = [(feature_names[i], mal_shap[i]) for i in top_features_idx]
        
        print("ALERT: Suspicious Network Activity Detected")
        print(f"Confidence: {mal_pred_proba[1]:.2%}\n")
        
        print("Observed Behavior:")
        print(f"  - Connection Duration: {mal_sample['dur']:.6f}s")
        print(f"  - Source Bytes: {mal_sample['sbytes']:.0f}")
        print(f"  - Destination Bytes: {mal_sample['dbytes']:.0f}\n")
        
        print("Model Explanation (SHAP Feature Importance):")
        for feature, shap_val in top_features:
            direction = "↑ contributed positively" if shap_val > 0 else "↓ contributed negatively"
            print(f"  + {feature}: {shap_val:.4f} {direction}")
        
        print("\nSOC Analyst Reasoning:")
        if mal_shap[feature_names.index('sbytes')] > 0.1:
            print("  - Unusually high outbound data transfer detected")
        if mal_shap[feature_names.index('dur')] > 0.1:
            print("  - Connection duration significantly anomalous")
        if any('service' in f for f, _ in top_features):
            print("  - Rare or suspicious service usage pattern")
        
        print("\nRISK LEVEL: HIGH - Recommend immediate investigation\n")

# Process normal samples for comparison
if len(normal_indices) > 0:
    norm_idx = normal_indices[0]
    norm_sample = X_explain.iloc[norm_idx]
    norm_pred_proba = y_explain_proba[norm_idx]
    
    if norm_idx < len(attack_shap_values):
        norm_shap = attack_shap_values[norm_idx]  # Class 1 (attack) SHAP values
        
        print("-" * 70)
        print("EXAMPLE: Benign Network Activity (for comparison)")
        print(f"Confidence of Attack: {norm_pred_proba[1]:.2%}\n")
        
        print("Observed Behavior:")
        print(f"  - Connection Duration: {norm_sample['dur']:.6f}s")
        print(f"  - Source Bytes: {norm_sample['sbytes']:.0f}")
        print(f"  - Destination Bytes: {norm_sample['dbytes']:.0f}\n")
        
        # Find top 3 features for normal sample
        top_features_norm_idx = np.argsort(np.abs(norm_shap))[-3:][::-1]
        top_features_norm = [(feature_names[i], norm_shap[i]) for i in top_features_norm_idx]
        
        print("Model Explanation (SHAP Feature Importance):")
        for feature, shap_val in top_features_norm:
            direction = "↑ contributed positively" if shap_val > 0 else "↓ contributed negatively"
            print(f"  + {feature}: {shap_val:.4f} {direction}")
        
        print("\nRISK LEVEL: LOW - Normal network behavior\n")

print("=" * 70)
