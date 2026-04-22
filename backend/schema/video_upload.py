#vid upload py
from pydantic import BaseModel
from typing import Optional

class VideoUploadResponse(BaseModel):
    status: str # "approved" or "rejected"
    message: str
    url: Optional[str] = None
