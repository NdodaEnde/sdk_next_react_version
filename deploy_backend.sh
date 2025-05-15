#!/bin/bash
set -e

# Medical Certificates Backend Deployment Script
echo "🚀 Starting backend deployment process..."

# 1. Check if Python and pip are installed
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# 2. Create or activate virtual environment
echo "Setting up virtual environment..."
if [ ! -d "backend/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv backend/venv
fi

source backend/venv/bin/activate

# 3. Install production dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

# 4. Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️ Warning: .env.production file not found. Using template..."
    # Create a template .env.production file
    echo "DB_TYPE=postgres" > .env.production
    echo "DATABASE_URL=postgresql://username:password@localhost:5432/medical_certificates" >> .env.production
    echo "PORT=8003" >> .env.production
    echo "NODE_ENV=production" >> .env.production
    echo "JWT_SECRET=change_this_to_a_secure_random_string" >> .env.production
    echo "⚠️ Please edit .env.production with your actual database credentials!"
fi

# 5. Copy .env.production to backend folder
echo "Copying environment variables..."
cp .env.production backend/.env.production

# 6. Run database migrations
echo "Initializing database..."
cd backend
python -c "from database import initialize_database; initialize_database()"
cd ..

# 7. Check if systemd is available for service setup
if command -v systemctl &> /dev/null; then
    echo "Setting up systemd service..."
    # Create systemd service file
    sudo tee /etc/systemd/system/medical-certificates.service > /dev/null << EOF
[Unit]
Description=Medical Certificates API Server
After=network.target postgresql.service

[Service]
User=$(whoami)
WorkingDirectory=$(pwd)/backend
ExecStart=$(pwd)/backend/venv/bin/python $(pwd)/backend/start_production.py
Restart=always
RestartSec=10
Environment=PYTHONPATH=$(pwd)

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    sudo systemctl daemon-reload
    
    # Enable and start service
    sudo systemctl enable medical-certificates
    sudo systemctl restart medical-certificates
    
    echo "✅ Service started successfully!"
    echo "Check status with: sudo systemctl status medical-certificates"
else
    echo "Systemd not available. Starting server directly..."
    cd backend
    nohup python start_production.py > ../server.log 2>&1 &
    echo "✅ Server started in background. Check server.log for output."
    cd ..
fi

echo "🎉 Backend deployment completed!"
echo "API should be running on port 8003"