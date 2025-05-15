"""
Fix remaining issues with database.py.
"""

import os
import re
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
        
        # Remove duplicate organization_id initialization in initialize_database
        start_pattern = "def initialize_database():"
        end_pattern = "    try:"
        
        # Extract the content between the patterns
        start_index = content.find(start_pattern)
        end_index = content.find(end_pattern, start_index)
        
        if start_index >= 0 and end_index >= 0:
            function_head = content[start_index:end_index]
            
            # If we find two org_id initialization blocks, keep only one
            if function_head.count("# Get a valid organization ID") > 1:
                print("Found duplicate organization_id code, fixing...")
                
                # Split the content at the function definition
                before = content[:start_index]
                after = content[end_index:]
                
                # Create a new version with only one org_id block
                org_id_code = """    # Get a valid organization ID
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
                
                # Create the fixed function head
                fixed_function_head = "def initialize_database():\n    \"\"\"\n    Initialize database tables if they don't exist\n    \"\"\"\n    conn = get_db_connection()\n    cursor = conn.cursor()\n    \n" + org_id_code
                
                # Put it all back together
                content = before + fixed_function_head + after
        
        # Find places where organization_id is referenced but not defined
        if "organization_id" in content:
            # Add organization_id initialization to get_certificate
            cert_function = "def get_certificate(document_id, user_id):"
            
            # Initialize in get_certificate
            cert_try_marker = "    try:\n        if DB_TYPE == \"postgres\":"
            
            # Check if we have org_id initialization in get_certificate
            if content.find(cert_function) > 0 and content.find("# Get a valid organization ID", content.find(cert_function), content.find(cert_try_marker, content.find(cert_function))) < 0:
                # Insert the org_id initialization code
                insert_index = content.find(cert_try_marker, content.find(cert_function))
                org_id_code = """
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
                content = content[:insert_index] + org_id_code + content[insert_index:]
                print("✅ Added organization_id initialization to get_certificate")
            
            # Initialize in get_certificate_history
            hist_function = "def get_certificate_history(document_id, user_id):"
            hist_try_marker = "    try:\n        if DB_TYPE == \"postgres\":"
            
            # Check if we have org_id initialization in get_certificate_history
            if content.find(hist_function) > 0 and content.find("# Get a valid organization ID", content.find(hist_function), content.find(hist_try_marker, content.find(hist_function))) < 0:
                # Insert the org_id initialization code
                insert_index = content.find(hist_try_marker, content.find(hist_function))
                org_id_code = """
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
                content = content[:insert_index] + org_id_code + content[insert_index:]
                print("✅ Added organization_id initialization to get_certificate_history")
        
        # Write the updated content back to database.py
        with open('database.py', 'w') as f:
            f.write(content)
        
        print("✅ Fixed organization_id issues in database.py")
        return True
    except Exception as e:
        print(f"❌ Error updating database.py: {e}")
        import traceback
        traceback.print_exc()
        return False

# Execute the fix
if fix_database_issues():
    print("\n===== FIX APPLIED SUCCESSFULLY =====")
    print("The application should now handle all database operations correctly.")
    print("Please restart the Flask server for the changes to take effect.")
else:
    print("\n===== FIX FAILED =====")
    print("Please check the error messages above and fix the issues manually.")