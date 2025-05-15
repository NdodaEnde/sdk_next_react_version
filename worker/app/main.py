from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.api.api_v1.api import api_router
from app.core.queue import setup_queue_listeners

# Load environment variables
load_dotenv()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting up the worker service...")
    # Setup Redis/Bull queue listeners
    await setup_queue_listeners()
    logger.info("Worker service ready!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down the worker service...")
    # Cleanup code here

@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy"}