import logging
from fastapi import APIRouter, Depends
from supabase import Client
from core.dependencies import get_current_user_client
from service.admin_service import AdminService

logger = logging.getLogger("billboard_api.admin_routes")

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/logs")
async def get_audit_logs(user_client: Client = Depends(get_current_user_client)):
    """
    Fetch all system moderation logs (Accepted & Rejected). 
    Requires the authenticated user to have the 'admin' role.
    """
    return AdminService.get_all_audit_logs(user_client)