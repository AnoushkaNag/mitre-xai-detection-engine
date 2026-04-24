# 🚨 ThreatXAI - Explainable AI-Powered Threat Detection Engine

An advanced network threat detection system powered by machine learning and explainable AI (SHAP), featuring a premium SOC dashboard built with Next.js.

## 📊 Architecture

```
mitre-xai-detection-engine/
├── main.py                    # Core ML pipeline (data loading, training, SHAP explanations)
├── api.py                     # Flask API layer (connects frontend to backend)
├── data/
│   └── UNSW_NB15_training-set.parquet  # 175K network flow samples
├── frontend/                  # Next.js premium dashboard
│   ├── app/
│   │   ├── page.tsx          # Main dashboard
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Tailwind styles
│   ├── components/           # React components
│   │   ├── Sidebar.tsx       # Navigation
│   │   ├── TopBar.tsx        # Header
│   │   ├── AlertsList.tsx    # Alert list container
│   │   ├── AlertCard.tsx     # Individual alert card
│   │   ├── AlertPanel.tsx    # Alert details (slide-in)
│   │   ├── ChatBox.tsx       # Threat Q&A interface
│   │   └── UploadBox.tsx     # File upload (drag-drop)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
└── venv/                      # Python virtual environment
```

## 🔧 Backend Setup

### Prerequisites
- Python 3.10+
- Virtual environment (recommended)

### Installation

```bash
# Navigate to project root
cd c:\Users\KIIT0001\Desktop\mitre-xai-detection-engine

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install pandas numpy scikit-learn shap flask flask-cors
```

### Running the Backend

```bash
# Start Flask API server (runs on http://localhost:8000)
python api.py
```

The API server will:
- Load the pre-trained RandomForestClassifier (94.46% accuracy on UNSW-NB15)
- Initialize SHAP TreeExplainer for model explainability
- Start serving on `http://localhost:8000`

**API Endpoints:**
- `GET /health` - Health check
- `POST /api/analyze` - Upload file (CSV/JSON/Parquet) and get threat alerts
- `POST /api/chat` - Threat intelligence Q&A

## 🎨 Frontend Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Running the Frontend

```bash
# Start development server (runs on http://localhost:3000)
npm run dev
```

The Next.js frontend will:
- Serve the SOC dashboard on `http://localhost:3000`
- Auto-reload on file changes (hot refresh)
- Connect to backend API on `http://localhost:8000`

### Production Build

```bash
npm run build
npm start
```

## 📋 Features

### ML Pipeline (main.py)
- **Data Loading**: UNSW-NB15 parquet dataset (175K network flows)
- **Feature Engineering**: Duration, source bytes, destination bytes, service type, connection state
- **Model Training**: RandomForestClassifier with 94.46% accuracy
- **Explainability**: SHAP TreeExplainer for feature importance attribution
- **Alert Generation**: SOC-style alerts with human-readable explanations

### API Layer (api.py)
- **File Upload**: Process CSV, JSON, or Parquet files
- **Threat Analysis**: Generate alerts with SHAP-based explanations
- **Chat Interface**: Threat intelligence Q&A
- **CORS Enabled**: Frontend can communicate across domains

### Dashboard (frontend/)
- **Dark Theme**: Professional SOC interface
- **Alerts List**: Sortable threat alerts with risk levels
- **Alert Details**: Slide-in panel with observed behavior, SHAP features, analyst reasoning
- **Chat Interface**: Ask questions about detected threats
- **File Upload**: Drag-and-drop interface for CSV/JSON/Parquet
- **Animations**: Smooth transitions with Framer Motion
- **Responsive**: Works on desktop and tablet

## 🚀 Quick Start (Full Stack)

**Terminal 1 - Backend API:**
```bash
cd c:\Users\KIIT0001\Desktop\mitre-xai-detection-engine
.\venv\Scripts\activate
python api.py
```

**Terminal 2 - Frontend:**
```bash
cd c:\Users\KIIT0001\Desktop\mitre-xai-detection-engine\frontend
npm run dev
```

**Open Browser:**
```
http://localhost:3000
```

## 📊 Model Performance

- **Dataset**: UNSW-NB15 (175,341 network flows)
- **Accuracy**: 94.46%
- **Features**: 23 (after one-hot encoding)
- **Model**: RandomForestClassifier (100 estimators)
- **Explainability**: SHAP TreeExplainer

## 🎯 Workflow

1. **Upload Data**: Use drag-drop or file picker to upload CSV/JSON/Parquet
2. **Analysis**: Backend processes file through ML pipeline
3. **Alert Generation**: Suspicious traffic flagged with SHAP explanations
4. **Review Alerts**: View alerts in dashboard with risk levels and confidence
5. **Inspect Details**: Click alert to view full details (observed behavior, SHAP features)
6. **Ask Questions**: Use chat interface to understand why traffic was flagged

## 🔐 Security Considerations

- **CORS**: Restricted to localhost in development (configure for production)
- **Input Validation**: File uploads validated by extension and content
- **Model Accuracy**: 94.46% accuracy reduces false positives
- **SHAP Explanations**: Transparent model decisions for analyst review

## 🛠️ Troubleshooting

### Frontend won't connect to backend
- Ensure Flask API is running on `http://localhost:8000`
- Check CORS configuration in `api.py`
- Verify firewall allows localhost connections

### Model loading errors
- Confirm `data/UNSW_NB15_training-set.parquet` exists
- Check Python environment has all dependencies installed
- Verify pandas can read parquet files

### Upload fails
- Only CSV, JSON, and Parquet files supported
- Ensure required columns: `dur`, `sbytes`, `dbytes`, `service`, `state`
- Check file size (large files may timeout)

## 📚 Technology Stack

**Backend:**
- Python 3.10
- pandas, numpy, scikit-learn
- SHAP (explainability)
- Flask (REST API)

**Frontend:**
- Next.js 14, React 19
- TypeScript 5
- Tailwind CSS 3.4
- Framer Motion (animations)
- Lucide React (icons)

## 📝 License

Project for educational purposes.

## 🔗 Related Resources

- [UNSW-NB15 Dataset](https://www.unsw.adfa.edu.au/unsw-canberra-cyber/cybersecurity-datasets/unsw-nb15-dataset)
- [SHAP Documentation](https://shap.readthedocs.io/)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)
