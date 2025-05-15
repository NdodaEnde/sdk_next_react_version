"""
Fix remaining issues with database.py.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("===== FIXING FINAL DATABASE ISSUES =====")

def fix_database_issues():
    """Fix duplicate organization_id code and missing variables"""
    try:
        # Read database.py
        with open('database.py', 'r') as f:
            content = f.read()
        
        # First, make a backup
        backup_path = 'database.py.final.bak'
        with open(backup_path, 'w') as f:
            f.write(content)
        print(f"✅ Created backup of database.py at {backup_path}")
        
        # 1. Fix duplicate organization_id code in initialize_database
        duplicate_code = """    # Get a valid organization ID
    organization_id = None
    if DB_TYPE == "postgres" and os.getenv('NODE_ENV') == 'production':
        try:
            # Get the first organization from the database
            org_cursor = conn.cursor()
            org_cursor.execute("SELECT id FROM organizations LIMIT 1")
            org_result = org_cursor.fetchone()
            if org_result:
                organization_id = org_result[0]
            org_cursor.close()
        except Exception as e:
            print(f"Error getting organization ID: {e}")
    
    # Get a valid organization ID
    organization_id = None
    if DB_TYPE == "postgres" and os.getenv('NODE_ENV') == 'production':
        try:
            # Get the first organization from the database
            org_cursor = conn.cursor()
            org_cursor.execute("SELECT id FROM organizations LIMIT 1")
            org_result = org_cursor.fetchone()
            if org_result:
                organization_id = org_result[0]
            org_cursor.close()
        except Exception as e:
            print(f"Error getting organization ID: {e}")"""
        
        fixed_code = """    # Get a valid organization ID
    organization_id = None
    if DB_TYPE == "postgres" and os.getenv('NODE_ENV') == 'production':
        try:
            # Get the first organization from the database
            org_cursor = conn.cursor()
            org_cursor.execute("SELECT id FROM organizations LIMIT 1")
            org_result = org_cursor.fetchone()
            if org_result:
                organization_id = org_result[0]
            org_cursor.close()
        except Exception as e:
            print(f"Error getting organization ID: {e}")"""
        
        content = content.replace(duplicate_code, fixed_code)
        
        # 2. Fix "organization_id" reference in get_certificate and get_certificate_history functions
        # Add this code before each try block in those functions:
        
        org_code = """    # Get a valid organization ID
    organization_id = None
    if DB_TYPE == "postgres" and os.getenv('NODE_ENV') == 'production':
        try:
            # Get the first organization from the database
            org_cursor = conn.cursor()
            org_cursor.execute("SELECT id FROM organizations LIMIT 1")
            org_result = org_cursor.fetchone()
            if org_result:
                organization_id = org_result[0]
            org_cursor.close()
        except Exception as e:
            print(f"Error getting organization ID: {e}")"""
        
        # For get_certificate
        get_cert_old = """def get_certificate(document_id, user_id):
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
    
    try:"""
        
        get_cert_new = """def get_certificate(document_id, user_id):
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
    
    # Get a valid organization ID
    organization_id = None
    if DB_TYPE == "postgres" and os.getenv('NODE_ENV') == 'production':
        try:
            # Get the first organization from the database
            org_cursor = conn.cursor()
            org_cursor.execute("SELECT id FROM organizations LIMIT 1")
            org_result = org_cursor.fetchone()
            if org_result:
                organization_id = org_result[0]
            org_cursor.close()
        except Exception as e:
            print(f"Error getting organization ID: {e}")
    
    try:"""
        
        # For get_certificate_history
        get_hist_old = """def get_certificate_history(document_id, user_id):
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
    
    try:"""
        
        get_hist_new = """def get_certificate_history(document_id, user_id):
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
    
    # Get a valid organization ID
    organization_id = None
    if DB_TYPE == "postgres" and os.getenv('NODE_ENV') == 'production':
        try:
            # Get the first organization from the database
            org_cursor = conn.cursor()
            org_cursor.execute("SELECT id FROM organizations LIMIT 1")
            org_result = org_cursor.fetchone()
            if org_result:
                organization_id = org_result[0]
            org_cursor.close()
        except Exception as e:
            print(f"Error getting organization ID: {e}")
    
    try:"""
        
        # Apply all replacements
        content = content.replace(get_cert_old, get_cert_new)
        content = content.replace(get_hist_old, get_hist_new)
        
        # Write the updated content back to database.py
        with open('database.py', 'w') as f:
            f.write(content)
        
        print("✅ Fixed organization_id issues in database.py")
        return True
    except Exception as e:
        print(f"❌ Error updating database.py: {e}")
        return False

# Execute the fix
if fix_database_issues():
    print("\n===== FIX APPLIED SUCCESSFULLY =====")
    print("The application should now handle all database operations correctly.")
    print("Please restart the Flask server for the changes to take effect.")
else:
    print("\n===== FIX FAILED =====")
    print("Please check the error messages above and fix the issues manually.")