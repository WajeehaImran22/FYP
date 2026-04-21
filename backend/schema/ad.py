from pydantic import BaseModel
from typing import Optional, List

class AdPromptRequest(BaseModel):
    prompt: str

class AdPromptResponse(BaseModel):
    status: str  # "approved" or "rejected"
    message: Optional[str] = None 
    enhanced_prompts: Optional[List[str]] = None 
    # NEW: Contextual metadata
    time_of_day: Optional[str] = None
    weather_condition: Optional[str] = None

class ImagePromptResponse(BaseModel):
    status: str  # "approved" or "rejected"
    message: Optional[str] = None 
    enhanced_prompt: Optional[str] = None 
    # NEW: Contextual metadata
    time_of_day: Optional[str] = None
    weather_condition: Optional[str] = None