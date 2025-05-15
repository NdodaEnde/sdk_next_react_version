"""
Simple connection test to verify Supabase PostgreSQL credentials
"""

import psycopg2
from psycopg2.extras import DictCursor
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.production')

# Get connection string
DATABASE_URL = os.environ.get("DATABASE_URL", "")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables")
    exit(1)

print(f"Testing connection to: {DATABASE_URL.split('@')[1]}")
print("(Connection string contains credentials, showing only server part)")

try:
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=DictCursor)
    cursor = conn.cursor()
    
    # Execute a simple test query
    cursor.execute("SELECT version()")
    version = cursor.fetchone()[0]
    print(f"✅ Connection successful! PostgreSQL version: {version}")
    
    # Show available tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = [row[0] for row in cursor.fetchall()]
    if tables:
        print(f"Tables in database: {', '.join(tables)}")
    else:
        print("No tables found in the public schema")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Connection error: {e}")