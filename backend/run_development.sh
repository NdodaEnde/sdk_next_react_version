#\!/bin/bash

# Development mode environment script
# This script sets up the environment for development mode and runs the Flask server

# Set environment variables
export FLASK_ENV=development
export NODE_ENV=development
export DB_TYPE=sqlite
export DEBUG=true

# Make sure .env.development is used if available
if [ -f .env.development ]; then
    echo "Using .env.development for environment variables"
    export $(grep -v '^#' .env.development | xargs)
else
    echo "Warning: .env.development not found, using default environment variables"
fi

# Create data directory if it doesn't exist
mkdir -p data

# Run the server
echo "Starting Flask server in development mode..."
python app.py
