import cv2
import os
from ultralytics import YOLO

# LOAD THE MODEL GLOBALLY ON STARTUP
# Force absolute path loading so Render.com doesn't fail on relative `backend/SPY/` routing 
print("Loading YOLOv8 model into memory...")
try:
    # 1. First, attempt to load it explicitly relative to this exact script execution path
    DIR_PATH = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(DIR_PATH, "yolov8n.pt")
    
    if os.path.exists(model_path):
        model = YOLO(model_path)
        print(f"Model loaded and ready from absolute path: {model_path}")
    else:
        # 2. Fallback to basic download or root execution logic
        print(f"Path `{model_path}` missing. Executing root recovery...")
        model = YOLO("yolov8n.pt")
        print("Model generated/loaded from root directory.")
except Exception as e:
    print(f"CRITICAL ERROR loading YOLO model: {e}")

def analyze_video_file(video_path: str):
    """
    Takes a dynamic video file path from the API.
    Extracts frames, runs YOLOv8 detection, 
    and returns a list of unique detected objects alongside the highest confidence score.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video file {video_path}")
        return [], 0.0

    unique_detections = set()
    highest_conf = 0.0
    
    # Process 1 frame every second or so to handle live constraints
    # Assuming ~30fps, process every 10th frame to speed it up significantly
    frame_step = 10 
    frame_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        if frame_count % frame_step != 0:
            continue
            
        # Run inference
        results = model(frame, verbose=False)
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                class_name = model.names[cls_id]
                conf = float(box.conf[0])
                
                unique_detections.add(class_name)
                
                if conf > highest_conf:
                    highest_conf = conf
                    
    cap.release()
    return list(unique_detections), round(highest_conf, 2)

if __name__ == "__main__":
    # Test block
    test_path = "data/cctv_test.mp4"
    if os.path.exists(test_path):
        print(f"Testing on {test_path}...")
        labels, conf = analyze_video_file(test_path)
        print(f"DETECTIONS: {labels}")
        print(f"MAX CONFIDENCE: {conf}")
    else:
        print("Test file not found locally.")