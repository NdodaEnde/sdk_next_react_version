import os
from typing import List, Optional
from pydantic import BaseModel
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Document Processing Worker"
    PROJECT_DESCRIPTION: str = "Worker service for processing documents with LandingAI"
    PROJECT_VERSION: str = "0.1.0"
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Redis settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    
    # Queue settings
    DOCUMENT_QUEUE_NAME: str = "document-processing"
    
    # LandingAI settings
    LANDINGAI_API_KEY: str = os.getenv("LANDINGAI_API_KEY", "")
    LANDINGAI_CLIENT_ID: str = os.getenv("LANDINGAI_CLIENT_ID", "")
    
    # S3/MinIO settings
    S3_ENDPOINT: str = os.getenv("S3_ENDPOINT", "http://localhost:9000")
    S3_ACCESS_KEY: str = os.getenv("S3_ACCESS_KEY", "minioadmin")
    S3_SECRET_KEY: str = os.getenv("S3_SECRET_KEY", "minioadmin")
    S3_REGION: str = os.getenv("S3_REGION", "us-east-1")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "documents")
    
    # Main application callback URL
    API_CALLBACK_URL: str = os.getenv("API_CALLBACK_URL", "http://localhost:3001/api/documents/process-result")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()