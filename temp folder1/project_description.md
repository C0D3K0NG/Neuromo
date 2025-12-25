# Neuromo - AI-Powered Focus & Drowsiness Monitoring System

## 1. Project Overview
Neuromo is an intelligent desktop application designed to enhance productivity and safety by combining computer vision AI with the Pomodoro Technique. It uses real-time facial landmark detection to monitor user attention and drowsiness, providing feedback and maintaining focus during work sessions.

**Core Value Proposition:**
- **Boost Productivity:** Integrates focus monitoring with structured work/break cycles.
- **Prevent Drowsiness:** Detects signs of fatigue (e.g., eye closure) and alerts the user.
- **Privacy-Centric:** All processing happens locally; the camera is automatically disabled during break periods.

## 2. Key Features & Functionalities

### 🧠 AI Monitoring System
- **Face Detection:** Utilizes Google's MediaPipe framework to detect 468 facial landmarks in real-time.
- **Drowsiness Detection:** Calculates the Eye Aspect Ratio (EAR) to identify prolonged eye closure or frequent blinking indicative of sleepiness.
- **Focus Tracking:** Analyzes head pose orientation to determine if the user is looking away from the screen (distracted).

### ⏱️ Smart Pomodoro Timer
- **Auto-Loop Cycles:** Implements the standard 25-minute Focus and 5-minute Break structure.
- **Automated Privacy:** Intelligently disables the camera feed and AI processing during break intervals.
- **Session Tracking:** Records the duration and type of each session.

### 📋 Task Management System
- **CRUD Operations:** Create, Read, Update, and Delete tasks.
- **Prioritization:** Assign priority levels to tasks.
- **Progress Tracking:** Mark tasks as completed and track time spent per task (accumulated seconds).
- **Persistent Storage:** Tasks are saved in a local SQLite database.

### 🎵 Immersive Experience
- **Focus Music:** Integrated Lofi music player to aid concentration.
- **Dynamic Interface:** Tab countdowns and desktop notifications for session changes.
- **Analytics Dashboard:** Visualizes productivity stats (distraction events, sleep events, session history).

## 3. Technology Stack
- **Language:** Python 3.8+
- **Web Framework:** Flask (2.0+)
- **Computer Vision:** OpenCV, MediaPipe
- **Database:** SQLite
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Deployment:** Docker support involved.

## 4. Database Schema (`neuromo.db`)

The application uses a SQLite database with three main tables:

### `sessions`
Records completed Pomodoro work/break sessions.
- `id`: Primary Key
- `user_token`: Identifier for the user
- `type`: Session type (e.g., 'focus', 'break')
- `duration`: Length of session in seconds
- `timestamp`: Date and time of session

### `events`
Logs specific monitoring events triggered by the AI.
- `id`: Primary Key
- `user_token`: Identifier for the user
- `type`: Event type ('distracted', 'sleep')
- `timestamp`: Time of occurrence

### `tasks`
Manages user to-do items.
- `id`: Primary Key
- `user_token`: Identifier for the user
- `title`: Description of the task
- `priority`: Integer level (default 1)
- `is_completed`: Boolean status
- `total_seconds`: Time accumulated working on this task
- `created_at`: Creation timestamp

## 5. API Endpoints

The Flask backend provides RESTful API endpoints for the frontend interface:

### Analytics & Sessions
- `GET /api/stats`: Retrieve aggregated distraction/sleep stats (database + current session).
- `GET /api/session/history`: Retrieve the last 50 sessions for charting.
- `POST /api/session/complete`: Save a completed session and flush buffered events to the DB.

### Task Management
- `GET /api/tasks`: Fetch all tasks for a user (ordered by priority/creation).
- `POST /api/tasks`: Create a new task.
- `PUT /api/tasks/<id>`: Update task status, priority, or add time (`add_seconds`).
- `DELETE /api/tasks/<id>`: Delete a specified task.

### System
- `GET /video_feed`: MJPEG stream of the processed camera feed with AI overlays.
- `GET /status`: Check current camera status (active/disabled).

