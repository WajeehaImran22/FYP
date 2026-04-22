#video service
import asyncio
import tempfile
import os
import uuid
from fastapi import HTTPException, status
from supabase import Client
from core.config import settings
from core.logger import logger

from google import genai
from google.genai.types import GenerateVideosConfig
from core.config import settings

# The SDK will automatically see the variables set by config.py
gemini_client = genai.Client()

class VideoService:
    @staticmethod
    async def generate_ad_sequence(
        user_client: Client, 
        prompts: list[str],
        time_of_day: str,
        weather_condition: str
    ) -> str:
        # Note: Keeping the function name 'generate_ad_sequence' so your routes.py doesn't break,
        # but we are now strictly generating ONE single video.
        
        try:
            if hasattr(user_client, "current_user") and user_client.current_user:
                user_id = user_client.current_user.id
            else:
                user_id = user_client.auth.get_user().user.id
        except Exception:
            raise HTTPException(status_code=401, detail="Could not verify authenticated user.")
            
        logger.info(f"User {user_id} requested SINGLE video generation.")
        
        # We only use the FIRST prompt in the list
        primary_prompt = prompts[0]
        video_path = None
        
        try:
            logger.info("Initiating Veo generation on Vertex AI for a single clip...")
            
            # 1. Start generation
            def start_generation():
                return gemini_client.models.generate_videos(
                    model="veo-3.1-generate-001",
                    prompt=primary_prompt,
                    config=GenerateVideosConfig(
                        aspect_ratio="16:9",
                        duration_seconds=4
                    )
                )
            
            operation = await asyncio.to_thread(start_generation)
            logger.info("Generation started. SDK Polling initiated...")
            
            # 2. Polling Loop
            max_attempts = 45 
            attempts = 0
            
            while not operation.done and attempts < max_attempts:
                await asyncio.sleep(15)
                attempts += 1
                logger.info(f"Checking SDK status... (Attempt {attempts}/{max_attempts})")
                operation = await asyncio.to_thread(gemini_client.operations.get, operation=operation)
                
            if not operation.done:
                raise TimeoutError("Veo generation exceeded maximum polling time.")

            if operation.error:
                 raise ValueError(f"SDK reported an error: {operation.error}")

            # 3. Save Video
            generated_video = operation.response.generated_videos[0]

            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
                video_path = tmp_file.name

            if hasattr(generated_video.video, 'video_bytes') and generated_video.video.video_bytes:
                with open(video_path, 'wb') as f:
                    f.write(generated_video.video.video_bytes)
            elif hasattr(generated_video.video, 'save'):
                generated_video.video.save(video_path)
            else:
                raise ValueError("Could not extract video bytes.")
                
            logger.info("Successfully generated single clip.")

            # 4. Upload to Supabase (No MoviePy stitching needed!)
            logger.info("Uploading video to Supabase...")
            file_name = f"{user_id}/{uuid.uuid4().hex}_single.mp4"
            with open(video_path, "rb") as f:
                video_bytes = f.read()

            def upload_and_get_url():
                user_client.storage.from_("billboards").upload(
                    file=video_bytes,
                    path=file_name,
                    file_options={"content-type": "video/mp4"}
                )
                return user_client.storage.from_("billboards").get_public_url(file_name)
            
            public_url = await asyncio.to_thread(upload_and_get_url)

            # 5. Database Record
            def save_to_db():
                user_client.table("ads").insert({
                    "user_id": user_id,
                    "url": public_url,
                    "media_type": "video",
                    "prompt": primary_prompt, 
                    "time_of_day": time_of_day,
                    "weather_condition": weather_condition
                }).execute()

            await asyncio.to_thread(save_to_db)
            return public_url
            
        except Exception as e:
            logger.error(f"Video Pipeline Error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            # Clean up the single temporary file
            if video_path and os.path.exists(video_path): 
                os.remove(video_path)
