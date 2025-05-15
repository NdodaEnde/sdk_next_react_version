import asyncio
import json
from typing import Any, Dict, Callable
import redis.asyncio as redis
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.document_processor import process_document

# Type alias for job handler functions
JobHandler = Callable[[Dict[str, Any]], Any]

# Job type to handler mapping
JOB_HANDLERS = {
    "process": process_document,
    # Add more job types and handlers as needed
}

async def get_redis_connection():
    """Get an async Redis connection"""
    return redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        db=settings.REDIS_DB,
        decode_responses=True
    )

@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=4, max=60))
async def setup_queue_listeners():
    """Setup listeners for the document processing queue"""
    try:
        # Connect to Redis
        redis_client = await get_redis_connection()
        logger.info(f"Connected to Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        
        # Start the queue listeners
        asyncio.create_task(listen_to_bull_queue(redis_client, settings.DOCUMENT_QUEUE_NAME))
        logger.info(f"Started listening to queue: {settings.DOCUMENT_QUEUE_NAME}")
        
        return True
    except Exception as e:
        logger.error(f"Failed to setup queue listeners: {str(e)}")
        raise

async def listen_to_bull_queue(redis_client: redis.Redis, queue_name: str):
    """Listen to a Bull queue and process jobs"""
    logger.info(f"Listening to Bull queue: {queue_name}")
    
    # Bull stores jobs in several Redis keys
    queue_key = f"bull:{queue_name}:wait"
    active_key = f"bull:{queue_name}:active"
    
    while True:
        try:
            # Get the next job from the wait list
            job_id = await redis_client.rpoplpush(queue_key, active_key)
            
            if job_id:
                # Get the job data
                job_key = f"bull:{queue_name}:{job_id}"
                job_data_raw = await redis_client.hget(job_key, "data")
                
                if job_data_raw:
                    job_data = json.loads(job_data_raw)
                    logger.info(f"Processing job {job_id} of type {job_data.get('type', 'unknown')}")
                    
                    # Get the job type and dispatch to the appropriate handler
                    job_type = job_data.get("type")
                    if job_type in JOB_HANDLERS:
                        handler = JOB_HANDLERS[job_type]
                        try:
                            # Process the job
                            await handler(job_data)
                            
                            # Mark job as completed
                            await redis_client.hset(job_key, "status", "completed")
                            logger.info(f"Job {job_id} completed successfully")
                        except Exception as e:
                            # Mark job as failed
                            await redis_client.hset(job_key, "status", "failed")
                            await redis_client.hset(job_key, "failedReason", str(e))
                            logger.error(f"Job {job_id} failed: {str(e)}")
                    else:
                        logger.warning(f"Unknown job type: {job_type}")
                        await redis_client.hset(job_key, "status", "failed")
                        await redis_client.hset(job_key, "failedReason", f"Unknown job type: {job_type}")
                    
                    # Move job from active to completed or failed
                    await redis_client.lrem(active_key, 0, job_id)
                    await redis_client.rpush(f"bull:{queue_name}:completed", job_id)
            else:
                # No jobs, wait a bit
                await asyncio.sleep(1)
        except Exception as e:
            logger.error(f"Error processing queue: {str(e)}")
            await asyncio.sleep(5)  # Wait a bit before retrying