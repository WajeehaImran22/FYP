#videopy
from pydantic import BaseModel
from typing import List, Optional

class VideoGenerateRequest(BaseModel):
    prompts: List[str]
    # NEW: Contextual metadata for scheduling
    time_of_day: Optional[str] = "any"
    weather_condition: Optional[str] = "any"

class VideoGenerateResponse(BaseModel):
    message: str
    video_url: str
