#auth service
import logging
from fastapi import HTTPException, status
from core.supabase_client import supabase
from core.config import settings
from schema.auth import UserCredentials, ForgotPasswordRequest

logger = logging.getLogger("billboard_api.auth_service")

class AuthService:
    
    @staticmethod
    def sign_up(credentials: UserCredentials):
        logger.info("Signing up user %s", credentials.email)
        try:
            response = supabase.auth.sign_up({
                "email": credentials.email,
                "password": credentials.password
            })
            logger.info("Signup completed for user %s", credentials.email)
            return {
                "message": "User registered successfully. Please check your email to verify.", 
                "session": response.session.model_dump() if response.session else None
            }
        except Exception as e:
            logger.error("Signup failed for user %s: %s", credentials.email, str(e), exc_info=True)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def login(credentials: UserCredentials):
        try:
            logger.info("Login attempt for user %s", credentials.email)
            response = supabase.auth.sign_in_with_password({
                "email": credentials.email,
                "password": credentials.password
            })
            logger.info("Login successful for user %s", credentials.email)
            return {
                "message": "Login successful", 
                "session": response.session.model_dump() if response.session else None
            }
        except Exception as e:
            logger.warning("Login failed for user %s: %s", credentials.email, str(e), exc_info=True)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    @staticmethod
    def forgot_password(request: ForgotPasswordRequest):
        logger.info("Forgot password email requested for %s", request.email)
        try:
            supabase.auth.reset_password_email(request.email)
            logger.info("Password reset email sent for %s", request.email)
            return {"message": "Password reset email sent."}
        except Exception as e:
            logger.error("Forgot password failed for %s: %s", request.email, str(e), exc_info=True)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def get_google_oauth_url():
        try:
            # Step 1: Tell Supabase to redirect the user to our FASTAPI backend callback
            redirect_url = f"{settings.API_URL}/auth/callback"
            response = supabase.auth.sign_in_with_oauth({
                "provider": "google",
                "options": {
                    "redirect_to": redirect_url
                }
            })
            return {"url": response.url}
        except Exception as e:
            logger.error("Failed to generate Google URL: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Could not initiate Google login"
            )

    @staticmethod
    def exchange_code(auth_code: str):
        try:
            # Step 2: Exchange the one-time code from Google for a valid Supabase session
            response = supabase.auth.exchange_code_for_session({"auth_code": auth_code})
            
            if not response.session:
                raise ValueError("No session returned from Supabase")
                
            return response.session.access_token
        except Exception as e:
            logger.error("Code exchange failed: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authorization code."
            )
