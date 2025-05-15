"""
Fix duplicate organization_id code in database.py.
"""

import os
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("===== FIXING DUPLICATE CODE =====")

def fix_duplicate_code():
    """Fix duplicate organization_id initialization in database.py"""
    try:
        # Read database.py
        with open('database.py', 'r') as f:
            content = f.read()
        
        # First, make a backup
        backup_path = 'database.py.bak'
        with open(backup_path, 'w') as f:
            f.write(content)
        print(f"✅ Created backup of database.py at {backup_path}")
        
        # The code block we're looking for
        org_id_block_pattern = r"# Get a valid organization ID\s+organization_id = None\s+if DB_TYPE == \"postgres\" and os\.getenv\('NODE_ENV'\) == 'production':\s+try:\s+# Get the first organization from the database\s+org_cursor = conn\.cursor\(\)\s+org_cursor\.execute\(\"SELECT id FROM organizations LIMIT 1\"\)\s+org_result = org_cursor\.fetchone\(\)\s+if org_result:\s+organization_id = org_result\[0\]\s+org_cursor\.close\(\)\s+except Exception as e:\s+print\(f\"Error getting organization ID: \{e\}\"\)"
        
        # Count occurrences
        matches = re.findall(org_id_block_pattern, content)
        
        if len(matches) > 1:
            print(f"Found {len(matches)} duplicate organization_id code blocks")
            
            # The standard organization ID retrieval code
            org_id_code = """# Get a valid organization ID
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
            
            # Replace all occurrences with a function that does the retrieval
            get_org_id_function = '''
def get_valid_organization_id(conn):
    """Get a valid organization ID from the database for production use"""
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
    return organization_id

'''
            
            # Add the function definition after the imports
            import_section_end = content.find("def get_db_connection():")
            if import_section_end > 0:
                new_content = content[:import_section_end] + get_org_id_function + content[import_section_end:]
                
                # Now replace the organization_id blocks with function calls
                new_content = re.sub(org_id_block_pattern, "# Get a valid organization ID\n    organization_id = get_valid_organization_id(conn)", new_content)
                
                # Write the fixed content back to database.py
                with open('database.py', 'w') as f:
                    f.write(new_content)
                    
                print("✅ Fixed duplicate organization_id code in database.py")
                print("✅ Added get_valid_organization_id function")
                return True
            else:
                print("❌ Could not find appropriate place to add function")
                return False
        else:
            print("No duplicate organization_id code found (using regex pattern)")
            return False
    except Exception as e:
        print(f"❌ Error updating database.py: {e}")
        return False

# Execute the fix
if fix_duplicate_code():
    print("\n===== FIX APPLIED SUCCESSFULLY =====")
    print("The database.py file has been updated to remove duplicate code.")
    print("Please restart the Flask server for the changes to take effect.")
else:
    print("\n===== FIX FAILED =====")
    print("Please check the error messages above and fix the issues manually.")