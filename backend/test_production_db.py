"""
Test script to verify the PostgreSQL connection in production mode
This script forces production mode and tests the database connection
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
    get_certificate_history,
    DB_TYPE,
    DATABASE_URL,
    generate_uuid
)

def test_database_connection():
    """Test database connection in production mode"""
    print("\nTesting database connection...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if we can execute a simple query
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        if result and result[0] == 1:
            print("✅ Database connection successful")
            print(f"   Using database type: {DB_TYPE}")
            cursor.execute("SELECT current_database(), current_user")
            db, user = cursor.fetchone()
            print(f"   Connected to database: {db} as user: {user}")
                
            # Check if the database has the pgcrypto extension
            cursor.execute("SELECT extname FROM pg_extension WHERE extname = 'pgcrypto'")
            pgcrypto = cursor.fetchone()
            if pgcrypto:
                print("   pgcrypto extension is installed (required for UUID generation)")
            else:
                print("⚠️ pgcrypto extension is not installed! This is required for UUID generation.")
        else:
            print("❌ Database connection test failed")
            
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

def test_certificate_tables():
    """Test certificate tables in production mode"""
    print("\nTesting certificate tables...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check certificates table
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'certificates'
            )
        """)
        certificates_exist = cursor.fetchone()[0]
        
        if certificates_exist:
            print("✅ Certificates table exists")
            # Check table structure
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public'
                AND table_name = 'certificates'
                ORDER BY ordinal_position
            """)
            columns = cursor.fetchall()
            print("   Columns in certificates table:")
            for col in columns:
                print(f"     - {col[0]}: {col[1]}")
        else:
            print("❌ Certificates table not found")
        
        # Check certificate_history table
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'certificate_history'
            )
        """)
        history_exists = cursor.fetchone()[0]
        
        if history_exists:
            print("✅ Certificate_history table exists")
        else:
            print("❌ Certificate_history table not found")
            print("   Attempting to create certificate_history table...")
            initialize_database()
            
            # Check again
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'certificate_history'
                )
            """)
            history_exists = cursor.fetchone()[0]
            
            if history_exists:
                print("✅ Certificate_history table created successfully")
            else:
                print("❌ Failed to create certificate_history table")
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error testing certificate tables: {e}")
        return False

def create_test_document():
    """Create a test document in the database"""
    print("Creating test document...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate test data
        doc_id = str(uuid.uuid4())
        org_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Insert a test document
        cursor.execute("""
            INSERT INTO documents (
                id, 
                organization_id, 
                name, 
                file_path, 
                size, 
                document_type, 
                status, 
                uploaded_by_id
            ) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            doc_id, 
            org_id, 
            f"Test Document {int(time.time())}", 
            "/tmp/test.pdf", 
            1024, 
            "medical", 
            "processed", 
            user_id
        ))
        
        doc_id = cursor.fetchone()[0]
        conn.commit()
        
        print(f"✅ Test document created with ID: {doc_id}")
        cursor.close()
        conn.close()
        
        return {
            "document_id": doc_id,
            "organization_id": org_id,
            "user_id": user_id
        }
    except Exception as e:
        print(f"❌ Error creating test document: {e}")
        return None

def test_save_certificate():
    """Test saving a certificate in production mode"""
    print("\nTesting certificate save operation...")
    
    # First create a test document
    test_doc = create_test_document()
    if not test_doc:
        print("❌ Skipping certificate save test due to document creation failure")
        return False
    
    # Generate test data
    document_id = test_doc["document_id"]
    user_id = test_doc["user_id"]
    org_id = test_doc["organization_id"]
    certificate_data = {
        "name": "Test Patient",
        "id_number": f"ID-{int(time.time())}",
        "company": "Test Company",
        "exam_date": "2025-01-01",
        "expiry_date": "2026-01-01",
        "fitnessDeclaration": "fit",
        "medicalExams": {
            "blood": True,
            "vision": True,
            "hearing": True,
            "lung": True
        }
    }
    
    try:
        print(f"Saving certificate for document_id: {document_id}")
        
        # Save certificate
        certificate_id = save_certificate(
            document_id=document_id,
            certificate_data=certificate_data,
            user_id=user_id,
            organization_id=org_id
        )
        
        print(f"✅ Certificate saved with ID: {certificate_id}")
        
        # Retrieve certificate
        print("Retrieving saved certificate...")
        retrieved_certificate = get_certificate(document_id, user_id)
        
        if retrieved_certificate:
            print("✅ Certificate retrieved successfully")
            
            # Check data integrity
            if retrieved_certificate.get('name') == certificate_data['name']:
                print("✅ Certificate data integrity verified")
            else:
                print(f"❌ Data mismatch: expected '{certificate_data['name']}', got '{retrieved_certificate.get('name')}'")
                
            # Get history
            history = get_certificate_history(document_id, user_id)
            
            if history and len(history) > 0:
                print(f"✅ Certificate history retrieved with {len(history)} entries")
            else:
                print("❌ Certificate history not found")
                
            return True
        else:
            print("❌ Failed to retrieve saved certificate")
            return False
            
    except Exception as e:
        print(f"❌ Error testing certificate save: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("PRODUCTION DATABASE TEST SCRIPT")
    print("=" * 60)
    print(f"Environment mode: {os.getenv('NODE_ENV', 'development')}")
    print(f"Database type: {DB_TYPE}")
    print(f"Database URL: {DATABASE_URL[:30]}...")
    
    # Run tests
    connection_ok = test_database_connection()
    
    if connection_ok:
        tables_ok = test_certificate_tables()
        
        if tables_ok:
            save_ok = test_save_certificate()
            
    print("\nTest completed.")
    
if __name__ == "__main__":
    main()