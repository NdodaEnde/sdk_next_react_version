# Production Deployment Guide

This guide provides instructions for deploying the Medical Certificates application in a production environment.

## Prerequisites

- Linux server with at least 2GB RAM
- Docker and Docker Compose installed
- PostgreSQL database server (or use the provided Docker container)
- Domain name with DNS pointing to your server (for HTTPS)
- SMTP server for email notifications

## Setup Options

There are three ways to deploy this application:

1. **Docker Compose** (recommended)
2. **Manual deployment** with deployment scripts
3. **Containerized deployment** with Dockerfile

## Option 1: Docker Compose Deployment

This is the simplest option that sets up the entire stack including PostgreSQL, backend, frontend, and Nginx.

### Steps:

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd medical-certificates
   ```

2. Configure environment variables
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your actual values
   ```

3. Configure frontend environment
   ```bash
   cp frontend/.env.production.example frontend/.env.production
   # Edit frontend/.env.production with your actual values
   ```

4. Set up SSL certificates
   ```bash
   # For production with Let's Encrypt
   apt-get install certbot
   certbot certonly --standalone -d yourdomain.com
   
   # Copy certificates to the nginx/ssl directory
   mkdir -p nginx/ssl
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
   ```

5. Start the stack
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

6. The application should now be running at:
   - Frontend: https://yourdomain.com
   - Backend API: https://yourdomain.com/api

## Option 2: Manual Deployment

This option deploys components directly on the server without containers.

### Prerequisites:
- Python 3.9+
- Node.js 16+
- PostgreSQL 14+
- Nginx

### Steps:

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd medical-certificates
   ```

2. Configure environment variables
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your actual values
   ```

3. Run the backend deployment script
   ```bash
   chmod +x deploy_backend.sh
   ./deploy_backend.sh
   ```

4. Run the frontend deployment script
   ```bash
   chmod +x deploy_frontend.sh
   ./deploy_frontend.sh
   ```

5. Configure Nginx (example configuration provided in nginx/default.conf)
   ```bash
   # Copy Nginx configuration
   sudo cp nginx/default.conf /etc/nginx/sites-available/medical-certificates
   
   # Create symbolic link
   sudo ln -s /etc/nginx/sites-available/medical-certificates /etc/nginx/sites-enabled/
   
   # Restart Nginx
   sudo systemctl restart nginx
   ```

## Option 3: Containerized Deployment

This option uses the provided Dockerfile to build and run the application in a container.

### Steps:

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd medical-certificates
   ```

2. Configure environment variables
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your actual values
   ```

3. Build the Docker image
   ```bash
   docker build -t medical-certificates:latest .
   ```

4. Run the container
   ```bash
   docker run -d \
     --name medical-certificates \
     -p 8003:8003 \
     -p 3000:3000 \
     --env-file .env.production \
     medical-certificates:latest
   ```

5. Configure Nginx as a reverse proxy (similar to Option 2)

## Database Setup

The application requires a PostgreSQL database. You can:

1. Use the provided Docker Compose setup which includes PostgreSQL
2. Use an existing PostgreSQL server by setting the DATABASE_URL in .env.production

For an existing PostgreSQL server:

```bash
# Create database and user
psql -U postgres
CREATE DATABASE medical_certificates;
CREATE USER medcert WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE medical_certificates TO medcert;
```

## Email Configuration

For password reset and email verification features to work, configure SMTP settings in .env.production:

```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=Medical Certificates <noreply@example.com>
```

## Monitoring and Maintenance

- The backend uses systemd service for auto-restart and logging
- Logs are stored in /var/log/syslog
- Docker logs can be viewed with `docker-compose -f docker-compose.prod.yml logs`

## Backup

To backup the PostgreSQL database:

```bash
# For Docker Compose setup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres -d medical_certificates > backup.sql

# For standalone PostgreSQL
pg_dump -U postgres -d medical_certificates > backup.sql
```