from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import shutil
import uuid
import os
import tempfile

from .vision_agent import analyze_video_file
from .audio_agent import analyze_audio_anomaly
from .schemas import DatasetDownloadRequest

BASE_DIR = Path(__file__).resolve().parent
# Render only permits writes in `/tmp/` or system temp dirs.
TEMP_DIR = Path(tempfile.gettempdir())
DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"

os.makedirs(TEMP_DIR, exist_ok=True)

app = FastAPI(title="SPY Backend API - Sentinel Network")

# Secure CORS for the frontend + generic local dev matching Render origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sentinel-aid-guardian-2.onrender.com",
        "http://localhost:5173", 
        "http://localhost:3000",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def determine_dispatch(visual_detections: list, audio_detections: list):
    """
    Implements the core Emergency Dispatch Matrix logic required by Sentinel AI.
    """
    dispatched_agencies = set()
    v_set = set([v.lower() for v in visual_detections])
    a_set = set([a.lower() for a in audio_detections])

    # POLICE: Triggered if YOLO detects ['gun', 'knife', 'person'] or YAMNet detects ['gunshot', 'screaming']
    if v_set.intersection({"gun", "knife", "person"}) or a_set.intersection({"gunshot", "screaming"}):
        dispatched_agencies.add("POLICE")
        
    # FIRE: Triggered if YOLO detects ['fire', 'smoke'] or YAMNet detects ['fire alarm', 'explosion']
    if v_set.intersection({"fire", "smoke"}) or a_set.intersection({"fire alarm", "explosion"}):
        dispatched_agencies.add("FIRE")
        
    # AMBULANCE: Triggered if YOLO detects falling/down or YAMNet detects ['crying', 'help']
    # YOLO COCO dataset doesn't have "falling" out of the box, but if custom trained, this matches
    if v_set.intersection({"falling", "down"}) or a_set.intersection({"crying", "help"}):
        dispatched_agencies.add("AMBULANCE")
        
    return list(dispatched_agencies)


@app.get("/api/v1/status")
async def get_current_status():
    """
    Returns the general health status of the SENTINEL AI backend.
    """
    return {
        "status": "online", 
        "model": "YOLOv8 & YAMNet Active"
    }


@app.post("/api/v1/analyze-video")
async def analyze_video(file: UploadFile = File(...)):
    """
    Accepts an uploaded video chunk from the frontend MediaRecorder, 
    processes it through Vision and Audio AI pipelines, 
    and returns a dispatch payload.
    """
    if not file.filename.endswith((".mp4", ".webm")):
        raise HTTPException(status_code=400, detail="Only .mp4 or .webm files are supported")
        
    # Ensure conflict-free concurrent uploads using the Render system temp disk
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_file_path = TEMP_DIR / temp_filename
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Route to AI Pipelines using exact absolute file pathways stringified
        visual_labels, visual_conf = analyze_video_file(str(temp_file_path))
        audio_labels, audio_conf = analyze_audio_anomaly(str(temp_file_path))
        
        # Formulate Emergency Matrix
        dispatched = determine_dispatch(visual_labels, audio_labels)
        
        return {
            "visual_detections": visual_labels,
            "audio_detections": audio_labels,
            "confidence_scores": {
                "visual": visual_conf,
                "audio": audio_conf
            },
            "dispatched_agencies": dispatched
        }
    finally:
        # Crucial disk cleanup layer
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as e:
                print(f"Cleanup Error on {temp_file_path}: {e}")


@app.post("/api/v1/dataset/download")
async def download_dataset(request: DatasetDownloadRequest):
    """
    Legacy route for downloading datasets
    """
    try:
        from roboflow import Roboflow
        rf = Roboflow(api_key=request.api_key)
        project = rf.workspace(request.workspace).project(request.project)
        dataset_version = project.version(request.version)

        download_dir = DATA_DIR / f"{request.project}-v{request.version}"
        os.makedirs(download_dir, exist_ok=True)

        dataset_version.download("yolov8", location=str(download_dir))

        return {
            "status": "success",
            "message": "Dataset downloaded successfully",
            "location": str(download_dir)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# React Static Serving Backwards Compatibility
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/")
    async def serve_frontend():
        return FileResponse(STATIC_DIR / "index.html")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        return FileResponse(STATIC_DIR / "index.html")


# Minimal WebSocket endpoint for local dev and UI realtime hooks
from fastapi import WebSocket, WebSocketDisconnect


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            msg = await websocket.receive_text()
            # echo back for basic connectivity testing
            await websocket.send_text(msg)
    except WebSocketDisconnect:
        return