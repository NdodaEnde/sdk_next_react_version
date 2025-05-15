"""
Final test script to verify the complete production database flow
"""

import os
import json
import time
import uuid
from dotenv import load_dotenv

# Load production environment variables
print("Loading production environment...")
load_dotenv('.env.production')

# Force production mode
os.environ["NODE_ENV"] = "production"
os.environ["DB_TYPE"] = "postgres"

# Import database functions after setting environment variables
from database import (
    get_db_connection, 
    initialize_database, 
    save_certificate, 
    get_certificate, 
    get_certificate_history
)

def test_save_and_retrieve():
    """Test the complete flow of saving and retrieving a certificate"""
    print("\n===== TESTING COMPLETE CERTIFICATE FLOW =====")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. First, get an existing organization ID
        print("Looking for an existing organization...")
        cursor.execute("SELECT id FROM organizations LIMIT 1")
        result = cursor.fetchone()
        
        if not result:
            print("❌ No organizations found in the database")
            print("Creating a test organization...")
            org_name = f"Test Organization {int(time.time())}"
            cursor.execute(
                """
                INSERT INTO organizations (name, slug) 
                VALUES (%s, %s) RETURNING id
                """,
                (org_name, org_name.lower().replace(" ", "-"))
            )
            org_id = cursor.fetchone()[0]
            conn.commit()
        else:
            org_id = result[0]
            
        print(f"✅ Using organization with ID: {org_id}")
        
        # 2. Create a test document
        print("\nCreating a test document...")
        doc_name = f"Test Document {int(time.time())}"
        user_id = str(uuid.uuid4())  # Create a test user ID
        
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
                str(uuid.uuid4()), org_id, doc_name, 
                "/tmp/test.pdf", 1024, "medical", 
                "processed", user_id
            )
        )
        doc_id = cursor.fetchone()[0]
        conn.commit()
        print(f"✅ Created test document with ID: {doc_id}")
        
        # 3. Create a test certificate
        print("\nCreating a test certificate...")
        certificate_data = {
            "name": "John Doe",
            "id_number": f"ID-{int(time.time())}",
            "company": "ABC Corporation",
            "exam_date": "2025-05-15",
            "expiry_date": "2026-05-15",
            "job": "Software Engineer",
            "fitnessDeclaration": "fit",
            "medicalExams": {
                "blood": True,
                "vision": True,
                "hearing": True,
                "lung": True
            }
        }
        
        # Save the certificate
        certificate_id = save_certificate(
            document_id=doc_id,
            certificate_data=certificate_data,
            user_id=user_id,
            organization_id=org_id
        )
        print(f"✅ Created test certificate with ID: {certificate_id}")
        
        # 4. Retrieve the certificate
        print("\nRetrieving the certificate...")
        retrieved_certificate = get_certificate(doc_id, user_id)
        
        if retrieved_certificate:
            print("✅ Successfully retrieved certificate:")
            print(f"   Name: {retrieved_certificate.get('name')}")
            print(f"   ID Number: {retrieved_certificate.get('id_number')}")
            print(f"   Company: {retrieved_certificate.get('company')}")
        else:
            print("❌ Failed to retrieve certificate")
            
        # 5. Update the certificate
        print("\nUpdating the certificate...")
        updated_data = certificate_data.copy()
        updated_data["company"] = "Updated Corporation"
        updated_data["job"] = "Senior Engineer"
        
        updated_id = save_certificate(
            document_id=doc_id,
            certificate_data=updated_data,
            user_id=user_id,
            organization_id=org_id
        )
        print(f"✅ Updated certificate with ID: {updated_id}")
        
        # 6. Get certificate history
        print("\nRetrieving certificate history...")
        history = get_certificate_history(doc_id, user_id)
        
        if history and len(history) > 0:
            print(f"✅ Successfully retrieved history with {len(history)} entries")
            for i, entry in enumerate(history):
                print(f"   History entry {i+1}:")
                print(f"     - Change type: {entry['change_type']}")
                print(f"     - Timestamp: {entry['timestamp']}")
        else:
            print("❌ Failed to retrieve certificate history")
        
        cursor.close()
        conn.close()
        
        print("\n===== TEST COMPLETED SUCCESSFULLY =====")
        return True
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        return False

if __name__ == "__main__":
    # Initialize the database first
    print("Initializing database...")
    initialize_database()
    
    # Run the complete test
    test_save_and_retrieve()