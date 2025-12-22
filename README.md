# Neuromo

An AI-powered focus & drowsiness monitoring system that uses computer vision and facial landmark detection to monitor user attention and detect signs of drowsiness in real-time.

## 🌟 Features

- **Real-time Face Detection**: Utilizes MediaPipe's Face Landmarker for accurate facial landmark detection
- **Drowsiness Detection**: Monitors eye aspect ratio (EAR) to detect drowsiness
- **Focus Tracking**: Analyzes head pose and gaze direction to track user focus
- **Live Video Feed**: Real-time video streaming with visual feedback
- **Web-based Interface**: Simple and intuitive web interface built with Flask

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- Webcam or camera device

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/C0D3K0NG/Neuromo.git
   cd Neuromo
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Access the application**
   - Open your browser and navigate to `http://127.0.0.1:8969`

## 📁 Project Structure

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

## 🛠️ Technology Stack

- **Python**: Core programming language
- **Flask**: Lightweight web application framework
- **MediaPipe**: Face landmark detection
- **OpenCV**: Computer vision and image processing
- **NumPy**: Numerical computations
- **Gunicorn**: Production WSGI server

## 📖 Usage

1. Launch the application using `python app.py`
2. Navigate to `http://127.0.0.1:8969` in your web browser
3. Allow camera access when prompted by your browser
4. Position yourself in front of the camera
5. The system will automatically start monitoring your focus and drowsiness levels
6. Visual indicators and alerts will notify you of detected drowsiness or loss of focus

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**C0D3K0NG**

## 🙏 Acknowledgments

- MediaPipe team for the excellent face landmark detection model
- Flask community for the lightweight and flexible web framework

---

**Note**: This project is designed for educational and research purposes. For production use in safety-critical applications, additional testing and validation would be required.
