import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from core.config import settings
from core.logger import logger

# Import all routers
from routes.auth_routes import router as auth_router
from routes.profile_routes import router as profile_router
from routes.ad_routes import router as ad_router 
from routes.image_routes import router as image_router 
from routes.video_routes import router as video_router
from routes.video_upload_routes import router as video_upload_router
from routes.billboard_routes import router as billboard_router
from routes.admin_routes import router as admin_router

logger.info("Initializing Digital Billboard API...")

# 1. Initialize FastAPI with Swagger persistence
app = FastAPI(
    title=settings.PROJECT_NAME,
    swagger_ui_parameters={"persistAuthorization": True}
)

# 2. Configure CORS (Specific origin required for allow_credentials=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://digitalbillboardfyp.vercel.app/"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define the Global Security Scheme for Swagger UI
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="AI-Driven Contextual Advertising & Billboard Management API",
        routes=app.routes,
    )
    
    # Add Bearer Token security definition
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    # Apply security globally so the padlock appears on all routes
    openapi_schema["security"] = [{"BearerAuth": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# 4. Include all Routers
app.include_router(auth_router, prefix="/auth")
app.include_router(profile_router)
app.include_router(ad_router)
app.include_router(image_router) 
app.include_router(video_router) 
app.include_router(video_upload_router)
app.include_router(billboard_router)
app.include_router(admin_router)

# 5. Lifespan Events
@app.on_event("startup")
async def on_startup():
    logger.info("Application startup complete")

@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Application is shutting down")

# 6. Basic Endpoints
@app.get("/health")
async def health_check():
    logger.info("Health check endpoint hit.")
    return {"status": "healthy"}

@app.get("/")
async def root():
    logger.info("Root endpoint hit.")
    return {"message": f"Welcome to the {settings.PROJECT_NAME}!"}