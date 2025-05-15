# Document Processing Worker Service

Python worker service for processing and analyzing documents with LandingAI integration.

## Overview

This service is part of the SDK Next React healthcare analytics system. It processes uploaded documents using the LandingAI API to extract structured data from medical certificates, test results, and fitness declarations.

## Features

- FastAPI-based REST API for manual document processing and health checks
- Redis queue integration for receiving document processing jobs
- LandingAI SDK integration for AI-based document analysis
- S3/MinIO integration for document storage
- Automatic result reporting back to the main application
- Docker containerization for easy deployment

## Architecture

The worker service operates within the following architecture:

1. Documents are uploaded to the main NestJS API
2. The API stores documents in S3/MinIO storage
3. Document processing jobs are added to a Redis queue
4. The worker service picks up jobs from the queue
5. The worker processes documents using LandingAI
6. Results are saved to S3/MinIO and sent back to the main API
7. The frontend displays processing status and results in real-time

## Development

### Prerequisites

- Python 3.9+
- Redis (for the job queue)
- MinIO or S3-compatible storage
- LandingAI API credentials

### Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Configure environment variables in `.env`:

```
# Redis settings
REDIS_HOST=localhost
REDIS_PORT=6379

# LandingAI settings  
LANDINGAI_API_KEY=your_landingai_api_key
LANDINGAI_CLIENT_ID=your_landingai_client_id

# S3 settings
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=documents

# API callback URL
API_CALLBACK_URL=http://localhost:3001/api/documents/process-result
```

3. Run the service:

```bash
uvicorn app.main:app --reload
```

### Docker

Build and run with Docker:

```bash
docker build -t document-worker .
docker run -p 8000:8000 document-worker
```

Or use Docker Compose to start the entire system:

```bash
docker-compose up
```

## API Endpoints

- `GET /health`: Basic health check
- `GET /api/v1/health/detailed`: Detailed health check with component status
- `POST /api/v1/documents/process`: Manually trigger document processing
- `POST /api/v1/documents/upload-and-process`: Upload and process a document

## Integration with Main Application

The worker service integrates with the main application through:

1. **Redis Queue**: Document processing jobs are published to a Redis queue
2. **S3/MinIO Storage**: Documents and results are stored in shared S3 buckets
3. **Webhook Callbacks**: Processing results are sent to the main API via HTTP callbacks

## Testing

Run tests with pytest:

```bash
pytest
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `REDIS_HOST` | Redis server hostname | localhost |
| `REDIS_PORT` | Redis server port | 6379 |
| `DOCUMENT_QUEUE_NAME` | Name of the document processing queue | document-processing |
| `LANDINGAI_API_KEY` | LandingAI API key | - |
| `LANDINGAI_CLIENT_ID` | LandingAI client ID | - |
| `S3_ENDPOINT` | S3/MinIO endpoint URL | http://localhost:9000 |
| `S3_BUCKET_NAME` | S3/MinIO bucket for documents | documents |
| `API_CALLBACK_URL` | URL to report results back to main API | http://localhost:3001/api/documents/process-result |