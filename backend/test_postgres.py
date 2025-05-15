"""
Test script to verify PostgreSQL connection with Supabase.
Forces PostgreSQL mode regardless of environment settings.
"""

import os
import json
import time
import psycopg2
from psycopg2.extras import DictCursor

# Set environment variables for PostgreSQL
os.environ["DB_TYPE"] = "postgres"
os.environ["NODE_ENV"] = "production"
os.environ["DATABASE_URL"] = "postgresql://postgres.vzdepdxbdqvfpjzfuqfy:zyfwa0-pebzuc-gobGeh@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Now import from database
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

def test_direct_connection():
    """Test direct PostgreSQL connection to Supabase"""
    print("Testing direct PostgreSQL connection to Supabase...")
    connection_string = os.environ["DATABASE_URL"]
    
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            connection_string,
            cursor_factory=DictCursor
        )
        cursor = conn.cursor()
        
        # Execute a simple query
        cursor.execute("SELECT current_database(), current_user")
        db, user = cursor.fetchone()
        print(f"✅ Direct connection successful!")
        print(f"   Connected to database: {db} as user: {user}")
        
        # Check for extensions
        cursor.execute("SELECT extname FROM pg_extension")
        extensions = [row[0] for row in cursor.fetchall()]
        print(f"   Database extensions: {', '.join(extensions)}")
        
        # Check version
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        print(f"   PostgreSQL version: {version}")
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Direct PostgreSQL connection error: {e}")
        return False

def test_db_module_connection():
    """Test connection through database module"""
    print("\nTesting connection through database module...")
    try:
        # Check environment variables first
        print(f"Environment variables:")
        print(f"   DB_TYPE: {os.environ.get('DB_TYPE')}")
        print(f"   NODE_ENV: {os.environ.get('NODE_ENV')}")
        print(f"   DATABASE_URL: {os.environ.get('DATABASE_URL', 'Not set')[:20]}...")
        
        # Get module variables
        print(f"Module variables:")
        print(f"   DB_TYPE: {DB_TYPE}")
        print(f"   DATABASE_URL: {DATABASE_URL[:20]}..." if DATABASE_URL else "   DATABASE_URL: Not set")
        
        # Connect using module
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Execute a simple query
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        if result and result[0] == 1:
            print("✅ Module connection successful")
        else:
            print("❌ Module connection test failed")
            
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Module connection error: {e}")
        return False

def test_certificates_table():
    """Test certificates table in PostgreSQL"""
    print("\nTesting certificates table structure...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'certificates'
            )
        """)
        table_exists = cursor.fetchone()[0]
        
        if table_exists:
            print("✅ Certificates table exists")
            
            # Check table structure
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'certificates'
                ORDER BY ordinal_position
            """)
            
            columns = cursor.fetchall()
            print("   Table structure:")
            for col in columns:
                print(f"     - {col[0]}: {col[1]}")
                
                # Check if id column is UUID type
                if col[0] == 'id' and col[1] == 'uuid':
                    print("   ✅ id column is UUID type")
                elif col[0] == 'id' and col[1] != 'uuid':
                    print(f"   ❌ id column is {col[1]} type, expected UUID")
        else:
            print("❌ Certificates table does not exist")
            
            # Try to create it
            print("   Initializing database to create tables...")
            initialize_database()
            
            # Check again
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'certificates'
                )
            """)
            table_exists = cursor.fetchone()[0]
            
            if table_exists:
                print("✅ Certificates table created successfully")
            else:
                print("❌ Failed to create certificates table")
                
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Table test error: {e}")
        return False

def test_certificate_operations():
    """Test certificate operations"""
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
        "fitnessDeclaration": "fit"
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
        return True
    except Exception as e:
        print(f"❌ Certificate operation error: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("POSTGRESQL CONNECTION TEST SCRIPT")
    print("=" * 60)
    
    # Run tests
    direct_ok = test_direct_connection()
    
    if direct_ok:
        module_ok = test_db_module_connection()
        
        if module_ok:
            table_ok = test_certificates_table()
            
            if table_ok:
                test_certificate_operations()
                
    print("\nTest completed.")

if __name__ == "__main__":
    main()