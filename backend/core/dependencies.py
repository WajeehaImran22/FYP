from fastapi import Request, HTTPException, status
from supabase import create_client, Client, ClientOptions
from core.config import settings
from core.logger import logger

async def get_current_user_client(request: Request) -> Client:
    """
    Verifies the token from the secure cookie (or Auth header) 
    and returns a Supabase client scoped to this specific user.
    """
    
    # 1. Look for the token in the secure HTTPOnly cookie
    token = request.cookies.get("access_token")
    
    # 2. Fallback: If no cookie, check the Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    # If still no token, block the request immediately
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated. Missing cookie or token."
        )
        
    try:
        # 3. Create the client with specific user headers
        custom_options = ClientOptions(headers={"Authorization": f"Bearer {token}"})
        
        user_client: Client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_KEY, 
            options=custom_options
        )
        
        # 4. CRITICAL FIX: Synchronize the SDK's internal auth state.
        # This prevents 'NoneType' errors when calling user_client.auth later.
        user_client.auth.set_session(token, "refresh_token_not_needed")
        
        # 5. Verify the token is still valid with Supabase
        user_response = user_client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid or expired token"
            )
            
        # 6. Attach the user object for easy access in our services
        # This is the 'Axiom' Protocol: we pull this in our routes to avoid re-fetching.
        user_client.current_user = user_response.user 
        
        return user_client
        
    except Exception as e:
        logger.error(f"Auth Dependency Failure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )