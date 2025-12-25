import os
import webbrowser
import threading
from flask import Flask, render_template, Response, request, redirect, url_for, jsonify


app = Flask(__name__, template_folder='pages', static_folder='static')


try:
    from camera import VideoCamera
    CAMERA_AVAILABLE = True
    print("✅ Camera module loaded successfully.")
except ImportError as e:
    print(f"⚠️ Camera module missing or failed: {e}")
    CAMERA_AVAILABLE = False

import sqlite3
import datetime

# --- DATABASE SETUP ---
DB_NAME = 'neuromo.db'

def init_db():
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        
        # 1. Sessions Table (Linked to User Token)
        c.execute('''CREATE TABLE IF NOT EXISTS sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_token TEXT NOT NULL,
                        type TEXT NOT NULL,
                        duration INTEGER,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )''')
        
        # 2. Events Table (Distractions/Sleep linked to User Token)
        c.execute('''CREATE TABLE IF NOT EXISTS events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_token TEXT NOT NULL,
                        type TEXT NOT NULL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )''')

        # 3. Tasks Table (Advanced Task System)
        c.execute('''CREATE TABLE IF NOT EXISTS tasks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_token TEXT NOT NULL,
                        title TEXT NOT NULL,
                        priority INTEGER DEFAULT 1,
                        is_completed BOOLEAN DEFAULT 0,
                        total_seconds INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )''')
        
        conn.commit()
        conn.close()
        print("✅ Database initialized successfully.")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")

# Initialize DB on startup
init_db()

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

# Create the camera object ONCE so we can read its status
if CAMERA_AVAILABLE:
    try:
        global_camera = VideoCamera()
    except Exception as e:
        print(f"❌ Camera init failed: {e}")
        CAMERA_AVAILABLE = False

if not CAMERA_AVAILABLE:
    # Fallback Mock Camera to prevent crashes
    class MockCamera:
        def __init__(self):
            self.stats = {'distracted': 0, 'sleep': 0}
            self.current_status = "camera_disabled"
        def get_frame(self):
            return None # Will return blank/None to gen()
    global_camera = MockCamera()
    print("⚠️ Using Mock Camera (Feature Disabled)")

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

@app.route('/analytics')
def analytics():
    print("📊 Accessing Analytics Route...")
    if not os.path.exists('pages/analytics.html'):
        return "❌ ERROR: 'pages/analytics.html' not found!"
    return render_template('analytics.html')

