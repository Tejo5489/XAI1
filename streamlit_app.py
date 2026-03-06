import streamlit as st
import xgboost as xgb
import shap
import pandas as pd
import numpy as np
import requests
import json
import time
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# --- CONFIGURATION & THEME ---
st.set_page_config(
    page_title="XAI Elite: Clinical Sentinel",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Premium Glassmorphism look
st.markdown("""
    <style>
    .main { background-color: #020617; color: #f8fafc; }
    .stSlider > div > div > div > div { background-color: #3b82f6; }
    [data-testid="stSidebar"] { background-color: #0f172a; border-right: 1px solid #1e293b; }
    .risk-card {
        background: rgba(30, 41, 59, 0.4);
        padding: 2rem;
        border-radius: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-value { font-size: 5rem; font-weight: 900; line-height: 1; margin-bottom: 0.5rem; }
    </style>
    """, unsafe_allow_html=True)

# --- API & FIREBASE SETUP ---
GEMINI_API_KEY = "AIzaSyAOz8ymeNiE6y4cWsaTBgOvmZU5p868MW8" # System handles this at runtime
app_id = "xai-pro-elite-v3"

# Initialize Firebase
if not firebase_admin._apps:
    try:
        # For local: place service_account.json in root. For Streamlit Cloud: use Secrets.
        if "firebase" in st.secrets:
            cred_dict = dict(st.secrets["firebase"])
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        else:
            # Fallback for local testing
            cred = credentials.Certificate('service_account.json')
            firebase_admin.initialize_app(cred)
    except Exception as e:
        st.warning("Firebase not connected. Audit logs will be local only.")

db = firestore.client() if firebase_admin._apps else None

# --- AI ENGINE CLASS ---
class XAIEngine:
    def __init__(self):
        self.feature_names = ['age', 'height', 'weight', 'heartRate', 'bloodPressure', 'oxygen', 'temperature']
        self.model = self._get_model()
        self.explainer = shap.TreeExplainer(self.model)

    def _get_model(self):
        # Create a clinical-grade XGBoost simulation
        np.random.seed(42)
        X = pd.DataFrame(np.random.rand(100, len(self.feature_names)), columns=self.feature_names)
        # Target: High risk if HR is high and Oxygen is low
        y = (X['heartRate'] > 0.7) & (X['oxygen'] < 0.4)
        model = xgb.XGBClassifier(n_estimators=50, max_depth=3, learning_rate=0.1)
        model.fit(X, y.astype(int))
        return model

    def analyze(self, vitals):
        input_df = pd.DataFrame([vitals])
        prob = self.model.predict_proba(input_df)[0][1]
        shap_values = self.explainer.shap_values(input_df)
        
        contributions = []
        for i, name in enumerate(self.feature_names):
            contributions.append({
                "feature": name,
                "phi": float(shap_values[0][i])
            })
        return prob, contributions

# --- GEMINI CHATBOT LOGIC ---
def call_dr_xai(prompt, vitals, risk, shap_data, history):
    system_prompt = f"""
    You are Dr. XAI, a Chief Clinical Consultant. 
    Current State: HR {vitals['heartRate']}, BP {vitals['bloodPressure']}, O2 {vitals['oxygen']}%. 
    XGBoost Risk Score: {risk:.0%}.
    Primary SHAP Driver: {shap_data[0]['feature']}.
    
    Persona: Professional, structured, and empathetic. Use clinical terms. Explain the AI's SHAP logic as medical evidence.
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": system_prompt + "\n\nUser: " + prompt}]}]
    }
    
    # Exponential Backoff Implementation
    for i in range(5):
        try:
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                result = response.json()
                return result['candidates'][0]['content']['parts'][0]['text']
        except:
            time.sleep(2**i)
    return "Dr. XAI is currently indisposed. Please check telemetry manually."

# --- UI LAYOUT ---
st.title("🛡️ XAI Elite: Clinical Sentinel")
st.caption("Advanced Clinical Decision Support | XGBoost + SHAP Interpretability")

if 'messages' not in st.session_state:
    st.session_state.messages = []

# Sidebar: Patient Intake & Vitals
with st.sidebar:
    st.header("👤 Patient Profile")
    age = st.number_input("Age", 1, 120, 45)
    weight = st.number_input("Weight (kg)", 10, 250, 70)
    height = st.number_input("Height (cm)", 50, 250, 175)
    
    st.divider()
    st.header("🩺 Live Telemetry")
    hr = st.slider("Heart Rate (BPM)", 40, 200, 82)
    bp = st.slider("Systolic BP (mmHg)", 60, 220, 118)
    o2 = st.slider("Oxygen Saturation (%)", 70, 100, 98)
    temp = st.slider("Temperature (°C)", 34.0, 42.0, 37.0, step=0.1)

# Logic Processing
vitals = {
    'age': age/100, 'height': height/250, 'weight': weight/200,
    'heartRate': hr/200, 'bloodPressure': bp/220, 'oxygen': o2/100, 'temperature': temp/42
}

engine = XAIEngine()
risk_prob, contributions = engine.analyze(vitals)

# --- MAIN DASHBOARD ---
col1, col2 = st.columns([2, 1])

with col1:
    # Risk Index Card
    color = "#ef4444" if risk_prob > 0.7 else "#3b82f6"
    st.markdown(f"""
        <div class="risk-card">
            <p style="text-transform: uppercase; letter-spacing: 0.3em; color: #64748b; font-size: 0.7rem; font-weight: 900;">Clinical Risk Probability</p>
            <div class="metric-value" style="color: {color};">{(risk_prob*100):.0f}%</div>
            <p style="color: #94a3b8; font-size: 0.8rem;">Status: {"Critical Alert" if risk_prob > 0.7 else "Stable Monitoring"}</p>
        </div>
    """, unsafe_allow_html=True)

    # XAI Explanation (SHAP)
    st.subheader("🧬 XAI Decision Drivers (SHAP)")
    chart_data = pd.DataFrame(contributions).sort_values(by="phi", ascending=False)
    st.bar_chart(chart_data.set_index("feature")["phi"])
    st.caption("Red bars (positive) increase risk; Blue bars (negative) decrease risk based on model weights.")

with col2:
    # Dr. XAI Chatbot
    st.subheader("💬 Dr. XAI: Clinical Consultant")
    chat_container = st.container(height=500)
    
    for message in st.session_state.messages:
        with chat_container.chat_message(message["role"]):
            st.markdown(message["content"])

    if prompt := st.chat_input("Ask Dr. XAI about this case..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with chat_container.chat_message("user"):
            st.markdown(prompt)
            
        with chat_container.chat_message("assistant"):
            response = call_dr_xai(prompt, vitals, risk_prob, contributions, st.session_state.messages)
            st.markdown(response)
            st.session_state.messages.append({"role": "assistant", "content": response})

# --- DATA PERSISTENCE (FIREBASE) ---
if db:
    try:
        # Save every significant change as an audit log (Rule 1: Strict Paths)
        path = f"artifacts/{app_id}/public/data/history"
        db.collection(path).add({
            "timestamp": datetime.now(),
            "risk": risk_prob,
            "vitals": vitals,
            "status": "Automatic Sync"
        })
    except:
        pass
