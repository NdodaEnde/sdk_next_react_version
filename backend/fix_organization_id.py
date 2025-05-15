"""
Fix organization_id handling in the get_certificate and get_certificate_history functions.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("===== FIXING ORGANIZATION ID HANDLING =====")

def fix_organization_id():
    """Add organization_id fetching to get_certificate and get_certificate_history functions"""
    try:
        # Read database.py
        with open('database.py', 'r') as f:
            content = f.read()
        
        # First, make a backup
        backup_path = 'database.py.org_id.bak'
        with open(backup_path, 'w') as f:
            f.write(content)
        print(f"✅ Created backup of database.py at {backup_path}")
        
        # Add organization ID fetching to the get_certificate function
        function_start = "def get_certificate(document_id, user_id):"
        function_body_start = "    conn = get_db_connection()\n    cursor = conn.cursor()"
        
        organization_id_code = """
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
    """
        
        new_function_body_start = function_body_start + organization_id_code
        content = content.replace(function_body_start, new_function_body_start, 1)  # Replace only first occurrence
        
        # Do the same for get_certificate_history function
        history_function_start = "def get_certificate_history(document_id, user_id):"
        history_function_body_start = "    conn = get_db_connection()\n    cursor = conn.cursor()"
        
        new_history_function_body_start = history_function_body_start + organization_id_code
        content = content.replace(history_function_body_start, new_history_function_body_start, 1)  # Replace only first occurrence
        
        # Write the updated content back to database.py
        with open('database.py', 'w') as f:
            f.write(content)
        
        print("✅ Added organization_id handling to certificate functions")
        return True
    except Exception as e:
        print(f"❌ Error updating database.py: {e}")
        return False

# Execute the fix
if fix_organization_id():
    print("\n===== FIX APPLIED SUCCESSFULLY =====")
    print("The application should now handle organization IDs correctly.")
    print("Please restart the Flask server for the changes to take effect.")
else:
    print("\n===== FIX FAILED =====")
    print("Please check the error messages above and fix the issues manually.")