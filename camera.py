import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import os
import urllib.request

class VideoCamera(object):
    def __init__(self):
        # 1. Initialize Webcam
        self.video = cv2.VideoCapture(0)
        
        # 2. Download Model (Auto-download if missing)
        model_path = 'face_landmarker.task'
        if not os.path.exists(model_path):
            print("Downloading face landmarker model...")
            url = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
            urllib.request.urlretrieve(url, model_path)
            print("Model downloaded!")

        # 3. Setup MediaPipe Face Landmarker
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.detector = vision.FaceLandmarker.create_from_options(options)

        # 4. Define Eye Indices (Your constants)
        self.LEFT_EYE = [386, 374, 263, 362] 
        self.RIGHT_EYE = [159, 145, 33, 133]
        
        # 5. Tuning Variables
        self.EAR_THRESHOLD = 0.22
        self.CONFIDENCE_THRESHOLD = 30
        self.sleep_counter = 0

    def __del__(self):
        self.video.release()

    def calculate_ear(self, landmarks, indices, w, h):
        """Calculates Eye Aspect Ratio"""
        # Get coordinates of the 4 key points
        top = np.array([landmarks[indices[0]].x * w, landmarks[indices[0]].y * h])
        bottom = np.array([landmarks[indices[1]].x * w, landmarks[indices[1]].y * h])
        left = np.array([landmarks[indices[2]].x * w, landmarks[indices[2]].y * h])
        right = np.array([landmarks[indices[3]].x * w, landmarks[indices[3]].y * h])

        # Calculate distances
        vertical_dist = np.linalg.norm(top - bottom)
        horizontal_dist = np.linalg.norm(left - right)

        # The Magic Formula
        return vertical_dist / horizontal_dist

    def get_frame(self):
        """Reads a frame, runs AI, returns JPEG bytes for the web"""
        success, frame = self.video.read()
        if not success:
            return None
        
        h, w, _ = frame.shape
        
        # --- AI PROCESSING START ---
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        # Detect landmarks
        detection_result = self.detector.detect(mp_image)
        
        status = "Active"
        color = (0, 255, 0) # Green

        if detection_result.face_landmarks:
            for face_landmarks in detection_result.face_landmarks:
                # 1. Calculate EAR
                left_ear = self.calculate_ear(face_landmarks, self.LEFT_EYE, w, h)
                right_ear = self.calculate_ear(face_landmarks, self.RIGHT_EYE, w, h)
                avg_ear = (left_ear + right_ear) / 2.0

                # 2. Check Drowsiness
                if avg_ear < self.EAR_THRESHOLD:
                    self.sleep_counter += 1
                    status = "Drowsy?"
                    color = (0, 255, 255) # Yellow
                    
                    if self.sleep_counter > self.CONFIDENCE_THRESHOLD:
                        status = "SLEEPING !!!"
                        color = (0, 0, 255) # Red
                else:
                    self.sleep_counter = 0
                    status = "Focused"
                    color = (0, 255, 0)

                # 3. Draw Visuals on the Frame
                cv2.putText(frame, f"EAR: {avg_ear:.2f}", (30, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(frame, f"Status: {status}", (30, 70), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                
                # Draw Eye Points (Cyberpunk Look)
                for idx in self.LEFT_EYE + self.RIGHT_EYE:
                    lm = face_landmarks[idx]
                    cv2.circle(frame, (int(lm.x*w), int(lm.y*h)), 2, (0, 255, 255), -1)
        # --- AI PROCESSING END ---

        # Encode frame to JPEG for the website
        ret, jpeg = cv2.imencode('.jpg', frame)
        return jpeg.tobytes()