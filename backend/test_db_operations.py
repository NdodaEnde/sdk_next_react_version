"""
Test script to verify database operations with Supabase PostgreSQL database.
This script tests the database connection and certificate operations.
"""

import os
import json
import time
from dotenv import load_dotenv
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

# Load environment variables
load_dotenv()

def test_database_connection():
    """Test database connection"""
    print("Testing database connection...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if we can execute a simple query
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        if result and result[0] == 1:
            print("✅ Database connection successful")
            print(f"   Using database type: {DB_TYPE}")
            if DB_TYPE == "postgres":
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

def test_initialize_database():
    """Test database initialization"""
    print("\nTesting database initialization...")
    try:
        initialize_database()
        print("✅ Database initialization successful")
        
        # Check if tables were created
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if DB_TYPE == "postgres":
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
        else:
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table'
                ORDER BY name
            """)
            
        tables = [row[0] for row in cursor.fetchall()]
        print(f"   Tables in database: {', '.join(tables)}")
        
        # Check certificates table structure
        if DB_TYPE == "postgres":
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'certificates'
                ORDER BY ordinal_position
            """)
            columns = [(row[0], row[1]) for row in cursor.fetchall()]
            print("   Certificates table structure:")
            for col, dtype in columns:
                print(f"     - {col}: {dtype}")
                # Check if id is UUID type
                if col == 'id' and dtype == 'uuid':
                    print("   ✅ Certificate id field is UUID type as expected")
                    
            # Check certificate_history table structure
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'certificate_history'
                ORDER BY ordinal_position
            """)
            columns = [(row[0], row[1]) for row in cursor.fetchall()]
            print("   Certificate_history table structure:")
            for col, dtype in columns:
                print(f"     - {col}: {dtype}")
                # Check if certificate_id is UUID type
                if col == 'certificate_id' and dtype == 'uuid':
                    print("   ✅ Certificate_history.certificate_id field is UUID type as expected")
        else:
            print("   SQLite doesn't support detailed schema inspection")
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        return False

def test_certificate_operations():
    """Test certificate CRUD operations"""
    print("\nTesting certificate operations...")
    
    # Test data
    document_id = f"test-doc-{int(time.time())}"
    user_id = "test-user-id"
    org_id = "test-org-id"
    certificate_data = {
        "name": "John Doe",
        "id_number": "1234567890",
        "company": "Test Company",
        "exam_date": "2025-01-01",
        "expiry_date": "2026-01-01",
        "job": "Software Engineer",
        "fitnessDeclaration": "fit",
        "medicalExams": {
            "blood": True,
            "vision": True,
            "hearing": True,
            "lung": True
        }
    }
    
    try:
        # Save certificate
        print(f"Saving certificate for document_id: {document_id}")
        certificate_id = save_certificate(
            document_id=document_id,
            certificate_data=certificate_data,
            user_id=user_id,
            organization_id=org_id
        )
        
        print(f"✅ Certificate saved with ID: {certificate_id}")
        
        # Get certificate
        print("Retrieving certificate...")
        retrieved_certificate = get_certificate(document_id, user_id)
        
        if retrieved_certificate:
            print("✅ Certificate retrieved successfully")
            print(f"   Certificate data: {json.dumps(retrieved_certificate, indent=2)}")
            
            # Verify data integrity
            if retrieved_certificate.get('name') == certificate_data['name']:
                print("✅ Certificate data integrity verified")
            else:
                print("❌ Certificate data integrity check failed - data doesn't match")
                
            # Update certificate
            print("Updating certificate...")
            updated_data = certificate_data.copy()
            updated_data['name'] = "Jane Doe"
            updated_data['exam_date'] = "2025-02-01"
            
            updated_certificate_id = save_certificate(
                document_id=document_id,
                certificate_data=updated_data,
                user_id=user_id,
                organization_id=org_id
            )
            
            print(f"✅ Certificate updated with ID: {updated_certificate_id}")
            
            # Get certificate history
            print("Retrieving certificate history...")
            history = get_certificate_history(document_id, user_id)
            
            if history:
                print(f"✅ Certificate history retrieved with {len(history)} entries")
                for i, entry in enumerate(history):
                    print(f"   History entry {i+1}:")
                    print(f"     - ID: {entry['id']}")
                    print(f"     - Change type: {entry['change_type']}")
                    print(f"     - Timestamp: {entry['timestamp']}")
            else:
                print("❌ Certificate history retrieval failed or no history found")
        else:
            print("❌ Certificate retrieval failed")
            
        return True
    except Exception as e:
        print(f"❌ Certificate operations error: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 50)
    print("DATABASE OPERATIONS TEST SCRIPT")
    print("=" * 50)
    print(f"Environment: {os.getenv('NODE_ENV', 'development')}")
    print(f"Database Type: {DB_TYPE}")
    print(f"Database URL: {'PostgreSQL Connection' if DATABASE_URL else 'No PostgreSQL URL configured'}")
    print("=" * 50)
    
    # Run tests
    connection_ok = test_database_connection()
    if connection_ok:
        init_ok = test_initialize_database()
        if init_ok:
            test_certificate_operations()
            
    print("\nTest completed.")

if __name__ == "__main__":
    main()