#!/usr/bin/env python3
"""
Test script to verify connection to Supabase PostgreSQL database
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import DictCursor
import json

# Look for .env.production in current directory, parent directory, and root directory
if os.path.exists('.env.production'):
    load_dotenv('.env.production')
    print("Loaded .env.production from current directory")
elif os.path.exists('../.env.production'):
    load_dotenv('../.env.production')
    print("Loaded .env.production from parent directory")
elif os.path.exists('/Users/luzuko/Project_2025/sdk_next_react_version/.env.production'):
    load_dotenv('/Users/luzuko/Project_2025/sdk_next_react_version/.env.production')
    print("Loaded .env.production from root directory")
else:
    print("Error: .env.production file not found in current, parent, or root directory")
    sys.exit(1)

# Get database connection parameters
DB_TYPE = os.getenv("DB_TYPE")
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL is not set in .env.production")
    sys.exit(1)

if DB_TYPE != "postgres":
    print(f"Error: DB_TYPE is set to {DB_TYPE}, but should be 'postgres' for Supabase")
    sys.exit(1)

print(f"Testing connection to PostgreSQL database...")
print(f"DB_TYPE: {DB_TYPE}")
print(f"DATABASE_URL: {DATABASE_URL[:20]}...{DATABASE_URL[-20:] if len(DATABASE_URL) > 40 else ''}")

try:
    # Connect to database
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=DictCursor)
    cursor = conn.cursor()
    
    # Test connection with a simple query
    cursor.execute("SELECT current_database(), current_user, version();")
    db_info = cursor.fetchone()
    
    print("\nConnection successful!")
    print(f"Database: {db_info[0]}")
    print(f"User: {db_info[1]}")
    print(f"PostgreSQL version: {db_info[2][:50]}...\n")
    
    # List tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    
    tables = cursor.fetchall()
    print("Available tables:")
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"  - {table[0]}: {count} rows")
    
    # Close connection
    cursor.close()
    conn.close()
    
    print("\nDatabase connection test completed successfully!")
    sys.exit(0)
    
except Exception as e:
    print(f"\nError connecting to PostgreSQL: {e}")
    
    # Provide more detailed error information based on exception type
    if "password authentication failed" in str(e).lower():
        print("\nPossible causes:")
        print("  - Incorrect password in DATABASE_URL")
        print("  - User does not have permission to access the database")
    elif "could not connect to server" in str(e).lower():
        print("\nPossible causes:")
        print("  - Database server is not running")
        print("  - Incorrect host in DATABASE_URL")
        print("  - Network connectivity issues")
    elif "database" in str(e).lower() and "does not exist" in str(e).lower():
        print("\nPossible causes:")
        print("  - Database name in DATABASE_URL is incorrect")
        print("  - Database has not been created")
    
    print("\nPlease check your .env.production file and update DATABASE_URL with the correct connection string.")
    sys.exit(1)