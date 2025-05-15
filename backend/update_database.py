"""
Update the database.py file to work with the Supabase PostgreSQL schema.
This script modifies our database.py to be compatible with the Supabase schema.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create a backup of the current database.py file
try:
    with open('/Users/luzuko/Project_2025/sdk_next_react_version/backend/database.py', 'r') as original:
        with open('/Users/luzuko/Project_2025/sdk_next_react_version/backend/database.py.bak', 'w') as backup:
            backup.write(original.read())
    print("Created backup at database.py.bak")
except Exception as e:
    print(f"Error creating backup: {e}")
    exit(1)

# The updated database.py content with embedded SQL for Supabase compatibility
updated_content = '''"""
Database connection and helper functions for the application.
Supports both SQLite for development and PostgreSQL for production.
Configured to work with Supabase's UUID-based schema.
"""

import os
import json
import time
import uuid
import sqlite3
import psycopg2
from psycopg2.extras import Json, DictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Default to SQLite for development, use PostgreSQL in production
DB_TYPE = os.getenv("DB_TYPE", "sqlite")
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Force PostgreSQL in production environment
if os.getenv("NODE_ENV") == "production":
    DB_TYPE = "postgres"
    
def generate_uuid():
    """
    Generate a UUID string compatible with Supabase UUID format
    
    Returns:
        str: A UUID string in the format expected by Supabase
    """
    return str(uuid.uuid4())

def get_db_connection():
    """
    Get database connection based on environment configuration
    """
    if DB_TYPE == "postgres":
        return get_postgres_connection()
    else:
        return get_sqlite_connection()

def get_postgres_connection():
    """
    Get PostgreSQL database connection
    
    Note: This connection is configured to work with Supabase's PostgreSQL,
    which uses UUID primary keys by default for better compatibility.
    """
    try:
        # Parse the DATABASE_URL for PostgreSQL connection
        if not DATABASE_URL:
            raise ValueError("DATABASE_URL environment variable is not set")
            
        # Add connection pool settings for production environment
        conn = psycopg2.connect(
            DATABASE_URL, 
            cursor_factory=DictCursor,
            # Connection pool settings for better performance in production
            connect_timeout=5,         # 5 seconds connect timeout
            keepalives=1,              # Keep connections alive
            keepalives_idle=60,        # Seconds between keepalives
            keepalives_interval=10,    # Seconds between retries
            keepalives_count=5         # Max retries
        )
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        if os.getenv("NODE_ENV") == "production":
            # In production, fail hard if PostgreSQL connection fails
            raise
        else:
            # In development, fallback to SQLite
            print("Falling back to SQLite database (development only)")
            return get_sqlite_connection()

def get_sqlite_connection():
    """
    Get SQLite database connection
    """
    try:
        # Create data directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
        conn = sqlite3.connect('data/app.db')
        # Enable dictionary cursor for SQLite
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"Error connecting to SQLite: {e}")
        raise

def initialize_database():
    """
    Initialize database tables if they don't exist
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # For SQLite, create the database schema
        if DB_TYPE == "sqlite":
            # Create certificates table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS certificates (
                    id TEXT PRIMARY KEY,
                    document_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    organization_id TEXT,
                    certificate_data TEXT NOT NULL,
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS certificate_history (
                    id TEXT PRIMARY KEY,
                    certificate_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    change_type TEXT NOT NULL,
                    previous_data TEXT,
                    new_data TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (certificate_id) REFERENCES certificates(id)
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS patients (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    id_number TEXT NOT NULL,
                    gender TEXT,
                    date_of_birth TEXT,
                    organization_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(id_number, organization_id)
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    organization_id TEXT,
                    patient_id TEXT,
                    document_type TEXT,
                    status TEXT DEFAULT 'processing',
                    s3_key TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (patient_id) REFERENCES patients(id)
                )
            """)
            
            # Create indexes for SQLite
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_certificates_document_id ON certificates(document_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_certificates_user_org ON certificates(user_id, organization_id)")
        else:
            # For PostgreSQL in production, we adapt to the existing Supabase schema
            # Create certificate_history table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS certificate_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    certificate_id UUID NOT NULL,
                    user_id UUID NOT NULL,
                    change_type TEXT NOT NULL,
                    previous_data JSONB,
                    new_data JSONB,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (certificate_id) REFERENCES certificates(id)
                )
            """)
            
            # Create index on certificate_id
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_certificate_history_certificate_id
                ON certificate_history(certificate_id)
            """)
            
        conn.commit()
        print("Database initialization complete")
    except Exception as e:
        print(f"Error initializing database: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def save_certificate(document_id, certificate_data, user_id, organization_id=None):
    """
    Save or update certificate data with history tracking
    
    Args:
        document_id: Identifier for the document
        certificate_data: Certificate data to save (dict)
        user_id: User ID who edited the certificate
        organization_id: Optional organization ID
        
    Returns:
        The ID of the inserted/updated certificate record
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # For SQLite - use the local schema
        if DB_TYPE == "sqlite":
            # First, try to extract patient information from certificate data
            patient_data = {}
            if certificate_data and isinstance(certificate_data, dict):
                patient_data = {
                    'name': certificate_data.get('name', ''),
                    'id_number': certificate_data.get('id_number', '')
                }
            
            # Store patient data if we have enough information and it's a new patient
            if patient_data.get('name') and patient_data.get('id_number'):
                try:
                    # Check if patient exists
                    cursor.execute(
                        "SELECT id FROM patients WHERE id_number = ? AND (organization_id = ? OR organization_id IS NULL)",
                        (patient_data['id_number'], organization_id)
                    )
                    
                    patient_result = cursor.fetchone()
                    patient_id = None
                    
                    if not patient_result:
                        # Insert new patient
                        patient_id = generate_uuid()
                        cursor.execute(
                            """
                            INSERT INTO patients (id, name, id_number, organization_id) 
                            VALUES (?, ?, ?, ?)
                            """,
                            (patient_id, patient_data['name'], patient_data['id_number'], organization_id)
                        )
                    else:
                        patient_id = patient_result[0]
                    
                    # Update document with patient_id if we created/found a patient
                    if patient_id:
                        cursor.execute(
                            """
                            UPDATE documents 
                            SET patient_id = ?, updated_at = CURRENT_TIMESTAMP 
                            WHERE filename = ? AND user_id = ?
                            """,
                            (patient_id, document_id, user_id)
                        )
                except Exception as e:
                    print(f"Warning: Could not process patient data: {e}")
                    # Continue with certificate save even if patient processing fails
            
            # Process certificate data
            previous_data = None
            certificate_id = None
            change_type = "create"
            
            # Convert dict to JSON string for SQLite
            certificate_data_json = json.dumps(certificate_data)
            
            # Check if certificate already exists
            cursor.execute(
                "SELECT id, certificate_data FROM certificates WHERE document_id = ? AND user_id = ?",
                (document_id, user_id)
            )
            result = cursor.fetchone()
            
            if result:
                # Get previous data for history
                certificate_id = result[0]
                previous_data = json.loads(result[1]) if result[1] else None
                change_type = "update"
                
                # Update existing certificate
                cursor.execute(
                    """
                    UPDATE certificates 
                    SET certificate_data = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                    """,
                    (certificate_data_json, certificate_id)
                )
            else:
                # Insert new certificate
                certificate_id = generate_uuid()
                cursor.execute(
                    """
                    INSERT INTO certificates (id, document_id, user_id, organization_id, certificate_data) 
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (certificate_id, document_id, user_id, organization_id, certificate_data_json)
                )
            
            # Record the change in history (SQLite)
            history_id = generate_uuid()
            previous_data_json = json.dumps(previous_data) if previous_data else None
            cursor.execute(
                """
                INSERT INTO certificate_history (id, certificate_id, user_id, change_type, previous_data, new_data) 
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (history_id, certificate_id, user_id, change_type, previous_data_json, certificate_data_json)
            )
        
        # For PostgreSQL - adapt to Supabase schema
        else:
            # First, try to extract patient information from certificate data
            patient_data = {}
            if certificate_data and isinstance(certificate_data, dict):
                patient_data = {
                    'name': certificate_data.get('name', ''),
                    'identification_number': certificate_data.get('id_number', '')
                }
            
            # Store patient data if we have enough information and it's a new patient
            if patient_data.get('name') and patient_data.get('identification_number'):
                try:
                    # Check if patient exists
                    cursor.execute(
                        "SELECT id FROM patients WHERE identification_number = %s AND organization_id = %s",
                        (patient_data['identification_number'], organization_id)
                    )
                    
                    patient_result = cursor.fetchone()
                    patient_id = None
                    
                    if not patient_result:
                        # Insert new patient
                        cursor.execute(
                            """
                            INSERT INTO patients (name, identification_number, organization_id) 
                            VALUES (%s, %s, %s) RETURNING id
                            """,
                            (patient_data['name'], patient_data['identification_number'], organization_id)
                        )
                        patient_id = cursor.fetchone()[0]
                    else:
                        patient_id = patient_result[0]
                    
                    # For Supabase schema, store the certificate with the patient ID
                    # We'll use this patient_id below when creating/updating the certificate
                except Exception as e:
                    print(f"Warning: Could not process patient data: {e}")
                    # Continue with certificate save even if patient processing fails
                    patient_id = None
            else:
                patient_id = None
            
            # Process certificate data
            previous_data = None
            certificate_id = None
            change_type = "create"
            
            # First check if document exists
            cursor.execute(
                "SELECT id FROM documents WHERE id = %s OR name = %s",
                (document_id, document_id)
            )
            document_result = cursor.fetchone()
            document_id_uuid = document_result[0] if document_result else None
            
            # Check if certificate already exists for this document
            if document_id_uuid:
                cursor.execute(
                    "SELECT id, metadata FROM certificates WHERE document_id = %s",
                    (document_id_uuid,)
                )
            else:
                cursor.execute(
                    "SELECT id, metadata FROM certificates WHERE document_id::text = %s",
                    (document_id,)
                )
                
            result = cursor.fetchone()
            
            if result:
                # Get previous data for history
                certificate_id = result[0]
                previous_data = result[1]
                change_type = "update"
                
                # Update existing certificate
                cursor.execute(
                    """
                    UPDATE certificates 
                    SET metadata = %s, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = %s RETURNING id
                    """,
                    (Json(certificate_data), certificate_id)
                )
                certificate_id = cursor.fetchone()[0]
            else:
                # Insert new certificate with appropriate fields
                cursor.execute(
                    """
                    INSERT INTO certificates (
                        organization_id, patient_id, document_id, type,
                        issue_date, status, issuer_name, metadata
                    ) 
                    VALUES (%s, %s, %s, %s, CURRENT_DATE, %s, %s, %s) RETURNING id
                    """,
                    (
                        organization_id, 
                        patient_id, 
                        document_id_uuid if document_id_uuid else document_id,
                        'medical',  # Default type 
                        'active',   # Default status
                        'system',   # Default issuer
                        Json(certificate_data)
                    )
                )
                certificate_id = cursor.fetchone()[0]
            
            # Record the change in history
            history_id = generate_uuid()
            cursor.execute(
                """
                INSERT INTO certificate_history (id, certificate_id, user_id, change_type, previous_data, new_data) 
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (history_id, certificate_id, user_id, change_type, Json(previous_data) if previous_data else None, Json(certificate_data))
            )
        
        conn.commit()
        print(f"Certificate saved successfully with ID: {certificate_id}")
        return certificate_id
        
    except Exception as e:
        conn.rollback()
        print(f"Error saving certificate: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def get_certificate(document_id, user_id):
    """
    Get certificate data by document ID and user ID
    
    Args:
        document_id: Identifier for the document
        user_id: User ID who edited the certificate
        
    Returns:
        Certificate data dict or None if not found
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if DB_TYPE == "postgres":
            # First check if document exists
            cursor.execute(
                "SELECT id FROM documents WHERE id = %s OR name = %s",
                (document_id, document_id)
            )
            document_result = cursor.fetchone()
            document_id_uuid = document_result[0] if document_result else None
            
            # Try to find certificate by document_id
            if document_id_uuid:
                cursor.execute(
                    "SELECT metadata FROM certificates WHERE document_id = %s",
                    (document_id_uuid,)
                )
            else:
                cursor.execute(
                    "SELECT metadata FROM certificates WHERE document_id::text = %s",
                    (document_id,)
                )
        else:
            cursor.execute(
                "SELECT certificate_data FROM certificates WHERE document_id = ? AND user_id = ?",
                (document_id, user_id)
            )
            
        result = cursor.fetchone()
        
        if result:
            # Return the certificate data
            if DB_TYPE == "postgres":
                return result[0]
            else:
                # For SQLite, parse the JSON string
                return json.loads(result[0])
        
        return None
        
    except Exception as e:
        print(f"Error retrieving certificate: {e}")
        return None
    finally:
        cursor.close()
        conn.close()

def get_certificate_history(document_id, user_id):
    """
    Get history of changes for a certificate by document ID and user ID
    
    Args:
        document_id: Identifier for the document
        user_id: User ID who edited the certificate
        
    Returns:
        List of certificate history entries with timestamps, or empty list if none found
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if DB_TYPE == "postgres":
            # First check if document exists
            cursor.execute(
                "SELECT id FROM documents WHERE id = %s OR name = %s",
                (document_id, document_id)
            )
            document_result = cursor.fetchone()
            document_id_uuid = document_result[0] if document_result else None
            
            # First get the certificate_id
            if document_id_uuid:
                cursor.execute(
                    "SELECT id FROM certificates WHERE document_id = %s",
                    (document_id_uuid,)
                )
            else:
                cursor.execute(
                    "SELECT id FROM certificates WHERE document_id::text = %s",
                    (document_id,)
                )
        else:
            cursor.execute(
                "SELECT id FROM certificates WHERE document_id = ? AND user_id = ?",
                (document_id, user_id)
            )
            
        cert_result = cursor.fetchone()
        
        if not cert_result:
            return []
            
        certificate_id = cert_result[0]
        
        # Get history entries for this certificate
        if DB_TYPE == "postgres":
            cursor.execute(
                """
                SELECT 
                    id, 
                    change_type, 
                    previous_data, 
                    new_data, 
                    timestamp 
                FROM 
                    certificate_history 
                WHERE 
                    certificate_id = %s 
                ORDER BY 
                    timestamp DESC
                """,
                (certificate_id,)
            )
        else:
            cursor.execute(
                """
                SELECT 
                    id, 
                    change_type, 
                    previous_data, 
                    new_data, 
                    timestamp 
                FROM 
                    certificate_history 
                WHERE 
                    certificate_id = ? 
                ORDER BY 
                    timestamp DESC
                """,
                (certificate_id,)
            )
            
        history = []
        for row in cursor.fetchall():
            history_entry = {
                "id": row[0],
                "change_type": row[1],
                "timestamp": row[4]
            }
            
            # Process previous_data and new_data based on database type
            if DB_TYPE == "postgres":
                history_entry["previous_data"] = row[2] if row[2] else None
                history_entry["new_data"] = row[3] if row[3] else None
            else:
                # For SQLite, parse the JSON strings
                history_entry["previous_data"] = json.loads(row[2]) if row[2] else None
                history_entry["new_data"] = json.loads(row[3]) if row[3] else None
                
            history.append(history_entry)
        
        return history
        
    except Exception as e:
        print(f"Error retrieving certificate history: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

# Initialize database when module is loaded
initialize_database()
'''

# Write the updated content to database.py
try:
    with open('/Users/luzuko/Project_2025/sdk_next_react_version/backend/database.py', 'w') as f:
        f.write(updated_content)
    print("✅ Successfully updated database.py")
except Exception as e:
    print(f"Error updating database.py: {e}")
    exit(1)

print("""
======================================================
Database update completed successfully!
======================================================

The database.py file has been updated to work with Supabase's
PostgreSQL database schema. This update includes:

1. Support for UUID primary keys to match Supabase
2. Compatibility with the existing Supabase table structure
3. Proper handling of certificate metadata field
4. Creation of certificate_history table if needed
5. Adaptation of SQL queries for PostgreSQL compatibility

To use this in production:
1. Make sure NODE_ENV=production is set in your environment
2. Ensure DATABASE_URL is set to your Supabase connection string
3. Set DB_TYPE=postgres in your .env file

The original database.py was backed up to database.py.bak
""")