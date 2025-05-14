"""
Test certificate saving functionality in production mode with improved document ID handling.
"""

import os
import json
import uuid
import psycopg2
from psycopg2.extras import Json, DictCursor
from dotenv import load_dotenv

# Set production mode for testing
os.environ["NODE_ENV"] = "production"
os.environ["DB_TYPE"] = "postgres"

# Load environment variables
load_dotenv(".env.production")

# Direct database connection for setup
DATABASE_URL = os.getenv("DATABASE_URL")

def direct_db_execute(query, params=None, fetch=False):
    """Execute a query directly on the database"""
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=DictCursor)
        cursor = conn.cursor()
        cursor.execute(query, params)
        result = cursor.fetchone() if fetch else None
        conn.commit()
        return result
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error in direct_db_execute: {e}")
        raise
    finally:
        if conn:
            conn.close()

def ensure_document_exists(document_id, organization_id):
    """Ensure a document exists in the database before testing"""
    try:
        # First check if document already exists
        result = direct_db_execute(
            "SELECT id FROM documents WHERE name = %s", 
            (document_id,), 
            fetch=True
        )
        
        if result:
            print(f"Document already exists with ID: {result[0]}")
            return result[0]
        
        # Create a new document
        doc_uuid = str(uuid.uuid4())
        result = direct_db_execute(
            """
            INSERT INTO documents (
                id, organization_id, name, file_path, size,
                document_type, status, uploaded_by_id
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id
            """,
            (
                doc_uuid,
                organization_id,
                document_id,  # Use the provided document_id as name
                f"/uploads/{document_id}",  # Simple path based on name
                0,  # Placeholder size
                'medical',  # Default type
                'processed',  # Default status
                'system'  # Default user
            ),
            fetch=True
        )
        
        print(f"Created document with ID: {result[0]}")
        return result[0]
    except Exception as e:
        print(f"Error ensuring document exists: {e}")
        return None

# Import database functions - do this after setting up environment variables
from database import save_certificate, get_certificate, get_db_connection

def test_save_certificate():
    """Test saving a certificate in production mode"""
    print("==== TESTING CERTIFICATE SAVE IN PRODUCTION MODE ====")
    
    # Generate test data
    test_document_id = f"certificate_test_{uuid.uuid4()}.pdf"
    test_user_id = str(uuid.uuid4())
    
    # Get a valid organization ID from the database
    org_result = direct_db_execute("SELECT id FROM organizations LIMIT 1", fetch=True)
    organization_id = org_result[0] if org_result else None
    print(f"Using organization ID: {organization_id}")
    
    if not organization_id:
        print("❌ No organization ID found, cannot test")
        return False
    
    # Make sure the document exists in the database first
    document_uuid = ensure_document_exists(test_document_id, organization_id)
    if not document_uuid:
        print("❌ Failed to create document in database, cannot continue")
        return False
    
    print(f"Using document with UUID: {document_uuid}")
    
    # Create test certificate data
    test_certificate = {
        "name": "Test Patient",
        "id_number": "TEST12345678",
        "exam_date": "2025-05-15",
        "expiry_date": "2026-05-15",
        "company": "Test Company",
        "job": "Software Developer",
        "fitnessDeclaration": "fit",
        "medicalExams": {
            "blood": True,
            "vision": True,
            "hearing": True
        }
    }
    
    print(f"Saving certificate for document: {test_document_id}")
    
    try:
        # Now try two approaches:
        # 1. First with the filename as document_id
        certificate_id_by_name = save_certificate(
            document_id=test_document_id,
            certificate_data=test_certificate,
            user_id=test_user_id,
            organization_id=organization_id
        )
        
        print(f"✅ Certificate saved successfully with ID: {certificate_id_by_name}")
        
        # 2. Then with the UUID as document_id 
        certificate_id_by_uuid = save_certificate(
            document_id=document_uuid,
            certificate_data=test_certificate,
            user_id=test_user_id,
            organization_id=organization_id
        )
        
        print(f"✅ Certificate saved successfully with ID: {certificate_id_by_uuid}")
        
        # Verify the two are the same
        if certificate_id_by_name == certificate_id_by_uuid:
            print("✅ Both approaches saved to the same certificate record!")
        else:
            print("❌ The two approaches saved to different certificate records.")
        
        # Try to retrieve the saved certificate
        saved_data = get_certificate(test_document_id, test_user_id)
        
        if saved_data:
            print("✅ Certificate retrieved successfully")
            print(f"Certificate data: {json.dumps(saved_data, indent=2)}")
            return True
        else:
            print("❌ Failed to retrieve certificate")
            return False
            
    except Exception as e:
        print(f"❌ Error in certificate test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if test_save_certificate():
        print("\n==== TEST SUCCESSFUL ====")
        print("The certificate save functionality is working properly in production mode.")
    else:
        print("\n==== TEST FAILED ====")
        print("The certificate save functionality is not working correctly.")
        print("Check the error messages above for details.")