import os
from flask import Flask, render_template, Response, request, redirect, url_for

# 1. SETUP FLASK TO WORK WITH YOUR FOLDER STRUCTURE
# We explicitly tell Flask: "My HTML is in 'pages', not 'templates'"
app = Flask(__name__, template_folder='pages', static_folder='static')

# Import the camera logic (Must be in the same folder as app.py)
try:
    from camera import VideoCamera
    CAMERA_AVAILABLE = True
    print("✅ Camera module loaded successfully.")
except ImportError as e:
    print(f"⚠️ Camera module missing or failed: {e}")
    CAMERA_AVAILABLE = False

# --- HELPER: Get background/alarm files ---
def get_files(folder_name):
    path = os.path.join(app.static_folder, folder_name)
    if not os.path.exists(path):
        print(f"⚠️ Warning: Folder 'static/{folder_name}' not found.")
        return []
    # Get all files that are not hidden
    files = [f for f in os.listdir(path) if not f.startswith('.')]
    print(f"📂 Loaded {len(files)} files from {folder_name}")
    return files

# --- ROUTES ---

@app.route('/')
def home():
    # DIRECTLY go to dashboard for testing (Skipping Login)
    print("🔄 Redirecting to Dashboard...")
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    print("🚀 Accessing Dashboard Route...")
    
    # Load settings from your folders
    backgrounds = get_files('background')
    alarms = get_files('alarm')
    
    # Debug print to check if HTML exists
    if not os.path.exists('pages/dashboard.html'):
        return "❌ ERROR: 'pages/dashboard.html' not found! Check your folder name."
        
    return render_template('dashboard.html', backgrounds=backgrounds, alarms=alarms)

# --- VIDEO FEED LOGIC ---
def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

@app.route('/video_feed')
def video_feed():
    if not CAMERA_AVAILABLE:
        return "Camera Error"
    return Response(gen(VideoCamera()),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    # Run on all IPs (0.0.0.0) so you can access it, debug mode ON for errors
    print("🟢 Starting Server on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)