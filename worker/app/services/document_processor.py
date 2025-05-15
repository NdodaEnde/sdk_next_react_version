import asyncio
import json
from typing import Any, Dict
import os
import tempfile
from pathlib import Path
import httpx
from loguru import logger
from landingai.pipeline import inference
from PIL import Image
import boto3
from botocore.exceptions import ClientError

from app.core.config import settings
from app.services.landing_ai import get_prediction_from_landingai
from app.utils.s3 import download_file_from_s3, upload_result_to_s3

async def process_document(job_data: Dict[str, Any]):
    """
    Process a document using LandingAI
    
    Expected job_data structure:
    {
        "type": "process",
        "documentId": "123",
        "organizationId": "456",
        "filePath": "documents/org_456/doc_123.pdf",
        "contentType": "application/pdf",
        "processingType": "certificate" | "medical_test" | "fitness_declaration"
    }
    """
    try:
        document_id = job_data.get("documentId")
        organization_id = job_data.get("organizationId")
        file_path = job_data.get("filePath")
        content_type = job_data.get("contentType")
        processing_type = job_data.get("processingType", "certificate")
        
        if not all([document_id, organization_id, file_path]):
            raise ValueError("Missing required job data fields")
            
        logger.info(f"Processing document {document_id} for organization {organization_id}")
        logger.info(f"File path: {file_path}, Content type: {content_type}, Processing type: {processing_type}")
        
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download file from S3/MinIO
            local_file_path = Path(temp_dir) / Path(file_path).name
            await download_file_from_s3(file_path, local_file_path)
            
            # Process with LandingAI based on document type
            result = await process_with_landingai(local_file_path, processing_type)
            
            # Upload result to S3/MinIO
            result_path = f"results/{organization_id}/{document_id}/analysis_result.json"
            await upload_result_to_s3(result, result_path)
            
            # Notify main application about the result
            await send_result_to_main_application(document_id, organization_id, result_path, result)
            
        logger.info(f"Document {document_id} processed successfully")
        return True
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        # Attempt to notify the main application about the failure
        try:
            if document_id and organization_id:
                await send_error_to_main_application(document_id, organization_id, str(e))
        except Exception as callback_error:
            logger.error(f"Failed to send error callback: {str(callback_error)}")
        raise

async def process_with_landingai(file_path: Path, processing_type: str) -> Dict[str, Any]:
    """Process a document with LandingAI based on the document type"""
    try:
        # Load the image
        image = Image.open(file_path)
        
        # Select the appropriate LandingAI model based on document type
        model_id = get_model_id_for_document_type(processing_type)
        
        # Get prediction from LandingAI
        prediction_result = await get_prediction_from_landingai(image, model_id)
        
        # Extract relevant data from the prediction
        extracted_data = extract_data_from_prediction(prediction_result, processing_type)
        
        return {
            "status": "success",
            "processingType": processing_type,
            "extractedData": extracted_data,
            "rawPrediction": prediction_result,
        }
    except Exception as e:
        logger.error(f"Error processing with LandingAI: {str(e)}")
        raise

def get_model_id_for_document_type(processing_type: str) -> str:
    """Return the appropriate LandingAI model ID for the document type"""
    # These would come from your actual LandingAI models
    model_map = {
        "certificate": "medical-certificate-model-12345",
        "medical_test": "medical-test-results-model-67890",
        "fitness_declaration": "fitness-declaration-model-24680",
    }
    
    return model_map.get(processing_type, model_map["certificate"])

def extract_data_from_prediction(prediction: Dict[str, Any], processing_type: str) -> Dict[str, Any]:
    """Extract structured data from the LandingAI prediction based on document type"""
    # This is a placeholder - you would implement specific extraction logic
    # based on your models and document types
    if processing_type == "certificate":
        return extract_certificate_data(prediction)
    elif processing_type == "medical_test":
        return extract_medical_test_data(prediction)
    elif processing_type == "fitness_declaration":
        return extract_fitness_declaration_data(prediction)
    else:
        return {"raw": prediction}

def extract_certificate_data(prediction: Dict[str, Any]) -> Dict[str, Any]:
    """Extract certificate data from the prediction"""
    # Placeholder implementation - you would implement specific extraction
    # based on your LandingAI model output format
    extracted = {
        "patientName": prediction.get("patientName", ""),
        "doctorName": prediction.get("doctorName", ""),
        "diagnoses": prediction.get("diagnoses", []),
        "issueDate": prediction.get("issueDate", ""),
        "expiryDate": prediction.get("expiryDate", ""),
        "certificateNumber": prediction.get("certificateNumber", "")
    }
    return extracted

def extract_medical_test_data(prediction: Dict[str, Any]) -> Dict[str, Any]:
    """Extract medical test data from the prediction"""
    # Placeholder implementation
    extracted = {
        "patientName": prediction.get("patientName", ""),
        "testType": prediction.get("testType", ""),
        "testDate": prediction.get("testDate", ""),
        "results": prediction.get("results", {}),
        "labName": prediction.get("labName", "")
    }
    return extracted

def extract_fitness_declaration_data(prediction: Dict[str, Any]) -> Dict[str, Any]:
    """Extract fitness declaration data from the prediction"""
    # Placeholder implementation
    extracted = {
        "personName": prediction.get("personName", ""),
        "declarationDate": prediction.get("declarationDate", ""),
        "fitnessLevel": prediction.get("fitnessLevel", ""),
        "restrictions": prediction.get("restrictions", []),
        "signedBy": prediction.get("signedBy", "")
    }
    return extracted

async def send_result_to_main_application(document_id: str, organization_id: str, 
                                         result_path: str, result: Dict[str, Any]):
    """Send the processing result back to the main application"""
    callback_url = settings.API_CALLBACK_URL
    
    payload = {
        "status": "success",
        "documentId": document_id,
        "organizationId": organization_id,
        "resultPath": result_path,
        "extractedData": result.get("extractedData", {})
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            callback_url,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            logger.error(f"Error sending result to main application: {response.text}")
            raise Exception(f"Failed to send result to main application: {response.status_code}")
        
        logger.info(f"Result sent successfully to main application for document {document_id}")

async def send_error_to_main_application(document_id: str, organization_id: str, error_message: str):
    """Send an error notification to the main application"""
    callback_url = settings.API_CALLBACK_URL
    
    payload = {
        "status": "error",
        "documentId": document_id,
        "organizationId": organization_id,
        "error": error_message
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                callback_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                logger.error(f"Error sending error notification: {response.text}")
            else:
                logger.info(f"Error notification sent for document {document_id}")
        except Exception as e:
            logger.error(f"Failed to send error notification: {str(e)}")