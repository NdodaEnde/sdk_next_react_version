"""
Schema adaptation script to handle the differences between our code's expected schema 
and the actual Supabase schema.

This script creates view/function compatibility layers to make our existing code work
with the Supabase database structure.
"""

import os
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ensure we're using PostgreSQL
os.environ["DB_TYPE"] = "postgres"
os.environ["NODE_ENV"] = "production"

# Use DATABASE_URL from environment or override
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres.vzdepdxbdqvfpjzfuqfy:zyfwa0-pebzuc-gobGeh@aws-0-eu-central-1.pooler.supabase.com:5432/postgres")

def get_connection():
    """Get a connection to the Supabase PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            DATABASE_URL, 
            cursor_factory=DictCursor
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise

def check_table_exists(cursor, table_name):
    """Check if a table exists in the database"""
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = %s
        )
    """, (table_name,))
    return cursor.fetchone()[0]

def check_column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table"""
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = %s 
            AND column_name = %s
        )
    """, (table_name, column_name))
    return cursor.fetchone()[0]

def create_compatibility_layer(cursor):
    """Create necessary views/functions to adapt the Supabase schema to our code"""
    
    # Check if certificate_history table exists
    if not check_table_exists(cursor, 'certificate_history'):
        print("Creating certificate_history table...")
        # Create certificate_history table
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
        
        print("✅ certificate_history table created")
    else:
        print("certificate_history table already exists")
    
    # Check if patients table is compatible with our code
    if not check_column_exists(cursor, 'patients', 'id_number'):
        print("Adding compatibility view for id_number in patients table...")
        
        # Create a view for backward compatibility
        cursor.execute("""
            CREATE OR REPLACE VIEW patients_compat AS
            SELECT 
                id,
                name,
                identification_number AS id_number,
                organization_id,
                date_of_birth,
                metadata,
                created_at,
                updated_at
            FROM patients
        """)
        
        print("✅ patients_compat view created")
    else:
        print("patients table already has id_number column")
    
    # Check if documents table is compatible with our code
    if not check_column_exists(cursor, 'documents', 'filename'):
        print("Adding compatibility view for filename in documents table...")
        
        # Create a view for backward compatibility
        cursor.execute("""
            CREATE OR REPLACE VIEW documents_compat AS
            SELECT 
                id,
                organization_id,
                name AS filename,
                file_path,
                content_type,
                document_type,
                status,
                extracted_data,
                uploaded_by_id AS user_id,
                created_at,
                updated_at
            FROM documents
        """)
        
        print("✅ documents_compat view created")
    else:
        print("documents table already has filename column")
    
    # Check if certificates table is missing document_id
    has_document_id = check_column_exists(cursor, 'certificates', 'document_id')
    
    # Check if certificates table is compatible with our code
    if not check_column_exists(cursor, 'certificates', 'certificate_data'):
        print("Adding compatibility view for certificate_data in certificates table...")
        
        # Create a view for backward compatibility
        cursor.execute(f"""
            CREATE OR REPLACE VIEW certificates_compat AS
            SELECT 
                id,
                {'document_id,' if has_document_id else ''}
                organization_id,
                patient_id,
                metadata AS certificate_data,
                status,
                created_at,
                updated_at
            FROM certificates
        """)
        
        print("✅ certificates_compat view created")
    else:
        print("certificates table already has certificate_data column")
        
    print("Compatibility layer setup complete.")

def add_functions_and_triggers(cursor):
    """Add functions and triggers for keeping compatibility layer in sync with actual tables"""
    
    # Function to sync from main table to compat view (for read operations)
    # Note: Not needed as views are dynamic
    
    # Function to sync from compat view to main table (for write operations)
    cursor.execute("""
        CREATE OR REPLACE FUNCTION sync_certificate_insert() RETURNS TRIGGER AS $$
        BEGIN
            -- Insert into certificates table from the compatibility view
            INSERT INTO certificates (
                organization_id,
                patient_id,
                document_id,
                type,
                issue_date,
                expiry_date,
                status,
                issuer_name,
                metadata
            )
            SELECT
                NEW.organization_id,
                NEW.patient_id,
                NEW.document_id,
                'medical', -- Default type
                CURRENT_DATE, -- Default issue_date
                NULL, -- Default expiry_date
                NEW.status,
                'system', -- Default issuer_name
                NEW.certificate_data
            RETURNING id INTO NEW.id;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Check if trigger exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.triggers 
            WHERE trigger_name = 'certificates_compat_insert_trigger'
        )
    """)
    trigger_exists = cursor.fetchone()[0]
    
    if not trigger_exists:
        # Create trigger
        cursor.execute("""
            CREATE TRIGGER certificates_compat_insert_trigger
            INSTEAD OF INSERT ON certificates_compat
            FOR EACH ROW
            EXECUTE FUNCTION sync_certificate_insert();
        """)
        
        print("✅ Insert trigger for certificates_compat created")
    else:
        print("Insert trigger for certificates_compat already exists")
    
    print("Functions and triggers setup complete.")

def main():
    """Main function to set up the compatibility layer"""
    print("=" * 60)
    print("SUPABASE SCHEMA ADAPTATION SCRIPT")
    print("=" * 60)
    print(f"Target database: {DATABASE_URL[:30]}...")
    
    try:
        # Connect to database
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check connection
        cursor.execute("SELECT current_database(), current_user")
        db, user = cursor.fetchone()
        print(f"Connected to database: {db} as user: {user}")
        
        # Use autocommit for schema changes
        conn.autocommit = True
        
        try:
            # Create compatibility layer
            create_compatibility_layer(cursor)
            
            # Add sync functions and triggers
            add_functions_and_triggers(cursor)
            
            print("✅ All changes applied successfully")
        except Exception as e:
            print(f"❌ Error: {e}")
            raise
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"❌ Script execution failed: {e}")
        return
        
    print("\nSchema adaptation complete!")
    print("""
To use with your application code:
1. Make sure DB_TYPE=postgres is set in your .env file
2. Ensure DATABASE_URL points to your Supabase PostgreSQL database
3. Set NODE_ENV=production in your .env file
4. Update your database.py to use the compatibility views:
   - Change SQL queries to use *_compat tables where needed
   - Change column references as needed
""")

if __name__ == "__main__":
    main()