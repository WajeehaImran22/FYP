from pydantic import BaseModel
from typing import Optional

class ImageGenerateRequest(BaseModel):
    prompt: str
    # New fields to receive tags from the frontend/Llama
    time_of_day: Optional[str] = "any"
    weather_condition: Optional[str] = "any"