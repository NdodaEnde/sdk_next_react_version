"""
Fix document_id handling in database.py to properly support non-UUID filenames.
"""

import os
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("===== FIXING DOCUMENT ID HANDLING =====")

def fix_document_id_handling():
    """Fix document_id handling for non-UUID filenames in database.py"""
    try:
        # Read database.py
        with open('database.py', 'r') as f:
            content = f.read()
        
        # First, make a backup
        backup_path = 'database.py.doc_id.bak'
        with open(backup_path, 'w') as f:
            f.write(content)
        print(f"✅ Created backup of database.py at {backup_path}")
        
        # Function to check if document is UUID
        check_document_uuid_function = '''
def document_id_to_uuid(cursor, document_id, organization_id, user_id):
    """
    Handle document_id conversion to UUID for PostgreSQL
    
    Tries to find an existing document by ID or name, or creates a new one if needed.
    
    Args:
        cursor: Database cursor
        document_id: The document ID or name to find
        organization_id: Organization ID for new documents
        user_id: User ID for new documents
        
    Returns:
        A tuple of (document_id_uuid, created) where document_id_uuid is the UUID
        of the document in the database, and created is a boolean indicating if
        a new document was created.
    """
    document_id_uuid = None
    created = False
    
    # First, check if the document_id is a valid UUID string
    document_id_is_uuid = False
    
    try:
        # Try to parse as UUID to see if it's valid
        test_uuid = uuid.UUID(document_id)
        document_id_is_uuid = True
        document_id_uuid = document_id
    except ValueError:
        # Not a UUID, will need to look up by name or create new
        document_id_is_uuid = False
    
    # Try to find the document
    try:
        if document_id_is_uuid:
            # If it's a UUID, try direct lookup
            cursor.execute(
                "SELECT id FROM documents WHERE id = %s",
                (document_id,)
            )
        else:
            # If not a UUID, try to find by name
            cursor.execute(
                "SELECT id FROM documents WHERE name = %s",
                (document_id,)
            )
        
        document_result = cursor.fetchone()
        if document_result:
            document_id_uuid = document_result[0]
        else:
            # If no result, create a new document in production mode
            if os.getenv('NODE_ENV') == 'production':
                # Create a document entry for this filename
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
                    document_id_uuid = cursor.fetchone()[0]
                    created = True
                    print(f"Created document entry with UUID: {document_id_uuid}")
                except Exception as doc_err:
                    print(f"Error creating document: {doc_err}")
                    # Continue without a document reference
    except Exception as e:
        # Handle exceptions
        print(f"Error checking for document: {e}")
    
    return document_id_uuid, created

'''
        
        # Add document_id_to_uuid function and replace document ID handling in save_certificate
        if "def document_id_to_uuid(" not in content:
            # Add our function after imports but before first function
            import_end_idx = content.find("def get_db_connection()")
            if import_end_idx > 0:
                # Insert our function just before the first function definition
                new_content = content[:import_end_idx] + check_document_uuid_function + content[import_end_idx:]
                
                # Fix document ID handling in all three locations - we'll do this manually
                # Write the modified content back to database.py
                with open('database.py', 'w') as f:
                    f.write(new_content)
                    
                print("✅ Added document_id_to_uuid function")
                print("✅ Now manually fix the three document ID handling locations")
                
                # Print instructions for manual fixes
                print("""
To complete the fix, you need to manually replace the document ID handling code in three locations:
1. In save_certificate - Search for "# First check if document exists" in the PostgreSQL section
2. In get_certificate - Search for "# First check if document exists" in the PostgreSQL section  
3. In get_certificate_history - Search for "# First check if document exists" in the PostgreSQL section

Replace each of these blocks with:

            # Handle document ID conversion for PostgreSQL
            document_id_uuid, doc_created = document_id_to_uuid(cursor, document_id, organization_id, user_id)
            if doc_created:
                # If we created a new document, commit the transaction to avoid conflicts
                conn.commit()
                """)
                
                return True
            else:
                print("❌ Could not find appropriate place to add function")
                return False
        else:
            print("Function document_id_to_uuid already exists")
            return False
            
    except Exception as e:
        print(f"❌ Error updating database.py: {e}")
        return False

# Execute the fix
if fix_document_id_handling():
    print("\n===== FIX APPLIED SUCCESSFULLY =====")
    print("The document_id_to_uuid function has been added to database.py")
    print("Please complete the manual steps described above.")
    print("Then restart the Flask server for the changes to take effect.")
else:
    print("\n===== FIX FAILED =====")
    print("Please check the error messages above and fix the issues manually.")
EOF < /dev/null