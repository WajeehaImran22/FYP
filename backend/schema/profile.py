#profilepy
from pydantic import BaseModel
from typing import Optional

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    # We do NOT include 'role' or 'email' here because we don't want users 
    # hacking the API to promote themselves to 'admin'.

class ProfileResponse(BaseModel):
    id: str
    email: str
    role: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None
