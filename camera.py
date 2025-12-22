import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import os
import urllib.request
import time

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
        
        # 5. Landmarks for "Distraction" (Head Turn)
        self.NOSE_TIP = 1
        self.LEFT_CHEEK = 454
        self.RIGHT_CHEEK = 234
        
        # 6. Tuning Variables
        self.EAR_THRESHOLD = 0.26
        self.CONFIDENCE_THRESHOLD = 20
        self.current_status= "Active"
        self.sleep_counter = 0
        
        # NEW: Time Tracking Variables
        self.distraction_start_time = None
        self.DISTRACTION_LIMIT = 2 * 60

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

                # 2. Gaze/Head Logic (Distraction)
                # We check the ratio of the nose to the cheeks
                nose_x = face_landmarks[self.NOSE_TIP].x
                left_cheek_x = face_landmarks[self.LEFT_CHEEK].x
                right_cheek_x = face_landmarks[self.RIGHT_CHEEK].x
                
                # Calculate distances
                dist_left = nose_x - right_cheek_x  # Note: MediaPipe mirrors coordinates usually
                dist_right = left_cheek_x - nose_x
                
                # Check for Head Turn (Distraction)
                # If nose is too close to one cheek, user is looking away
                is_looking_away = False
                if dist_right != 0: # Avoid division by zero
                    ratio = dist_left / dist_right
                    # --- ADD THIS DEBUG LINE TEMPORARILY ---
                    #print(f"Head Ratio: {ratio:.2f}") 
                    # ---------------------------------------
                    if ratio > 4 or ratio < 0: # Tuned thresholds
                        is_looking_away = True

                # --- FINAL STATUS DECISION ---
                if avg_ear < self.EAR_THRESHOLD:
                    self.sleep_counter += 1
                    status = "Drowsy?"
                    color = (0, 255, 255) # Yellow
                    
                    if self.sleep_counter > self.CONFIDENCE_THRESHOLD:
                        status = "SLEEPING !!!"
                        color = (0, 0, 255) # Red
                        self.current_status = "alarm"
                    
                    # Reset distraction timer if sleeping (Sleep takes priority)
                    self.distraction_start_time = None

                # 2. SECONDARY: DISTRACTION (Looking away - With 5 min buffer)
                elif is_looking_away:
                    self.sleep_counter = 0 # Not sleeping
                    
                    # A. Start the timer if it hasn't started yet
                    if self.distraction_start_time is None:
                        self.distraction_start_time = time.time()
                    
                    # B. Check how much time has passed
                    elapsed_time = time.time() - self.distraction_start_time
                    remaining_time = self.DISTRACTION_LIMIT - elapsed_time
                    
                    if elapsed_time > self.DISTRACTION_LIMIT:
                        # Time is up! Trigger Alarm
                        status = "DISTRACTED!"
                        color = (0, 0, 255) # Red
                        self.current_status = "alarm"
                    else:
                        # Still in "Grace Period" - No Alarm yet
                        # Optional: Show countdown in text
                        status = f"Away: {int(remaining_time)}s"
                        color = (0, 165, 255) # Orange warning
                        self.current_status = "active"

                # 3. FOCUSED (Reset everything)
                else:
                    self.sleep_counter = 0
                    self.distraction_start_time = None # Reset the timer completely
                    status = "Focused"
                    color = (0, 255, 0) # Green
                    self.current_status = "active"

                # 3. Draw Visuals on the Frame
                # ... (Your logic for determining status/color is above this) ...

                # --- NEW DRAWING LOGIC (CENTERED) ---
                
                # 1. Draw EAR at UPPER MIDDLE
                ear_text = f"EAR: {avg_ear:.2f}"
                font = cv2.FONT_HERSHEY_SIMPLEX
                scale = 0.6
                thickness = 2
                
                # Calculate size to center it
                (text_w, text_h), _ = cv2.getTextSize(ear_text, font, scale, thickness)
                x_pos = (w - text_w) // 2
                y_pos = 30 # 30 pixels from top
                
                # Draw black outline for readability
                cv2.putText(frame, ear_text, (x_pos, y_pos), font, scale, (0, 0, 0), thickness + 2)
                # Draw white text
                cv2.putText(frame, ear_text, (x_pos, y_pos), font, scale, (255, 255, 255), thickness)

                # 2. Draw STATUS at BOTTOM MIDDLE
                status_text = f"{status}" # Removed "Status:" prefix to make it cleaner
                scale = 0.8
                
                (text_w, text_h), _ = cv2.getTextSize(status_text, font, scale, thickness)
                x_pos = (w - text_w) // 2
                y_pos = h - 20 # 20 pixels from bottom
                
                # Draw black outline
                cv2.putText(frame, status_text, (x_pos, y_pos), font, scale, (0, 0, 0), thickness + 2)
                # Draw colored text (Green/Red/Yellow)
                cv2.putText(frame, status_text, (x_pos, y_pos), font, scale, color, thickness)
                
                # Draw Eye Points (Cyberpunk Look) - Keep this as is
                for idx in self.LEFT_EYE + self.RIGHT_EYE:
                    lm = face_landmarks[idx]
                    cv2.circle(frame, (int(lm.x*w), int(lm.y*h)), 2, (0, 255, 255), -1)
                # Draw Eye Points (Cyberpunk Look)
                for idx in self.LEFT_EYE + self.RIGHT_EYE:
                    lm = face_landmarks[idx]
                    cv2.circle(frame, (int(lm.x*w), int(lm.y*h)), 2, (0, 255, 255), -1)
        # --- AI PROCESSING END ---

        # Encode frame to JPEG for the website
        ret, jpeg = cv2.imencode('.jpg', frame)
        return jpeg.tobytes()