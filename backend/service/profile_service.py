#profile service
import logging

from fastapi import HTTPException, status
from supabase import Client
from schema.profile import ProfileUpdate

logger = logging.getLogger("billboard_api.profile_service")

class ProfileService:
    
    @staticmethod
    def get_my_profile(user_client: Client):
        user_id = user_client.current_user.id
        logger.info("Fetching profile for user %s", user_id)
        try:
            # We use the user_client, which already has the user's JWT attached.
            # Because of RLS, this will only return their own profile.
            response = user_client.table("profiles").select("*").eq("id", user_id).single().execute()
            logger.info("Profile fetched for user %s", user_id)
            return response.data
        except Exception as e:
            logger.error("Fetching profile failed for user %s: %s", user_id, str(e), exc_info=True)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    @staticmethod
    def update_my_profile(user_client: Client, profile_data: ProfileUpdate):
        try:
            user_id = user_client.current_user.id
            
            # Remove any None values so we don't accidentally overwrite existing data with nulls
            update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
            
            if not update_data:
                return {"message": "No data provided to update."}
                
            response = user_client.table("profiles").update(update_data).eq("id", user_id).execute()
            
            if not response.data:
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not update profile.")
                 
            return {"message": "Profile updated successfully", "profile": response.data[0]}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
