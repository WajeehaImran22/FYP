#configpy
import os
import tempfile
import logging
from pydantic_settings import BaseSettings

logger = logging.getLogger("billboard_api.config")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Digital Billboard System API"
    SUPABASE_URL: str
    SUPABASE_KEY: str
    GROQ_API_KEY: str
    GEMINI_API_KEY: str
    GOOGLE_PROJECT_ID: str  
    OPENWEATHER_API_KEY: str
    API_URL: str
    FRONTEND_URL: str
    
    # Add the new JSON string from your .env file
    # (Setting a default of None so it doesn't crash if missing during local tests)
    GCP_SERVICE_ACCOUNT_JSON: str | None = None

    class Config:
        env_file = ".env"

# Initialize settings
settings = Settings()

# --- GLOBAL VERTEX AI CONFIGURATION ---
# 1. Handle the JSON Credentials
if settings.GCP_SERVICE_ACCOUNT_JSON:
    # Create a secure, temporary file in the server's memory
    fd, temp_path = tempfile.mkstemp(suffix=".json")
    with os.fdopen(fd, 'w') as f:
        f.write(settings.GCP_SERVICE_ACCOUNT_JSON)
    
    # Point the Google SDK to this temporary file globally
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_path
else:
    logger.warning("GCP_SERVICE_ACCOUNT_JSON not found in .env. Vertex AI SDK may fail.")

# 2. Set the other required Vertex AI env vars globally
os.environ["GOOGLE_CLOUD_PROJECT"] = settings.GOOGLE_PROJECT_ID
os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"

logger.info("Configuration loaded for project %s", settings.PROJECT_NAME)
