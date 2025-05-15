"""
Debug script for certificate saving in production mode
"""

import os
import json
import uuid
import time
from dotenv import load_dotenv

# Load environment variables from .env
print("\n===== DEBUGGING CERTIFICATE SAVE FUNCTION =====")
print("Loading environment variables...")
load_dotenv()

# Print environment variables
print(f"NODE_ENV: {os.environ.get('NODE_ENV')}")
print(f"DB_TYPE: {os.environ.get('DB_TYPE')}")
print(f"DATABASE_URL: {'Set' if os.environ.get('DATABASE_URL') else 'Not set'}")

# Force production mode
os.environ["NODE_ENV"] = "production"
os.environ["DB_TYPE"] = "postgres"

# Import functions after setting environment variables
from database import (
    get_db_connection, 
    save_certificate, 
    get_certificate, 
    get_certificate_history,
    DB_TYPE,
    DATABASE_URL,
    generate_uuid
)

# Print database configuration
print("\nDatabase configuration:")
print(f"DB_TYPE from module: {DB_TYPE}")
print(f"DATABASE_URL from module: {'Set' if DATABASE_URL else 'Not set'}")

# Test database connection
print("\nTesting database connection...")
try:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    print("✅ Database connection successful")
    
    # Check tables structure
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'organizations'
        )
    """)
    orgs_exist = cursor.fetchone()[0]
    print(f"Organizations table exists: {orgs_exist}")
    
    if orgs_exist:
        # Get an existing organization ID
        cursor.execute("SELECT id FROM organizations LIMIT 1")
        org_result = cursor.fetchone()
        if org_result:
            org_id = org_result[0]
            print(f"Found organization with ID: {org_id}")
            
            # Get or create a test document
            cursor.execute("""
                SELECT id FROM documents 
                WHERE name LIKE 'Test Document%' 
                AND organization_id = %s 
                LIMIT 1
            """, (org_id,))
            doc_result = cursor.fetchone()
            
            if doc_result:
                doc_id = doc_result[0]
                print(f"Found existing test document with ID: {doc_id}")
            else:
                # Create a test document
                user_id = str(uuid.uuid4())
                doc_name = f"Test Document {int(time.time())}"
                cursor.execute("""
                    INSERT INTO documents (
                        id, organization_id, name, file_path, size, 
                        document_type, status, uploaded_by_id
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s
                    ) RETURNING id
                """, (
                    str(uuid.uuid4()), org_id, doc_name, 
                    "/tmp/test.pdf", 1024, "medical", 
                    "processed", user_id
                ))
                doc_id = cursor.fetchone()[0]
                conn.commit()
                print(f"Created new test document with ID: {doc_id}")
            
            # Now try saving a certificate with this document ID
            print("\nTesting save_certificate function...")
            try:
                # Use mock user ID as in app.py
                mock_user_id = 'mock-user-id'
                
                certificate_data = {
                    "name": "Test Patient",
                    "id_number": f"ID-{int(time.time())}",
                    "company": "Test Company",
                    "exam_date": "2025-05-15",
                    "expiry_date": "2026-05-15",
                    "fitnessDeclaration": "fit"
                }
                
                print("Raw document ID type:", type(doc_id))
                print("Raw document ID:", doc_id)
                
                print("User ID type:", type(mock_user_id))
                print("User ID:", mock_user_id)
                
                print("Organization ID type:", type(org_id))
                print("Organization ID:", org_id)
                
                # The actual save function
                certificate_id = save_certificate(
                    document_id=doc_id,
                    certificate_data=certificate_data,
                    user_id=mock_user_id,
                    organization_id=org_id
                )
                
                print(f"✅ Certificate saved successfully with ID: {certificate_id}")
                
            except Exception as e:
                print(f"❌ Error in save_certificate: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("No organizations found in the database")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ Database connection error: {e}")
    import traceback
    traceback.print_exc()

print("\n===== DEBUG COMPLETE =====")