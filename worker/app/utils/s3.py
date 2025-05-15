import json
import asyncio
from typing import Dict, Any, Optional, Union
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from loguru import logger

from app.core.config import settings

def get_s3_client():
    """Get a boto3 S3 client configured for MinIO/S3"""
    return boto3.client(
        's3',
        endpoint_url=settings.S3_ENDPOINT,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION,
    )

async def download_file_from_s3(s3_path: str, local_path: Union[str, Path]) -> bool:
    """
    Download a file from S3/MinIO to a local path
    
    Args:
        s3_path: Path to the file in S3/MinIO
        local_path: Local path to save the file to
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Ensure the local directory exists
        local_path = Path(local_path)
        local_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Download the file asynchronously
        loop = asyncio.get_event_loop()
        
        def _download():
            s3_client = get_s3_client()
            s3_client.download_file(
                settings.S3_BUCKET_NAME,
                s3_path,
                str(local_path)
            )
        
        await loop.run_in_executor(None, _download)
        logger.info(f"Downloaded {s3_path} to {local_path}")
        return True
    except ClientError as e:
        logger.error(f"Error downloading file from S3: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error downloading file: {str(e)}")
        raise

async def upload_result_to_s3(result: Dict[str, Any], s3_path: str) -> bool:
    """
    Upload a JSON result to S3/MinIO
    
    Args:
        result: The result dict to upload
        s3_path: Path in S3/MinIO to upload to
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Convert result to JSON
        result_json = json.dumps(result)
        
        # Upload asynchronously
        loop = asyncio.get_event_loop()
        
        def _upload():
            s3_client = get_s3_client()
            s3_client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=s3_path,
                Body=result_json,
                ContentType='application/json'
            )
        
        await loop.run_in_executor(None, _upload)
        logger.info(f"Uploaded result to {s3_path}")
        return True
    except ClientError as e:
        logger.error(f"Error uploading result to S3: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error uploading result: {str(e)}")
        raise