#supabase_client 
from supabase import create_client, Client
from core.config import settings

# Initialize a single Supabase client instance to be used across the app
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
