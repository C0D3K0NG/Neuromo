# Neuromo

An AI-powered focus & drowsiness monitoring system that uses computer vision and facial landmark detection to monitor user attention and detect signs of drowsiness in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg) ![Flask](https://img.shields.io/badge/flask-2.0%2B-green.svg)

## Features

### Core AI Monitoring
*   **Real-time Face Detection**: Utilizes MediaPipe's Face Landmarker for accurate facial landmark detection.
*   **Drowsiness Detection**: Monitors eye aspect ratio (EAR) to detect drowsiness.
*   **Focus Tracking**: Analyzes head pose and gaze direction to track user focus.
*   **Live Video Feed**: Real-time video streaming with visual feedback.

### Smart Pomodoro Timer
*   **Auto-Loop System**: Automatically cycles between Focus (25m) and Break (5m) sessions.
*   **Privacy-First Camera**: The AI camera **strictly turns OFF** during break times and automatically reactivates for focus sessions.
*   **Status Dashboard**: Visual "Focus Time" vs "Break Time" status indicator.
*   **Time Control**: Quick `+5` / `-5` minute adjustment buttons for flexible session management.
*   **Audio Cues**: Distinct interval beeps for session transitions and alarms for completion.

### Immersive Experience
*   **Lofi Music Player**: Integrated, distraction-free YouTube music player.
*   **Dynamic Tab Title**: Real-time timer countdown in the browser tab (e.g., `24:59 - Focus`).
*   **Native Notifications**: Desktop alerts when a session ends, even if the tab is in the background.
*   **Safety Features**: Prevents accidental tab closure while the timer is running.

## Getting Started

### Prerequisites

*   Python 3.8 or higher
*   Webcam or camera device

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/C0D3K0NG/Neuromo.git
    cd Neuromo
    ```

2.  **Install dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the application**
    ```bash
    python app.py
    ```

4.  **Access the application**
    *   Open your browser and navigate to `http://127.0.0.1:8969`

## Project Structure

```
Neuromo/
├── app.py                    # Main Flask application
├── camera.py                 # Camera and face detection logic
├── face_landmarker.task      # MediaPipe face landmark model
├── requirements.txt          # Python dependencies
├── Aptfile                   # System dependencies
├── static/                   # Static assets (CSS, JS, images)
│   ├── background/           # Background images
│   └── alarm/                # Alarm sounds
└── pages/                    # HTML templates (dashboard, etc.)
```

## Technology Stack

*   **Python**: Core programming language
*   **Flask**: Lightweight web application framework
*   **MediaPipe**: Face landmark detection
*   **OpenCV**: Computer vision and image processing
*   **NumPy**: Numerical computations
*   **Gunicorn**: Production WSGI server

## Usage

1.  Launch the application using `python app.py`
2.  Navigate to `http://127.0.0.1:8969` in your web browser
3.  Allow camera access when prompted by your browser
4.  **Start Focus**: Click "START" to begin the Pomodoro loop. The camera will activate.
5.  **Take a Break**: When the 25m timer ends, a break session starts automatically, and the camera turns off.
6.  **Adjust**: Use the `+` / `-` buttons to adjust time if needed (while paused).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

**C0D3K0NG**

## Acknowledgments

*   MediaPipe team for the excellent face landmark detection model
*   Flask community for the lightweight and flexible web framework

---

**Note**: This project is designed for educational and research purposes. For production use in safety-critical applications, additional testing and validation would be required.
