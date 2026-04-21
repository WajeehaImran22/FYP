from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from core.dependencies import get_current_user_client
from schema.video import VideoGenerateRequest, VideoGenerateResponse
from service.video_service import VideoService
from core.logger import logger

router = APIRouter(prefix="/videos", tags=["Video Generation"])

@router.post("/generate", response_model=VideoGenerateResponse)
async def generate_video(
    request: VideoGenerateRequest,
    user_client: Client = Depends(get_current_user_client)
):
    """
    Stitches a parallel-generated Veo sequence and records metadata in the Supabase DB.
    """
    try:
        # Depending on how your dependency returns the client
        user_id = user_client.auth.get_user().user.id
    except Exception:
        user_id = getattr(user_client, "current_user", None)
        
    logger.info(f"Hit /videos/generate for user {user_id}")
    
    public_url = await VideoService.generate_ad_sequence(
        user_client=user_client, 
        prompts=request.prompts,
        time_of_day=request.time_of_day,
        weather_condition=request.weather_condition
    )
    
    return {
        "message": "Video sequence generated and stored successfully.",
        "video_url": public_url
    }


from datetime import datetime, timedelta

@router.post("/schedules/deploy")
async def deploy_ad(
    payload: dict, 
    user_client: Client = Depends(get_current_user_client)
):
    try:
        user = getattr(user_client, "current_user", None)
        if not user:
            raise HTTPException(status_code=401, detail="INVALID_SESSION")

        # 1. NEW: Include media_url from payload
        media_url = payload.get('media_url')
        if not media_url:
            raise HTTPException(status_code=400, detail="MISSING_MEDIA_URL")

        try:
            start_dt = datetime.strptime(f"{payload['date']} {payload['time']}", "%Y-%m-%d %H:%M")
            expires_at = start_dt + timedelta(hours=payload['duration_hours'])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"DATETIME_PARSE_ERROR: {str(e)}")

        data = {
            "user_id": user.id,
            "ad_id": payload['ad_id'],
            "media_url": media_url, # Direct URL storage
            "scheduled_date": payload['date'],
            "start_time": payload['time'],
            "duration_hours": payload['duration_hours'],
            "tier": payload['tier'],
            "total_price": payload['total_price'],
            "expires_at": expires_at.isoformat()
        }

        response = user_client.table("schedules").insert(data).execute()
        return {"status": "success", "data": response.data}

    except Exception as e:
        logger.error(f"Deployment failed: {str(e)}")
        raise HTTPException(status_code=500, detail="INTERNAL_SERVER_ERROR")

from datetime import datetime
from fastapi import APIRouter, Depends
from supabase import Client
from core.dependencies import get_current_user_client # Or a public client dep

from datetime import datetime
from fastapi import APIRouter
from core.supabase_client import supabase  # Import your global anon client
from core.logger import logger

@router.get("/billboard/active")
async def get_active_billboard_ads():
    """
    PUBLIC ENDPOINT: Fetches ads that are currently scheduled to be live.
    No Authorization header required.
    """
    try:
        # Use UTC to stay consistent with Supabase storage timestamps
        now = datetime.utcnow().isoformat()
        
        # We use the global 'supabase' client here instead of 'user_client'
        response = supabase.table("schedules") \
            .select("*, ads(*)") \
            .gt("expires_at", now) \
            .order("created_at", desc=True) \
            .execute()
            
        return response.data
        
    except Exception as e:
        logger.error(f"Billboard signal lost: {str(e)}")
        return []