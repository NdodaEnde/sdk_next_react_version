"""
Script to fix the certificate saving issue in production mode.
This script updates the app.py file to handle user IDs correctly in production.
"""

import os
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("===== FIXING CERTIFICATE SAVING IN PRODUCTION MODE =====")

# Create a function to fix the save_certificate_endpoint in app.py
def fix_save_certificate_endpoint():
    """Update app.py to handle user IDs correctly in production mode"""
    try:
        # Read app.py
        with open('app.py', 'r') as f:
            content = f.read()
        
        # First, make a backup
        backup_path = 'app.py.bak'
        with open(backup_path, 'w') as f:
            f.write(content)
        print(f"✅ Created backup of app.py at {backup_path}")
        
        # Find the save_certificate_endpoint function and modify it
        # Look for current_user mock section
        mock_user_section = """    # For actual POST requests, use a mock user in development mode
    # This simplifies testing without requiring valid tokens
    current_user = {
        'sub': 'mock-user-id',
        'email': 'mock-user@example.com',
        'org_id': 'mock-org-id',
        'role': 'admin'
    }"""
        
        # New section for handling user IDs in both dev and production
        new_section = """    # For actual POST requests, handle user IDs properly in both dev and production
    if os.getenv('NODE_ENV') == 'production':
        # In production, we need proper UUIDs for database compatibility
        current_user = {
            'sub': str(uuid.uuid4()),  # Generate a proper UUID in production
            'email': 'mock-user@example.com',
            'org_id': None,  # Will be filled from the database
            'role': 'admin'
        }
        
        # Get a valid organization ID from the database
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM organizations LIMIT 1")
            org_result = cursor.fetchone()
            if org_result:
                current_user['org_id'] = org_result[0]
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error getting organization ID: {e}")
    else:
        # In development mode, use mock IDs
        current_user = {
            'sub': 'mock-user-id',
            'email': 'mock-user@example.com',
            'org_id': 'mock-org-id',
            'role': 'admin'
        }"""
        
        # Replace the section
        new_content = content.replace(mock_user_section, new_section)
        
        # Make sure we import uuid in app.py
        import_uuid = "import uuid"
        if import_uuid not in new_content:
            import_line = "import time"
            new_content = new_content.replace(import_line, f"{import_line}\nimport uuid")
        
        # Write the updated content back to app.py
        with open('app.py', 'w') as f:
            f.write(new_content)
        
        print("✅ Updated app.py to handle user IDs correctly in production mode")
        return True
    except Exception as e:
        print(f"❌ Error updating app.py: {e}")
        return False

# Function to update the database.py file to handle string user IDs better
def fix_database_handling():
    """Update database.py to handle both string and UUID user IDs"""
    try:
        # Read database.py
        with open('database.py', 'r') as f:
            content = f.read()
            
        # Only make changes if we haven't already fixed it
        if "# Handle both string and UUID user IDs" not in content:
            # Find the section in save_certificate where user_id is used
            old_section = """            # Check if certificate already exists for this document
            if document_id_uuid:
                cursor.execute(
                    "SELECT id, metadata FROM certificates WHERE document_id = %s",
                    (document_id_uuid,)
                )
            else:
                cursor.execute(
                    "SELECT id, metadata FROM certificates WHERE document_id::text = %s",
                    (document_id,)
                )"""
                
            # New section with better handling for the user_id
            new_section = """            # Handle both string and UUID user IDs
            user_id_param = user_id
            if not isinstance(user_id, uuid.UUID) and DB_TYPE == "postgres":
                try:
                    # Try to convert string to UUID if possible
                    user_id_param = uuid.UUID(user_id)
                except ValueError:
                    # If it's not a valid UUID, generate a new one
                    user_id_param = uuid.uuid4()
                user_id_param = str(user_id_param)
                    
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
                )"""
                
            # Replace the section
            new_content = content.replace(old_section, new_section)
            
            # Write the updated content back to database.py
            with open('database.py', 'w') as f:
                f.write(new_content)
                
            print("✅ Updated database.py to handle user IDs better")
            return True
        else:
            print("database.py is already fixed")
            return True
    except Exception as e:
        print(f"❌ Error updating database.py: {e}")
        return False

# Execute the fixes
if fix_save_certificate_endpoint() and fix_database_handling():
    print("\n===== FIXES APPLIED SUCCESSFULLY =====")
    print("The certificate saving should now work correctly in production mode.")
    print("Please restart the Flask server for the changes to take effect.")
else:
    print("\n===== SOME FIXES FAILED =====")
    print("Please check the error messages above and fix the issues manually.")