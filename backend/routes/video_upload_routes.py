#vid upload routes
from fastapi import APIRouter, Depends, UploadFile, File
from supabase import Client
from core.dependencies import get_current_user_client
from schema.video_upload import VideoUploadResponse
from service.video_upload_service import VideoUploadService

router = APIRouter(prefix="/videos", tags=["Video Upload"])

@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    user_client: Client = Depends(get_current_user_client)
):
    """
    Uploads a video, extracts frames for AI moderation, 
    and stores it in the system if approved.
    """
    return await VideoUploadService.process_external_video(user_client, file)
