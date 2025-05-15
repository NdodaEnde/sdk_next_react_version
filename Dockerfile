# Multi-stage build for Medical Certificates application

# Backend build stage
FROM python:3.9-slim AS backend-build

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Frontend build stage
FROM node:16-alpine AS frontend-build

WORKDIR /app

# Copy frontend files
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
COPY frontend/.env.production ./

# Build frontend
RUN npm run build

# Final stage
FROM python:3.9-slim

WORKDIR /app

# Install production system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend code
COPY backend/ ./backend/
COPY --from=backend-build /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages

# Copy frontend build artifacts
COPY --from=frontend-build /app/.next ./frontend/.next
COPY --from=frontend-build /app/node_modules ./frontend/node_modules
COPY --from=frontend-build /app/public ./frontend/public
COPY --from=frontend-build /app/package*.json ./frontend/

# Set working directory to backend
WORKDIR /app/backend

# Copy production environment variables
COPY .env.production ./.env.production

# Copy start script
COPY backend/start_production.py ./

# Expose ports
EXPOSE 8003 3000

# Start services
CMD ["python", "start_production.py"]