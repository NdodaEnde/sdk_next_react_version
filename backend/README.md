# Backend Server

This is the backend server for the certificate management application. It supports both SQLite for development and PostgreSQL for production use with Supabase.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure environment:
   - For development, copy `.env.development.example` to `.env.development` and modify as needed
   - For production, copy `.env.production.example` to `.env.production` and set your Supabase PostgreSQL connection string

## Running the Server

### Development Mode (SQLite)
```bash
./run_development.sh
```

### Production Mode (PostgreSQL/Supabase)
```bash
./run_production.sh
```

## API Endpoints

- `POST /api/save-certificate`: Save certificate data for a document
- `GET /api/get-certificate/<document_id>`: Get certificate data for a document
- `GET /api/certificate-history/<document_id>`: Get history of changes for a certificate
- `POST /api/restore-certificate-version`: Restore a previous version of a certificate
- `POST /api/process`: Process uploaded PDF documents
- `POST /api/chat`: Process chat messages about the document
- `GET /api/pdf-preview/<filename>`: Retrieve a PDF file from the uploads folder

## Database

The application supports two database backends:

1. **SQLite** (Development): Used for local development with a simple file-based database.
2. **PostgreSQL** (Production): Used in production with Supabase, which uses UUID-based primary keys.

### Database Schema Compatibility

The system automatically handles the differences between SQLite (using TEXT primary keys) and PostgreSQL (using UUID primary keys). The `db_utils.py` module provides functions that seamlessly convert between filename-based document IDs (used in the frontend) and UUID-based document IDs (used in Supabase).

## Document ID Handling

Documents can be referenced by either their filename or their UUID in the database. The system will automatically:

1. Look up a document by name if a non-UUID document ID is provided
2. Create a new document entry if the document doesn't exist
3. Convert between filename-based and UUID-based references as needed

This allows the frontend to use simple filenames while the backend uses the appropriate ID format for the current database.

## Testing

Several test scripts are available to verify functionality:

- `test_certificate_save.py`: Tests saving a certificate in production mode
- `test_document_id_handling.py`: Tests the improved document ID handling system

Run them with:
```bash
python test_certificate_save.py
python test_document_id_handling.py
```