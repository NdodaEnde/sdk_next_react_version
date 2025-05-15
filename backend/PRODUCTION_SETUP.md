# Production Setup with Supabase PostgreSQL

This document outlines the changes made to make the backend work with Supabase PostgreSQL for production deployment.

## Overview of Changes

1. Updated `database.py` to support UUID primary keys in PostgreSQL mode
2. Created compatibility with Supabase's table structure
3. Added configuration files for production deployment
4. Created test scripts to verify functionality

## Database Schema Adaptation

The primary challenge was adapting our code to work with Supabase's UUID-based schema. The key tables in Supabase have the following structure:

### Certificates Table
```sql
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    document_id UUID NULL,
    type TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NULL,
    status TEXT NOT NULL,
    issuer_name TEXT NOT NULL,
    metadata JSONB NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### Certificate History Table
We created a new table to track certificate history:
```sql
CREATE TABLE certificate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL,
    user_id UUID NOT NULL,
    change_type TEXT NOT NULL,
    previous_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (certificate_id) REFERENCES certificates(id)
);
```

## Key API Changes

The following functions were updated to work with both SQLite (development) and PostgreSQL (production):

1. `save_certificate()`: 
   - For PostgreSQL, maps `certificate_data` to the `metadata` field 
   - Handles UUID type for document_id and organization_id
   - Creates patient records with proper identification_number field

2. `get_certificate()`:
   - Retrieves certificate data from metadata field in PostgreSQL
   - Correctly handles UUID document IDs

3. `get_certificate_history()`:
   - Works with UUID keys in certificate_history table
   - Returns consistent history records from both database types

## Configuration for Production

To use the PostgreSQL database in production:

1. Set the following environment variables:
   ```
   NODE_ENV=production
   DB_TYPE=postgres
   DATABASE_URL=postgresql://postgres.vzdepdxbdqvfpjzfuqfy:zyfwa0-pebzuc-gobGeh@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```

2. Use the provided `.env.production` file:
   ```
   cp .env.production .env
   ```

3. Run the deployment script:
   ```
   ./deploy_production.sh
   ```

## Testing the Production Setup

Several testing scripts are provided:

- `check_db_connection.py`: Verifies basic connectivity to Supabase
- `test_production_db.py`: Tests database tables and structure
- `test_final.py`: Tests the complete certificate workflow

To run the final test:
```
python test_final.py
```

## Troubleshooting

If you encounter issues:

1. Check that the `DATABASE_URL` is correctly set in your environment
2. Verify that the pgcrypto extension is enabled in Supabase
3. Ensure all required tables exist: `certificates`, `certificate_history`, `documents`, `patients`, `organizations`
4. Check for foreign key constraint errors when creating test data

## Reverting to Development Mode

To revert to development mode, copy the development environment file:
```
cp .env.development .env
```

This will switch back to using SQLite for local development.