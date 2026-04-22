#image routes
import logging
from fastapi import APIRouter, Depends, Response
from supabase import Client
from core.dependencies import get_current_user_client
from schema.image import ImageGenerateRequest
from service.image_service import ImageService

logger = logging.getLogger("billboard_api.image_routes")
router = APIRouter(prefix="/images", tags=["Image Generation"])

@router.post("/generate", response_class=Response)
async def generate_image(
    request: ImageGenerateRequest,
    user_client: Client = Depends(get_current_user_client) 
):
    """
    Generates an ad, stores it in Supabase, records it in the DB, 
    and returns the raw PNG for immediate display.
    """
    # Extract ID directly from the client object attached by your dependency
    user_id = user_client.current_user.id
    logger.info(f"Processing image generation request for user: {user_id}")
    
    image_bytes = await ImageService.generate_and_store_ad(
        user_client=user_client,
        user_id=user_id, # Pass the ID explicitly
        prompt=request.prompt,
        time_of_day=request.time_of_day,
        weather_condition=request.weather_condition
    )
    
    # Vertex AI returns high-quality PNGs by default
    return Response(content=image_bytes, media_type="image/png")
