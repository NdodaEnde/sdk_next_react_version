#!/bin/bash
# Production deployment script for certificate management backend
# This script prepares and deploys the backend to run with the Supabase PostgreSQL database

# Stop script on error
set -e

echo "===== Certificate Management Backend Production Deployment ====="
echo "Setting up production environment..."

# Create a backup of the current database.py file if it doesn't exist
if [ ! -f "./database.py.bak" ]; then
  echo "Creating backup of database.py..."
  cp database.py database.py.bak
fi

# Make sure we use the production .env file
echo "Setting up production environment variables..."
cp .env.production .env

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  echo "Activating virtual environment..."
  source venv/bin/activate
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Initialize the database for production
echo "Initializing database with PostgreSQL schema..."
# Create a simple test script to initialize the database
cat > init_db.py << EOL
import os
from database import initialize_database

# Force production mode
os.environ["NODE_ENV"] = "production"
os.environ["DB_TYPE"] = "postgres"

# Initialize database
initialize_database()
print("Database initialized for production")
EOL

# Run the initialization script
python init_db.py

# Clean up
rm init_db.py

echo "===== Deployment Complete ====="
echo "The backend is now configured to use Supabase PostgreSQL database."
echo "To start the server in production mode, run:"
echo "   python app.py"
echo ""
echo "To revert to development mode:"
echo "   cp .env.development .env"
echo ""