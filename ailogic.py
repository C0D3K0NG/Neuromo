import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import time
import urllib.request
import os

class EyeTracker:
    def __init__(self):
        # 1. Download and Initialize MediaPipe Face Landmarker (New API)
        model_path = 'face_landmarker.task'
        if not os.path.exists(model_path):
            print("Downloading face landmarker model...")
            url = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
            urllib.request.urlretrieve(url, model_path)
            print("Model downloaded successfully!")
        
        # Configure the face landmarker
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
        
        # 2. Define the specific landmark numbers for Eyes (Standard MediaPipe Indices)
        # Left Eye [Top, Bottom, Left, Right]
        self.LEFT_EYE = [386, 374, 263, 362] 
        # Right Eye [Top, Bottom, Left, Right]
        self.RIGHT_EYE = [159, 145, 33, 133]
        
        # 3. Tuning Variables (We can adjust these later)
        self.EAR_THRESHOLD = 0.22 # Below this = Sleeping
        self.CONFIDENCE_THRESHOLD = 30 # Number of frames to count as "Asleep" (approx 1 sec)
        self.sleep_counter = 0

    def calculate_ear(self, landmarks, indices, w, h):
        """Calculates Eye Aspect Ratio (Open-ness of eye)"""
        # Get coordinates of the 4 key points
        top = np.array([landmarks[indices[0]].x * w, landmarks[indices[0]].y * h])
        bottom = np.array([landmarks[indices[1]].x * w, landmarks[indices[1]].y * h])
        left = np.array([landmarks[indices[2]].x * w, landmarks[indices[2]].y * h])
        right = np.array([landmarks[indices[3]].x * w, landmarks[indices[3]].y * h])

        # Calculate distances
        vertical_dist = np.linalg.norm(top - bottom)
        horizontal_dist = np.linalg.norm(left - right)

        # The Magic Formula
        ear = vertical_dist / horizontal_dist
        return ear

    def process_frame(self, frame):
        """Takes a frame, returns the processed frame + Status"""
        h, w, _ = frame.shape
        
        # Convert to RGB and create MediaPipe Image object
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        # Detect face landmarks using new API
        detection_result = self.detector.detect(mp_image)
        
        status = "Active"
        color = (0, 255, 0) # Green

        if detection_result.face_landmarks:
            for face_landmarks in detection_result.face_landmarks:
                # 1. Calculate EAR for both eyes
                left_ear = self.calculate_ear(face_landmarks, self.LEFT_EYE, w, h)
                right_ear = self.calculate_ear(face_landmarks, self.RIGHT_EYE, w, h)
                
                # Average EAR
                avg_ear = (left_ear + right_ear) / 2.0

                # 2. Check for Drowsiness
                if avg_ear < self.EAR_THRESHOLD:
                    self.sleep_counter += 1
                    status = "Drowsy?"
                    color = (0, 255, 255) # Yellow warning
                    
                    if self.sleep_counter > self.CONFIDENCE_THRESHOLD:
                        status = "SLEEPING !!!"
                        color = (0, 0, 255) # RED ALERT
                else:
                    self.sleep_counter = 0 # Reset if eyes open
                    status = "Focused"
                    color = (0, 255, 0)

                # 3. Draw visuals (Optional - helps debug)
                cv2.putText(frame, f"EAR: {avg_ear:.2f}", (30, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(frame, f"Status: {status}", (30, 70), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                
                # Draw the eye points for "Cyber" look
                for idx in self.LEFT_EYE + self.RIGHT_EYE:
                    lm = face_landmarks[idx]
                    cv2.circle(frame, (int(lm.x*w), int(lm.y*h)), 2, (0, 255, 255), -1)

        return frame, status

# --- TEST CODE (Run this to check if camera works) ---
if __name__ == "__main__":
    cap = cv2.VideoCapture(0)
    tracker = EyeTracker()
    
    print("Press 'q' to quit...")
    while True:
        ret, frame = cap.read()
        if not ret: break
        
        # Process the frame through our AI
        frame, status = tracker.process_frame(frame)
        
        cv2.imshow("Third Eye Debug", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()
