#\!/bin/bash

# Production mode environment script
# This script sets up the environment for production mode and runs the Flask server

# Set environment variables
export FLASK_ENV=production
export NODE_ENV=production
export DB_TYPE=postgres
export DEBUG=false

# Make sure the correct .env file is used
if [ -f .env.production ]; then
    echo "Using .env.production for environment variables"
    export $(grep -v '^#' .env.production | xargs)
else
    echo "Warning: .env.production not found, using default environment variables"
fi

# Quick test for database connectivity
echo "Testing database connection..."
python -c "
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.production')

# Test database connection
database_url = os.getenv('DATABASE_URL')
if not database_url:
    print('Error: DATABASE_URL not set')
    exit(1)

try:
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    cursor.execute('SELECT version()')
    version = cursor.fetchone()
    print(f'Connected to PostgreSQL: {version[0]}')
    cursor.close()
    conn.close()
except Exception as e:
    print(f'Error connecting to database: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    echo "Database connection test failed. Please check your connection settings."
    exit 1
fi

# Run the server
echo "Starting Flask server in production mode..."
python app.py
