from pydantic import BaseModel
from typing import List, Optional

class DetectionResult(BaseModel):
    timestamp: str
    camera_id: str
    visual_detections: List[str]
    visual_confidence: float
    audio_anomaly: Optional[str] = None
    audio_confidence: float
    status: str

class DatasetDownloadRequest(BaseModel):
    api_key: str
    workspace: str = "weopon-detection"
    project: str = "weapon-detection-using-yolov8"
    version: int = 1