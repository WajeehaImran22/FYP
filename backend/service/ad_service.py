#ad service
import json
import logging
from typing import List, Dict, Any

from fastapi import HTTPException, status
from groq import Groq
from core.config import settings

logger = logging.getLogger("billboard_api.ad_service")
groq_client = Groq(api_key=settings.GROQ_API_KEY)

class AdService:
    # Constants for database-valid categories
    VALID_TIMES = ["morning", "afternoon", "evening", "night", "any"]
    VALID_WEATHER = ["clear", "rain", "clouds", "snow", "any"]

    @staticmethod
    def _get_system_instruction(mode: str) -> str:
        """Helper to generate specific instructions for Video or Image modes."""
        base = """
        You are an expert AI moderator and prompt engineer for a digital billboard advertising system.
        
        TASK 1: Moderation. Reject hate speech, violence, explicit content, or illegal activities.
        TASK 2: Categorization. Predict the best 'time_of_day' and 'weather_condition' for this ad.
                - time_of_day must be one of: [morning, afternoon, evening, night, any]
                - weather_condition must be one of: [clear, rain, clouds, snow, any]
        """

        if mode == "video":
            specific = """
        TASK 3: Enhancement. Break the concept into EXACTLY THREE 4-second sequential visual prompts (Hook, Message, Call to Action).
        
        RESPONSE SCHEMA (JSON):
        If rejected: {"status": "rejected", "message": "Reason"}
        If approved: {
            "status": "approved", 
            "enhanced_prompts": ["<P1>", "<P2>", "<P3>"],
            "time_of_day": "<category>",
            "weather_condition": "<category>"
        }
            """
        else:
            specific = """
        TASK 3: Enhancement. Provide one detailed, 16:9 cinematic visual prompt optimized for image generation.
        
        RESPONSE SCHEMA (JSON):
        If rejected: {"status": "rejected", "message": "Reason"}
        If approved: {
            "status": "approved", 
            "enhanced_prompt": "<The Prompt>",
            "time_of_day": "<category>",
            "weather_condition": "<category>"
        }
            """
        return base + specific

    @staticmethod
    def _call_llm(user_prompt: str, mode: str) -> Dict[str, Any]:
        """Private helper to handle Groq API calls and validation."""
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": AdService._get_system_instruction(mode)},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.4, # Slightly lower for stricter category adherence
                response_format={"type": "json_object"}
            )
            
            result = json.loads(completion.choices[0].message.content)

            # Validation: Ensure LLM used valid categories for the DB
            if result.get("status") == "approved":
                if result.get("time_of_day") not in AdService.VALID_TIMES:
                    result["time_of_day"] = "any"
                if result.get("weather_condition") not in AdService.VALID_WEATHER:
                    result["weather_condition"] = "any"
            
            return result

        except Exception as e:
            logger.error(f"Groq API error in {mode} mode: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"AI Processing Error: {str(e)}"
            )

    @staticmethod
    def process_prompt(user_prompt: str) -> dict:
        """Processes 3-part video sequence prompts."""
        logger.info("Processing 12s video sequence ad...")
        return AdService._call_llm(user_prompt, "video")

    @staticmethod
    def process_image_prompt(user_prompt: str) -> dict:
        """Processes single image billboard prompts."""
        logger.info("Processing single image billboard ad...")
        return AdService._call_llm(user_prompt, "image")
