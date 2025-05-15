from fastapi import APIRouter

from app.api.api_v1.endpoints import health, documents

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])