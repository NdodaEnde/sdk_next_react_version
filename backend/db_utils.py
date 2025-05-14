"""
Database utility functions to help with common operations in both SQLite and PostgreSQL.
"""

import os
import uuid
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database module but avoid circular imports
import database

def fix_document_id(document_id, cursor, organization_id=None, user_id=None):
    """
    Convert document_id to the proper format for the current database.
    
    This can handle both filename-based document IDs (used in the frontend)
    and UUID-based document IDs (used in PostgreSQL).
    
    Args:
        document_id: The document ID (filename or UUID)
        cursor: Database cursor
        organization_id: Organization ID for new documents
        user_id: User ID for new documents
        
    Returns:
        The converted document_id suitable for the current database
    """
    if os.getenv('DB_TYPE') != 'postgres' or os.getenv('NODE_ENV') != 'production':
        # In SQLite or development, we just use the document_id as-is
        return document_id
    
    # For PostgreSQL in production, we need to handle UUID conversion
    # First, check if the document_id is already a valid UUID
    try:
        # Try to parse as UUID to see if it's valid
        uuid.UUID(document_id)
        # It's already a valid UUID, return as-is
        return document_id
    except (ValueError, TypeError):
        # Not a UUID, we need to look up or create one
        pass
    
    # Try to find by name first
    try:
        cursor.execute(
            "SELECT id FROM documents WHERE name = %s",
            (document_id,)
        )
        result = cursor.fetchone()
        if result:
            # Found a document with this name, return its UUID
            return result[0]
    except Exception as e:
        print(f"Error looking up document by name: {e}")
    
    # If we get here, we need to create a new document entry
    if organization_id and user_id and os.getenv('NODE_ENV') == 'production':
        doc_uuid = str(uuid.uuid4())
        try:
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
                    document_id,  # Use the provided document_id as name
                    f"/uploads/{document_id}",  # Simple path based on name
                    0,  # Placeholder size
                    'medical',  # Default type
                    'processed',  # Default status
                    user_id  # Use the provided user_id
                )
            )
            return cursor.fetchone()[0]
        except Exception as e:
            print(f"Error creating document entry: {e}")
    
    # If all else fails, generate a UUID for this document
    # This should rarely happen but ensures we have a fallback
    return str(uuid.uuid4())

def create_certificate(document_id, certificate_data, user_id, organization_id=None):
    """
    Create a new certificate record for the given document.
    
    This is a wrapper around save_certificate that handles document_id conversion.
    
    Args:
        document_id: The document ID (filename or UUID)
        certificate_data: Certificate data to save
        user_id: User ID who edited the certificate
        organization_id: Optional organization ID
        
    Returns:
        The ID of the new certificate record
    """
    # For production PostgreSQL, we need an organization_id
    if os.getenv('NODE_ENV') == 'production' and os.getenv('DB_TYPE') == 'postgres' and not organization_id:
        # Get a valid organization ID from the database
        conn = database.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM organizations LIMIT 1")
            org_result = cursor.fetchone()
            if org_result:
                organization_id = org_result[0]
                print(f"Using organization ID from database: {organization_id}")
            cursor.close()
        except Exception as e:
            print(f"Error getting organization ID: {e}")
        finally:
            conn.close()
    
    # If we still don't have an organization ID and we're in production, this will likely fail
    if os.getenv('NODE_ENV') == 'production' and os.getenv('DB_TYPE') == 'postgres' and not organization_id:
        print("Warning: No organization ID available for production PostgreSQL")
    
    conn = database.get_db_connection()
    cursor = conn.cursor()
    try:
        # Convert document_id if needed
        fixed_document_id = fix_document_id(
            document_id, cursor, organization_id, user_id
        )
        
        # Call database.save_certificate with the fixed document_id
        certificate_id = database.save_certificate(
            fixed_document_id, certificate_data, user_id, organization_id
        )
        
        return certificate_id
    finally:
        cursor.close()
        conn.close()

def get_certificate_data(document_id, user_id, organization_id=None):
    """
    Retrieve certificate data for the given document.
    
    This is a wrapper around get_certificate that handles document_id conversion.
    
    Args:
        document_id: The document ID (filename or UUID)
        user_id: User ID who viewed the certificate
        organization_id: Optional organization ID
        
    Returns:
        Certificate data dict or None if not found
    """
    # For production PostgreSQL, we need an organization_id
    if os.getenv('NODE_ENV') == 'production' and os.getenv('DB_TYPE') == 'postgres' and not organization_id:
        # Get a valid organization ID from the database
        conn = database.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM organizations LIMIT 1")
            org_result = cursor.fetchone()
            if org_result:
                organization_id = org_result[0]
                print(f"Using organization ID from database: {organization_id}")
            cursor.close()
        except Exception as e:
            print(f"Error getting organization ID: {e}")
        finally:
            conn.close()
    
    conn = database.get_db_connection()
    cursor = conn.cursor()
    try:
        # Convert document_id if needed
        fixed_document_id = fix_document_id(
            document_id, cursor, organization_id, user_id
        )
        
        # Call database.get_certificate with the fixed document_id
        return database.get_certificate(fixed_document_id, user_id)
    finally:
        cursor.close()
        conn.close()

def get_certificate_history_data(document_id, user_id, organization_id=None):
    """
    Retrieve certificate history for the given document.
    
    This is a wrapper around get_certificate_history that handles document_id conversion.
    
    Args:
        document_id: The document ID (filename or UUID)
        user_id: User ID who viewed the certificate
        organization_id: Optional organization ID
        
    Returns:
        List of certificate history entries or empty list if none found
    """
    # For production PostgreSQL, we need an organization_id
    if os.getenv('NODE_ENV') == 'production' and os.getenv('DB_TYPE') == 'postgres' and not organization_id:
        # Get a valid organization ID from the database
        conn = database.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM organizations LIMIT 1")
            org_result = cursor.fetchone()
            if org_result:
                organization_id = org_result[0]
                print(f"Using organization ID from database: {organization_id}")
            cursor.close()
        except Exception as e:
            print(f"Error getting organization ID: {e}")
        finally:
            conn.close()
    
    conn = database.get_db_connection()
    cursor = conn.cursor()
    try:
        # Convert document_id if needed
        fixed_document_id = fix_document_id(
            document_id, cursor, organization_id, user_id
        )
        
        # Call database.get_certificate_history with the fixed document_id
        return database.get_certificate_history(fixed_document_id, user_id)
    finally:
        cursor.close()
        conn.close()