from fastapi import APIRouter, Depends
from supabase import Client
from core.dependencies import get_current_user_client
from service.scheduler_service import SchedulerService

router = APIRouter(prefix="/billboard", tags=["Billboard Display"])

@router.get("/current-ad")
async def get_current_ad(user_client: Client = Depends(get_current_user_client)):
    """
    The 'Poll' endpoint for the billboard hardware. 
    Determines what should be playing RIGHT NOW.
    """
    ad = await SchedulerService.get_active_billboard_ad(user_client)
    
    if not ad:
        return {
            "status": "idle",
            "url": "https://your-fallback-image.jpg",
            "media_type": "image"
        }
        
    return {
        "status": "active",
        "ad_id": ad['id'],
        "url": ad['url'],
        "media_type": ad['media_type'],
        "context": {
            "time": ad['time_of_day'],
            "weather": ad['weather_condition']
        }
    }