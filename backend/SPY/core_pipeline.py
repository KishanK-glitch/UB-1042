import cv2
from .vision_agent import process_frame

def run_cctv_simulation(video_path):
    # Open the video file (Simulating an RTSP CCTV stream)
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f" ERROR: Could not open video file at {video_path}")
        print("Make sure you put a video named 'cctv_test.mp4' in your 'data' folder.")
        return
        
    print(" Starting SPY CCTV feed simulation...")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print(" End of video stream.")
            break
            
        # 1. Pass the frame to our YOLOv8 agent
        detections, confidence = process_frame(frame)
        
        # 2. Log the output (In Phase 4, we will send this to main.py instead)
        if detections:
            print(f" THREAT DETECTED: {detections} | Confidence: {confidence}")
        
        # 3. Show the video feed on your screen (Judges love to see this)
        cv2.imshow("SPY - Live CCTV Feed", frame)
        
        # 4. Slow it down slightly so it doesn't process 1000 frames a second and crash
        time.sleep(0.03) 
        
        # Press 'q' on your keyboard to stop the video early
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    # Point this to a test video in your data folder
    test_video_path = "data/cctv_test.mp4"
    run_cctv_simulation(test_video_path)