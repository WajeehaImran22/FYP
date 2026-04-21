import logging
from fastapi import APIRouter, Depends
from supabase import Client
from core.dependencies import get_current_user_client
from schema.ad import AdPromptRequest, AdPromptResponse, ImagePromptResponse
from service.ad_service import AdService

logger = logging.getLogger("billboard_api.ad_routes")
router = APIRouter(prefix="/ads", tags=["Advertisement Generation"])

@router.post("/enhance-prompt", response_model=AdPromptResponse)
async def enhance_ad_prompt(
    request: AdPromptRequest,
    user_client: Client = Depends(get_current_user_client)
):
    """
    Submits a raw ad prompt to Llama 3.3 for moderation and splits it into 
    3 sequential prompts + predicts optimal time/weather context.
    """
    logger.info("Enhancing video sequence prompt for authenticated user")
    return AdService.process_prompt(request.prompt)

@router.post("/enhance-image-prompt", response_model=ImagePromptResponse)
async def enhance_image_prompt(
    request: AdPromptRequest,
    user_client: Client = Depends(get_current_user_client)
):
    """
    Submits a raw ad prompt to Llama 3.3 for moderation and enhances it into 
    a single detailed image prompt + predicts optimal time/weather context.
    """
    logger.info("Enhancing image billboard prompt for authenticated user")
    return AdService.process_image_prompt(request.prompt)