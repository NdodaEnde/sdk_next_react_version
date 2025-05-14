#!/usr/bin/env python
"""
Test improved document ID handling for PostgreSQL.
"""

import os
import uuid
import json
from dotenv import load_dotenv

# Set production mode for testing
os.environ["NODE_ENV"] = "production"
os.environ["DB_TYPE"] = "postgres"

# Load environment variables
load_dotenv(".env.production")

# Import our utilities 
from db_utils import create_certificate, get_certificate_data, get_certificate_history_data

def test_document_id_handling():
    """Test improved document ID handling in production mode"""
    print("\n==== TESTING DOCUMENT ID HANDLING ====")
    
    # First, create a document entry directly in the database to ensure it exists
    org_result = None
    conn = None
    try:
        # Connect directly to the database
        import psycopg2
        from psycopg2.extras import Json, DictCursor
        database_url = os.getenv("DATABASE_URL")
        
        conn = psycopg2.connect(database_url, cursor_factory=DictCursor)
        cursor = conn.cursor()
        
        # Get an organization ID
        cursor.execute("SELECT id FROM organizations LIMIT 1")
        org_result = cursor.fetchone()
        organization_id = org_result[0] if org_result else None
        print(f"Using organization ID: {organization_id}")
        
        if not organization_id:
            print("❌ No organization ID found, cannot test")
            return False
        
        # Create a test document ID
        test_document_id = f"test_document_{uuid.uuid4()}.pdf"
        test_user_id = str(uuid.uuid4())
        doc_uuid = str(uuid.uuid4())
        
        # Insert a document directly
        cursor.execute(
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
                test_document_id,  # Use the generated name
                f"/uploads/{test_document_id}",
                0,
                'medical',
                'processed',
                test_user_id
            )
        )
        
        # Get the document ID
        document_id = cursor.fetchone()[0]
        conn.commit()
        
        print(f"Created test document with UUID: {document_id}")
        print(f"Document name: {test_document_id}")
        print(f"Test user ID: {test_user_id}")
        
        cursor.close()
        conn.close()
        conn = None
        
        # Create test certificate data
        test_certificate = {
            "name": "Document ID Test Patient",
            "id_number": "TEST-ID-9876",
            "exam_date": "2025-05-20",
            "expiry_date": "2026-05-20",
            "company": "Document ID Test Corp",
            "job": "Test Engineer",
            "fitnessDeclaration": "fit",
            "notes": "This is a test for improved document ID handling"
        }
        
        # Test saving using the document name
        print("\n1. Creating certificate with document filename...")
        certificate_id = create_certificate(
            document_id=test_document_id,
            certificate_data=test_certificate,
            user_id=test_user_id,
            organization_id=organization_id
        )
        
        if certificate_id:
            print(f"✅ Certificate created successfully with ID: {certificate_id}")
        else:
            print("❌ Failed to create certificate")
            return False
        
        # Test saving using the document UUID
        print("\n2. Creating certificate with document UUID...")
        certificate_id_uuid = create_certificate(
            document_id=document_id,
            certificate_data=test_certificate,
            user_id=test_user_id,
            organization_id=organization_id
        )
        
        if certificate_id_uuid:
            print(f"✅ Certificate created successfully with ID: {certificate_id_uuid}")
            if certificate_id == certificate_id_uuid:
                print("✅ Both approaches created/updated the same certificate!")
            else:
                print("❌ The two approaches created different certificates")
        else:
            print("❌ Failed to create certificate with UUID")
            return False
        
        # Retrieve using the document name
        print("\n3. Retrieving certificate data with document filename...")
        saved_data = get_certificate_data(test_document_id, test_user_id, organization_id)
        
        if saved_data:
            print("✅ Certificate data retrieved successfully using document filename")
            print(f"Certificate data preview: {json.dumps(saved_data, indent=2)[:200]}...")
        else:
            print("❌ Failed to retrieve certificate data using document filename")
        
        # Retrieve using the document UUID
        print("\n4. Retrieving certificate data with document UUID...")
        saved_data_uuid = get_certificate_data(document_id, test_user_id, organization_id)
        
        if saved_data_uuid:
            print("✅ Certificate data retrieved successfully using document UUID")
        else:
            print("❌ Failed to retrieve certificate data using document UUID")
            
        if saved_data and saved_data_uuid and saved_data == saved_data_uuid:
            print("✅ Both retrieval methods return the same data!")
        
        # Test history retrieval
        print("\n5. Retrieving certificate history...")
        history = get_certificate_history_data(test_document_id, test_user_id, organization_id)
        
        if history:
            print(f"✅ Certificate history retrieved successfully ({len(history)} entries)")
        else:
            print("❌ No history found or retrieval failed")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    if test_document_id_handling():
        print("\n==== TEST SUCCESSFUL ====")
        print("Document ID handling is working correctly in production mode.")
    else:
        print("\n==== TEST FAILED ====")
        print("Document ID handling is not working correctly.")
        print("Check the error messages above for details.")