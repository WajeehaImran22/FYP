import cv2
import os
import uuid
import asyncio
import tempfile
import json
from fastapi import HTTPException, UploadFile
from google import genai
from google.genai import types
from supabase import Client
from core.config import settings
from core.logger import logger
from PIL import Image

# --- Explicit API Key Initialization ---
gemini_client = genai.Client(
    vertexai=True,
    api_key=settings.GEMINI_API_KEY
)

class VideoUploadService:
    
    @staticmethod
    def _extract_frames(video_path: str, num_frames: int = 5):
        """Extracts n equidistant frames from a video file."""
        frames = []
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if total_frames <= 0:
            return []

        interval = total_frames // num_frames
        for i in range(num_frames):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i * interval)
            ret, frame = cap.read()
            if ret:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(Image.fromarray(frame_rgb))
        
        cap.release()
        return frames

    @staticmethod
    async def process_external_video(user_client: Client, file: UploadFile):
        
        try:
            if hasattr(user_client, "current_user") and user_client.current_user:
                user_id = user_client.current_user.id
            else:
                user_id = user_client.auth.get_user().user.id
        except Exception:
            raise HTTPException(status_code=401, detail="Could not verify authenticated user.")
            
        logger.info(f"User {user_id} uploading external video: {file.filename}")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            content = await file.read()
            tmp.write(content)
            video_path = tmp.name

        try:
            frames = await asyncio.to_thread(VideoUploadService._extract_frames, video_path)
            
            if not frames:
                raise ValueError("Could not extract frames from video.")

            prompt = """
Act as a strict content moderator for a public digital billboard system located in a busy city center.
Analyze these 5 frames and determine if they are appropriate for a general public audience (including children and drivers).

REJECT the content if it contains:
1. Nudity, suggestive content, or drugs.
2. Violence, weapons, or hate speech.
3. EXTREME AGGRESSION: Scary facial expressions, intense shouting, or threatening gestures.
4. INTENSE DISTRESS: Imagery of people in deep despair, crying, or disturbing emotional breakdowns.
5. SHOCK VALUE: Anything designed to startle or disturb people passing by.

Billboards should maintain a professional, safe, and positive or neutral vibe.

Return ONLY JSON: 
{
  "status": "approved" | "rejected",
  "reason": "Detailed explanation of the visual content found"
}
"""
            # Using your verified working model
            response = await asyncio.to_thread(
                gemini_client.models.generate_content,
                model='gemini-3-pro-image-preview', 
                contents=[prompt, *frames],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )

            # Default to rejected in case of a total JSON parse failure
            status_result = 'rejected'
            reason = 'Content analysis failed or returned invalid format.'

            try:
                analysis = json.loads(response.text)
                status_result = analysis.get('status', 'rejected')
                reason = analysis.get('reason', 'Content moderation failed.')
            except json.JSONDecodeError:
                logger.error(f"Failed to parse moderation JSON: {response.text}")

            # --- BULLETPROOF ADMIN AUDIT LOGGING ---
            # This runs EVERY single time, whether the AI says 'approved' or 'rejected'
            def log_audit_trail():
                user_client.table("admin_audit_logs").insert({
                    "user_id": user_id,
                    "file_name": file.filename,
                    "status": status_result, # Automatically captures BOTH approvals and rejections
                    "reason": reason,
                    "moderated_by": "gemini-3-pro-image-preview" 
                }).execute()
            
            try:
                await asyncio.to_thread(log_audit_trail)
            except Exception as db_err:
                logger.error(f"Failed to write to admin_audit_logs: {db_err}")

            # --- ROUTING BASED ON AI DECISION ---
            if status_result == 'rejected':
                logger.warning(f"Video {file.filename} rejected. Reason: {reason}")
                # We return cleanly here. It's already been logged to the database above!
                return {"status": "rejected", "message": reason}

            # If approved, proceed with storage upload
            logger.info(f"Video {file.filename} approved. Proceeding with upload.")
            file_name = f"{user_id}/uploads/{uuid.uuid4().hex}_{file.filename}"
            
            def upload_and_record():
                user_client.storage.from_("billboards").upload(
                    file=content,
                    path=file_name,
                    file_options={"content-type": "video/mp4"}
                )
                public_url = user_client.storage.from_("billboards").get_public_url(file_name)
                
                user_client.table("ads").insert({
                    "user_id": user_id,
                    "url": public_url,
                    "media_type": "video",
                    "prompt": f"Uploaded: {file.filename}",
                    "time_of_day": "any",
                    "weather_condition": "any"
                }).execute()
                return public_url

            public_url = await asyncio.to_thread(upload_and_record)
            return {"status": "approved", "message": reason, "url": public_url}

        except Exception as e:
            logger.error(f"Video upload processing failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
            
        finally:
            if os.path.exists(video_path):
                try:
                    os.remove(video_path)
                except OSError:
                    pass