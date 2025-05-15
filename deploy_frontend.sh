#!/bin/bash
set -e

# Medical Certificates Frontend Deployment Script
echo "🚀 Starting frontend deployment process..."

# 1. Check if Node.js and npm are installed
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# 2. Install dependencies
echo "Installing dependencies..."
cd frontend
npm install --production

# 3. Check if .env.production exists for frontend
if [ ! -f ".env.production" ]; then
    echo "⚠️ Warning: .env.production file not found. Using template..."
    # Create a template .env.production file
    echo "NEXT_PUBLIC_API_URL=http://localhost:8003" > .env.production
    echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.production
    echo "⚠️ Please edit frontend/.env.production with your actual API URL!"
fi

# 4. Build the application
echo "Building the application..."
npm run build

# 5. Set up for production serving
if command -v pm2 &> /dev/null; then
    # Using PM2 for process management
    echo "Setting up PM2 service..."
    pm2 delete medical-certificates-frontend 2>/dev/null || true
    pm2 start npm --name "medical-certificates-frontend" -- start
    pm2 save
    
    echo "✅ Frontend service started with PM2!"
    echo "Check status with: pm2 status"
else
    echo "PM2 not available. To install: npm install -g pm2"
    echo "Starting server directly..."
    nohup npm start > ../frontend.log 2>&1 &
    echo "✅ Frontend started in background. Check frontend.log for output."
fi

# 6. Provide next steps for Nginx or other web server setup
echo "🔧 Next steps:"
echo "1. Set up Nginx or Apache as a reverse proxy pointing to your Next.js app"
echo "2. Example Nginx configuration:"
echo "
server {
    listen 80;
    server_name yourproductiondomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:8003;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
"

cd ..

echo "🎉 Frontend deployment completed!"
echo "Application should be running on port 3000"