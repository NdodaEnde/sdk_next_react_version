from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class DocumentProcessRequest(BaseModel):
    """Request model for document processing"""
    document_id: str = Field(..., description="Unique identifier for the document")
    organization_id: str = Field(..., description="Organization ID the document belongs to")
    file_path: str = Field(..., description="Path to the document in S3/MinIO")
    content_type: Optional[str] = Field(None, description="MIME type of the document")
    processing_type: str = Field("certificate", description="Type of processing to perform")

class ExtractedData(BaseModel):
    """Base model for extracted document data"""
    raw_text: Optional[str] = Field(None, description="Raw text extracted from the document")
    
class CertificateData(ExtractedData):
    """Model for medical certificate data"""
    patient_name: Optional[str] = Field(None, description="Patient name")
    doctor_name: Optional[str] = Field(None, description="Doctor name")
    diagnoses: Optional[List[str]] = Field(None, description="List of diagnoses")
    issue_date: Optional[str] = Field(None, description="Certificate issue date")
    expiry_date: Optional[str] = Field(None, description="Certificate expiry date")
    certificate_number: Optional[str] = Field(None, description="Certificate number")

class MedicalTestData(ExtractedData):
    """Model for medical test data"""
    patient_name: Optional[str] = Field(None, description="Patient name")
    test_type: Optional[str] = Field(None, description="Type of medical test")
    test_date: Optional[str] = Field(None, description="Date of the test")
    results: Optional[Dict[str, Any]] = Field(None, description="Test results")
    lab_name: Optional[str] = Field(None, description="Name of the lab")

class FitnessDeclarationData(ExtractedData):
    """Model for fitness declaration data"""
    person_name: Optional[str] = Field(None, description="Person name")
    declaration_date: Optional[str] = Field(None, description="Declaration date")
    fitness_level: Optional[str] = Field(None, description="Fitness level")
    restrictions: Optional[List[str]] = Field(None, description="Restrictions or limitations")
    signed_by: Optional[str] = Field(None, description="Signatory name")