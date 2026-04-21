from pydantic import BaseModel, EmailStr

class UserCredentials(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class AuthResponse(BaseModel):
    message: str
    user: dict | None = None
    session: dict | None = None
    url: str | None = None