#auth routes
import logging
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from schema.auth import UserCredentials, ForgotPasswordRequest, AuthResponse
from service.auth_service import AuthService
from core.config import settings

logger = logging.getLogger("billboard_api.auth_routes")

# NOTE: Ensure this router is included in your main.py with prefix="/auth"
router = APIRouter(tags=["Authentication"])

@router.post("/signup", response_model=AuthResponse)
async def sign_up(credentials: UserCredentials):
    logger.info("Signup request received for email=%s", credentials.email)
    return AuthService.sign_up(credentials)

@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserCredentials):
    logger.info("Login request received for email=%s", credentials.email)
    return AuthService.login(credentials)

@router.post("/forgot-password", response_model=AuthResponse)
async def forgot_password(request: ForgotPasswordRequest):
    logger.info("Forgot password requested for email=%s", request.email)
    return AuthService.forgot_password(request)

@router.get("/google")
async def get_google_auth_url():
    """Returns the Supabase OAuth URL to initiate the server-side flow."""
    logger.info("Google OAuth URL requested")
    return AuthService.get_google_oauth_url()

@router.get("/callback")
async def google_callback(request: Request):
    """Handles the redirect from Google, exchanges the code, and sets the secure cookie."""
    code = request.query_params.get("code")

    if not code:
        logger.error("Google callback missing authorization code.")
        # If there's an error, kick them back to the frontend login page
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/auth?error=MissingCode")

    # Exchange the code for the JWT token
    access_token = AuthService.exchange_code(code)

    # Redirect user directly to the frontend dashboard
    response = RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard")

    # Set the token in an HttpOnly cookie (Invisible to frontend JavaScript)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # Crucial for XSS protection
        samesite="lax",
        max_age=3600    # Expires in 1 hour
    )

    return response
