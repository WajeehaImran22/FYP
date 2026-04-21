import logging
from fastapi import HTTPException, status
from supabase import Client

logger = logging.getLogger("billboard_api.admin_service")

class AdminService:
    
    @staticmethod
    def get_all_audit_logs(user_client: Client):
        try:
            # 1. Safely extract user ID
            if hasattr(user_client, "current_user") and user_client.current_user:
                user_id = user_client.current_user.id
            else:
                user_id = user_client.auth.get_user().user.id
                
            # 2. Verify Admin Role
            profile_res = user_client.table("profiles").select("role").eq("id", user_id).single().execute()
            
            if not profile_res.data or profile_res.data.get("role") != "admin":
                logger.warning(f"Unauthorized admin access attempt by user {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access Denied: You do not have administrator privileges."
                )
            
            # 3. Fetch all logs (Supabase RLS will allow this because of the SQL policy we just added)
            # The syntax "profiles(full_name, email)" automatically joins the user's details!
            logs_res = user_client.table("admin_audit_logs")\
                .select("*, profiles(full_name, email)")\
                .order("created_at", desc=True)\
                .execute()
                
            logger.info(f"Admin {user_id} successfully fetched {len(logs_res.data)} audit logs.")
            return logs_res.data
            
        except HTTPException:
            raise # Re-raise the 403 Forbidden so FastAPI handles it correctly
        except Exception as e:
            logger.error(f"Failed to fetch admin logs: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not retrieve administrative logs."
            )