# --- API ENDPOINTS (For Analytics) ---

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Returns aggregated stats from DB + Current Camera Session"""
    user_token = request.headers.get('X-User-Token')
    if not user_token:
        # If no token, return just current session stats
        return jsonify(global_camera.stats)

    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        
        # Get lifetime counts from DB for this user
        c.execute("SELECT type, COUNT(*) FROM events WHERE user_token=? GROUP BY type", (user_token,))
        db_stats = dict(c.fetchall())
        conn.close()
        
        # Combine with current in-memory stats (not yet saved to DB)
        current_distracted = global_camera.stats['distracted']
        current_sleep = global_camera.stats['sleep']
        
        total_distracted = db_stats.get('distracted', 0) + current_distracted
        total_sleep = db_stats.get('sleep', 0) + current_sleep
        
        return jsonify({
            'distracted': total_distracted,
            'sleep': total_sleep,
            'current_session': global_camera.stats
        })
    except Exception as e:
        print(f"❌ Error fetching stats: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session/history', methods=['GET'])
def get_session_history():
    """Returns past sessions for charts"""
    user_token = request.headers.get('X-User-Token')
    if not user_token:
        return jsonify([])

    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        
        # Get last 50 sessions ordered by time
        c.execute("SELECT type, duration, timestamp FROM sessions WHERE user_token=? ORDER BY timestamp DESC LIMIT 50", (user_token,))
        sessions = [{'type': row[0], 'duration': row[1], 'timestamp': row[2]} for row in c.fetchall()]
        
        conn.close()
        return jsonify(sessions)
    except Exception as e:
        print(f"❌ Error fetching history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session/complete', methods=['POST'])
def complete_session():
    """Saves a completed session AND any accumulated events to DB"""
    user_token = request.headers.get('X-User-Token')
    if not user_token:
        return jsonify({'error': 'Token missing'}), 400
        
    data = request.json
    session_type = data.get('type')
    duration = data.get('duration') # in seconds
    
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        
        # 1. Save Session
        c.execute("INSERT INTO sessions (user_token, type, duration) VALUES (?, ?, ?)", 
                  (user_token, session_type, duration))
        
        # 2. Save Pending Events from Camera (Flush buffer)
        # We save 'current' events to DB now so they persist
        # Note: In a real app, you might want more precise timestamping for each event
        for _ in range(global_camera.stats['distracted']):
            c.execute("INSERT INTO events (user_token, type) VALUES (?, 'distracted')", (user_token,))
        
        for _ in range(global_camera.stats['sleep']):
            c.execute("INSERT INTO events (user_token, type) VALUES (?, 'sleep')", (user_token,))
            
        conn.commit()
        conn.close()
        
        # RESET Camera Stats after saving (Start fresh for next session)
        global_camera.stats['distracted'] = 0
        global_camera.stats['sleep'] = 0
        
        print(f"💾 Session & Events saved for user {user_token[:8]}...")
        return jsonify({'status': 'success'})
        
    except Exception as e:
        print(f"❌ Error saving session: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats/sync', methods=['POST'])
def sync_stats():
    """Flushes current in-memory stats to DB without ending the session"""
    user_token = request.headers.get('X-User-Token')
    if not user_token:
        return jsonify({'error': 'Token missing'}), 400

    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        
        # Save accumulated stats to DB
        distracted_count = global_camera.stats['distracted']
        sleep_count = global_camera.stats['sleep']
        
        if distracted_count > 0:
            print(f"🔄 Syncing {distracted_count} distractions...")
            for _ in range(distracted_count):
                c.execute("INSERT INTO events (user_token, type) VALUES (?, 'distracted')", (user_token,))
            # Reset counter after successful sync
            global_camera.stats['distracted'] = 0
            
        if sleep_count > 0:
            print(f"🔄 Syncing {sleep_count} sleep events...")
            for _ in range(sleep_count):
                c.execute("INSERT INTO events (user_token, type) VALUES (?, 'sleep')", (user_token,))
            # Reset counter after successful sync
            global_camera.stats['sleep'] = 0
            
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'synced'})
    except Exception as e:
        print(f"❌ Error syncing stats: {e}")
        return jsonify({'error': str(e)}), 500

# --- API ENDPOINTS (For Task System) ---

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Fetch all tasks for a user, ordered by Priority DESC, then Created DESC"""
    user_token = request.headers.get('X-User-Token')
    if not user_token: return jsonify([])

    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT id, title, priority, is_completed, total_seconds FROM tasks WHERE user_token=? ORDER BY is_completed ASC, priority DESC, created_at DESC", (user_token,))
        tasks = [{'id': r[0], 'title': r[1], 'priority': r[2], 'is_completed': bool(r[3]), 'total_seconds': r[4]} for r in c.fetchall()]
        conn.close()
        return jsonify(tasks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    user_token = request.headers.get('X-User-Token')
    data = request.json
    if not user_token or not data.get('title'): return jsonify({'error': 'Missing data'}), 400

    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("INSERT INTO tasks (user_token, title, priority) VALUES (?, ?, ?)", 
                  (user_token, data['title'], data.get('priority', 1)))
        conn.commit()
        task_id = c.lastrowid
        conn.close()
        return jsonify({'id': task_id, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update task status, priority, or add time"""
    user_token = request.headers.get('X-User-Token')
    data = request.json
    if not user_token: return jsonify({'error': 'Token missing'}), 400

    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        
        # Verify ownership
        c.execute("SELECT user_token FROM tasks WHERE id=?", (task_id,))
        row = c.fetchone()
        if not row or row[0] != user_token:
            conn.close()
            return jsonify({'error': 'Unauthorized'}), 403

        if 'is_completed' in data:
            c.execute("UPDATE tasks SET is_completed=? WHERE id=?", (data['is_completed'], task_id))
        
        if 'priority' in data:
            c.execute("UPDATE tasks SET priority=? WHERE id=?", (data['priority'], task_id))

        if 'add_seconds' in data:
            c.execute("UPDATE tasks SET total_seconds = total_seconds + ? WHERE id=?", (data['add_seconds'], task_id))
            
        conn.commit()
        conn.close()
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    user_token = request.headers.get('X-User-Token')
    if not user_token: return jsonify({'error': 'Token missing'}), 400

    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("DELETE FROM tasks WHERE id=? AND user_token=?", (task_id, user_token))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- VIDEO FEED LOGIC ---
def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

@app.route('/video_feed')
def video_feed():
    # Use the global camera instead of creating a new one every time
    return Response(gen(global_camera),
                    mimetype='multipart/x-mixed-replace; boundary=frame')
    

@app.route('/status')
def get_status():
    # This lets JS ask "What is the status?"
    return jsonify({'status': global_camera.current_status})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8969))
    
    # Auto-open browser (Desktop App Mode)
    def open_browser():
        webbrowser.open_new(f"http://127.0.0.1:{port}")
    
    # Only open browser if not in debug mode reloader
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        threading.Timer(1.5, open_browser).start()

    print(f"🟢 Starting Server on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port)