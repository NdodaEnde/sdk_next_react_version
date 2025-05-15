from fastapi import APIRouter, Depends
from typing import Dict, Any
import redis.asyncio as redis

from app.core.config import settings
from app.core.queue import get_redis_connection

router = APIRouter()

@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Simple health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }

@router.get("/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """Detailed health check including Redis connectivity"""
    health_status = {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "components": {
            "api": "healthy",
            "redis": "unknown",
            "landing_ai": "configured" if settings.LANDINGAI_API_KEY else "not_configured",
            "s3": "configured"
        }
    }
    
    # Check Redis connectivity
    try:
        redis_client = await get_redis_connection()
        await redis_client.ping()
        health_status["components"]["redis"] = "healthy"
    except Exception as e:
        health_status["components"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status