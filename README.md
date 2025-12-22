<div align="center">

# Neuromo

<img src="https://raw.githubusercontent.com/C0D3K0NG/Neuromo/main/static/logo.svg" alt="Neuromo Logo" width="120"/>

### AI-Powered Focus & Drowsiness Monitoring System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-2.0%2B-green.svg)](https://flask.palletsprojects.com/)

</div>

---

## Overview

Neuromo combines computer vision AI with the Pomodoro Technique to help you maintain focus and combat drowsiness during work sessions. Real-time facial landmark detection monitors your attention while respecting your privacy.

## Features

<img src="https://img.icons8.com/fluency/48/000000/artificial-intelligence.png" width="20"/> **AI Monitoring**
- Real-time face detection using MediaPipe
- Drowsiness detection via Eye Aspect Ratio (EAR)
- Focus tracking through head pose analysis
- Live video feed with visual feedback

<img src="https://img.icons8.com/fluency/48/000000/tomato.png" width="20"/> **Smart Pomodoro Timer**
- Auto-loop: 25min Focus → 5min Break
- Privacy-first: Camera turns OFF during breaks
- Flexible time controls (+5/-5 min adjustments)
- Audio cues for session transitions

<img src="https://img.icons8.com/fluency/48/000000/music.png" width="20"/> **Immersive Experience**
- Integrated Lofi music player
- Dynamic tab title with countdown
- Desktop notifications
- Accidental closure prevention

## Installation

```bash
# Clone repository
git clone https://github.com/C0D3K0NG/Neuromo.git
cd Neuromo

# Install dependencies
pip install -r requirements.txt

# Run application
python app.py
```

Access at: `http://127.0.0.1:8969`

## Project Structure

```
Neuromo/
├── app.py                    # Flask application
├── camera.py                 # Face detection logic
├── face_landmarker.task      # MediaPipe model
├── requirements.txt          # Dependencies
├── static/                   # CSS, JS, images
└── pages/                    # HTML templates
```

## Technology Stack

- **Python** - Core language
- **Flask** - Web framework
- **MediaPipe** - Face landmark detection
- **OpenCV** - Computer vision
- **NumPy** - Numerical computations
- **Gunicorn** - Production server

## Usage

1. Launch: `python app.py`
2. Open: `http://127.0.0.1:8969`
3. Allow camera access
4. Click "START" to begin focus session
5. Camera auto-disables during breaks

## Contributing

Contributions welcome! Fork the repo and submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file.

## Author

**C0D3K0NG** - [GitHub](https://github.com/C0D3K0NG)

## Acknowledgments

- MediaPipe team for face landmark detection
- Flask community for the web framework

---

<div align="center">

**Note**: For educational and research purposes. Production use in safety-critical applications requires additional testing.

</div>
