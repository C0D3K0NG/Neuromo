import streamlit as st
import cv2
import time
import numpy as np
from ailogic import EyeTracker  # Importing your backend!

# --- 1. CONFIGURATION & CSS (The "Aesthetic" Vibe) ---
st.set_page_config(page_title="ZenFocus AI", page_icon="🧘", layout="wide")

# Background Image (Cyberpunk/Lo-fi Style)
background_image_url = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"

st.markdown(
    f"""
    <style>
    .stApp {{
        background-image: url("{background_image_url}");
        background-attachment: fixed;
        background-size: cover;
    }}
    /* Hide top header */
    header {{visibility: hidden;}}
    
    /* Center the big timer */
    .big-font {{
        font-size: 140px !important;
        font-weight: 700;
        color: #FFFFFF;
        text-align: center;
        text-shadow: 4px 4px 10px #000000;
        font-family: 'Courier New', monospace;
        margin-bottom: -20px;
    }}
    
    /* Status Badge */
    .status-badge {{
        font-size: 24px;
        font-weight: bold;
        color: #00FF00;
        text-align: center;
        background-color: rgba(0,0,0,0.6);
        padding: 10px;
        border-radius: 10px;
        border: 1px solid #00FF00;
    }}
    
    /* Warning Badge */
    .status-warning {{
        color: #FF0000 !important;
        border: 1px solid #FF0000 !important;
        animation: blinker 1s linear infinite;
    }}
    
    @keyframes blinker {{
        50% {{ opacity: 0; }}
    }}
    </style>
    """,
    unsafe_allow_html=True
)

# --- 2. SESSION STATE SETUP ---
if 'time_left' not in st.session_state:
    st.session_state.time_left = 25 * 60  # 25 minutes
if 'timer_running' not in st.session_state:
    st.session_state.timer_running = False
if 'tracker' not in st.session_state:
    st.session_state.tracker = EyeTracker() # Initialize your AI once

# --- 3. SIDEBAR (Controls & AI Debug) ---
with st.sidebar:
    st.title("⚙️ Neuro-Control")
    st.markdown("---")
    
    # Camera Placeholder (We show the camera HERE, not in main view)
    st.write("### 👁️ AI Vision Feed")
    camera_placeholder = st.empty()
    
    st.markdown("---")
    st.write("### 🎵 Sonic Environment")
    # Embedding a Lo-fi Player
    st.markdown('<iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4FyS8kM?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>', unsafe_allow_html=True)

# --- 4. MAIN UI (The Timer & Focus Stats) ---
col1, col2, col3 = st.columns([1, 2, 1])

with col2:
    st.markdown("<br><br>", unsafe_allow_html=True)
    
    # Status Indicator
    status_text_placeholder = st.empty()
    
    # The Giant Timer
    timer_text_placeholder = st.empty()
    
    # Control Buttons
    c1, c2, c3 = st.columns([1, 1, 1])
    with c2:
        if st.button("⏯️ START / PAUSE", use_container_width=True):
            st.session_state.timer_running = not st.session_state.timer_running

# --- 5. THE MAIN LOOP (The Heart of the App) ---
# This loop handles Camera + AI + Timer all at once
cap = None

while True:
    # A. Render the Timer (Static or Running)
    mins, secs = divmod(st.session_state.time_left, 60)
    timer_html = f'<p class="big-font">{mins:02d}:{secs:02d}</p>'
    timer_text_placeholder.markdown(timer_html, unsafe_allow_html=True)
    
    # B. If Timer is OFF, release camera and show ready status
    if not st.session_state.timer_running:
        # Release camera when not in use
        if cap is not None:
            cap.release()
            cap = None
        
        status_text_placeholder.markdown('<div class="status-badge" style="color:white; border:1px solid white;">⏸️ READY</div>', unsafe_allow_html=True)
        camera_placeholder.markdown('<div style="text-align:center; padding:20px; background-color:rgba(0,0,0,0.6); border-radius:10px;"><p style="color:#888;">📹 Camera Off</p><p style="color:#666; font-size:14px;">Start the timer to activate AI monitoring</p></div>', unsafe_allow_html=True)
        time.sleep(0.1)
        continue
    
    # C. Initialize camera when timer starts
    if cap is None:
        cap = cv2.VideoCapture(0)

    # C. If Timer is ON -> RUN AI + COUNTDOWN
    ret, frame = cap.read()
    if not ret:
        st.error("Camera not found!")
        break

    # 1. Run Your AI Logic
    # We call the process_frame method from YOUR code
    processed_frame, status = st.session_state.tracker.process_frame(frame)
    
    # 2. Update Status on UI
    if "SLEEPING" in status:
        status_html = f'<div class="status-badge status-warning">⚠️ {status}</div>'
        # Optional: Play sound here using st.audio if you want!
    elif "Drowsy" in status:
        status_html = f'<div class="status-badge" style="color:yellow; border:1px solid yellow;">😐 {status}</div>'
    else:
        status_html = f'<div class="status-badge">🟢 {status}</div>'
    
    status_text_placeholder.markdown(status_html, unsafe_allow_html=True)

    # 3. Update Camera Feed in Sidebar
    # Convert BGR (OpenCV) to RGB (Streamlit)
    show_frame = cv2.cvtColor(processed_frame, cv2.COLOR_BGR2RGB)
    camera_placeholder.image(show_frame, channels="RGB")

    # 4. Update Timer Logic
    # We decrement slightly. Since loop speed varies, for a real hackathon, 
    # check system clock. But for simple demo, this is fine:
    st.session_state.time_left -= 1
    if st.session_state.time_left <= 0:
        st.balloons()
        st.session_state.timer_running = False
        st.session_state.time_left = 25 * 60
    
    # Small sleep to match roughly 1 second? 
    # NO! AI takes time. We sleep less. 
    # Hack: Streamlit re-runs naturally, but for a "while True" loop inside Streamlit,
    # we just control loop speed manually.
    time.sleep(0.01) 
    
    # IMPORTANT: We must manually "rerun" purely for interaction updates if needed,
    # but inside a 'while True', we are technically bypassing standard Streamlit flow.
    # This works for "Real-time" apps.
