from fastapi import APIRouter, Body, HTTPException, Depends, File, UploadFile, Form
from typing import Dict, Any, Optional
from pydantic import BaseModel
import json
from loguru import logger

from app.services.document_processor import process_document
from app.models.document import DocumentProcessRequest

router = APIRouter()

class ManualProcessRequest(BaseModel):
    """Request model for manually triggering document processing"""
    documentId: str
    organizationId: str
    filePath: str
    contentType: Optional[str] = None
    processingType: Optional[str] = "certificate"

@router.post("/process")
async def manually_process_document(request: ManualProcessRequest) -> Dict[str, Any]:
    """
    Manually trigger document processing
    
    This endpoint allows for manual triggering of document processing
    without going through the queue for testing or reprocessing.
    """
    try:
        # Create a job structure similar to what would come from the queue
        job_data = {
            "type": "process",
            "documentId": request.documentId,
            "organizationId": request.organizationId,
            "filePath": request.filePath,
            "contentType": request.contentType or "application/pdf",
            "processingType": request.processingType
        }
        
        # Process the document
        await process_document(job_data)
        
        return {
            "status": "success",
            "message": f"Document {request.documentId} processed successfully"
        }
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )
        
@router.post("/upload-and-process")
async def upload_and_process_document(
    document: UploadFile = File(...),
    document_id: str = Form(...),
    organization_id: str = Form(...),
    processing_type: str = Form("certificate")
) -> Dict[str, Any]:
    """
    Upload a document and process it
    
    This endpoint provides a convenient way to test document processing
    by uploading a file directly and processing it in one step.
    """
    try:
        from app.utils.s3 import get_s3_client
        import tempfile
        from pathlib import Path
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            # Write the uploaded file to the temporary file
            content = await document.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Upload to S3/MinIO
        s3_client = get_s3_client()
        s3_path = f"documents/{organization_id}/{document_id}/{document.filename}"
        s3_client.upload_file(
            temp_file_path,
            Bucket=document.S3_BUCKET_NAME,
            Key=s3_path
        )
        
        # Clean up temporary file
        Path(temp_file_path).unlink()
        
        # Create a job structure
        job_data = {
            "type": "process",
            "documentId": document_id,
            "organizationId": organization_id,
            "filePath": s3_path,
            "contentType": document.content_type,
            "processingType": processing_type
        }
        
        # Process the document
        await process_document(job_data)
        
        return {
            "status": "success",
            "message": f"Document {document_id} uploaded and processed successfully",
            "s3Path": s3_path
        }
    except Exception as e:
        logger.error(f"Error uploading and processing document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading and processing document: {str(e)}"
        )