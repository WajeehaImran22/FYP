import asyncio
import uuid
from fastapi import HTTPException, status
from supabase import Client
from core.config import settings
from core.logger import logger

from google import genai
from google.genai import types

class ImageService:
    @staticmethod
    async def generate_and_store_ad(
        user_client: Client, 
        user_id: str, 
        prompt: str, 
        time_of_day: str, 
        weather_condition: str
    ) -> bytes:
        logger.info(f"User {user_id} generating image with context: {time_of_day}/{weather_condition}")
        logger.info(f"FINAL PROMPT: {prompt}")

        # Using your exact verified initialization
        # Ensure settings.GEMINI_API_KEY maps to the key that worked in your test script
        client = genai.Client(
            vertexai=True,
            api_key=settings.GEMINI_API_KEY, 
        )

        model = "gemini-3-pro-image-preview"
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt)
                ]
            ),
        ]

        # Your exact configuration
        generate_content_config = types.GenerateContentConfig(
            temperature=1,
            top_p=0.95,
            max_output_tokens=32768,
            response_modalities=["IMAGE"], # Enforced IMAGE only so we don't accidentally parse text
            safety_settings=[
                types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="OFF"),
                types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="OFF"),
                types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="OFF"),
                types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="OFF")
            ],
            image_config=types.ImageConfig(
                aspect_ratio="16:9", # Updated for your billboard UI
                image_size="1K",
                output_mime_type="image/png",
            ),
        )

        try:
            # Wrap the SDK call in asyncio to prevent blocking the FastAPI event loop
            def call_gemini():
                return client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=generate_content_config,
                )

            logger.info("Calling Vertex AI with your verified SDK config...")
            response = await asyncio.to_thread(call_gemini)

            # Extract the Image Bytes safely
            image_bytes = None
            mime_type = "image/png"
            
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        image_bytes = part.inline_data.data
                        mime_type = part.inline_data.mime_type or "image/png"
                        break
            
            if not image_bytes:
                raise ValueError("No image data returned from the model.")

            # Storage Logic
            file_name = f"{user_id}/{uuid.uuid4().hex}.png"
            
            def upload_to_storage():
                user_client.storage.from_("billboards").upload(
                    file=image_bytes,
                    path=file_name,
                    file_options={"content-type": mime_type}
                )
                return user_client.storage.from_("billboards").get_public_url(file_name)

            public_url = await asyncio.to_thread(upload_to_storage)

            # Database Logic
            def save_to_db():
                user_client.table("ads").insert({
                    "user_id": user_id,
                    "url": public_url,
                    "media_type": "image",
                    "prompt": prompt,
                    "time_of_day": time_of_day,
                    "weather_condition": weather_condition
                }).execute()

            await asyncio.to_thread(save_to_db)
            
            logger.info(f"Successfully generated and stored billboard for {user_id} via SDK")
            return image_bytes

        except Exception as e:
            logger.error(f"Image generation pipeline failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"Backend processing error: {str(e)}"
            )