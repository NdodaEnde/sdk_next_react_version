-- Create schema
CREATE SCHEMA IF NOT EXISTS "public";

-- JWT settings are already configured in managed Supabase instances
-- (These are commented out because they require superuser privileges)
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';
-- ALTER DATABASE postgres SET "app.jwt_aud" TO 'authenticated';

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'member', 'viewer');

-- Create tables

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}'::JSONB,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create organization users junction table
CREATE TABLE IF NOT EXISTS organization_users (
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    content_type TEXT,
    size INTEGER NOT NULL,
    document_type TEXT,
    status TEXT NOT NULL DEFAULT 'uploaded',
    result_path TEXT,
    extracted_data JSONB,
    processing_error TEXT,
    uploaded_by_id UUID NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    identification_number TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    status TEXT NOT NULL,
    issuer_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_organization_users_updated_at
BEFORE UPDATE ON organization_users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON certificates
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create helper functions

-- Function to get a user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id UUID)
RETURNS SETOF organizations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT o.*
    FROM organizations o
    JOIN organization_users ou ON o.id = ou.organization_id
    WHERE ou.user_id = p_user_id;
$$;

-- Function to check if a user belongs to an organization
CREATE OR REPLACE FUNCTION check_user_in_organization(p_user_id UUID, p_organization_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM organization_users
        WHERE user_id = p_user_id
        AND organization_id = p_organization_id
    );
$$;

-- Function to get a user's role in an organization
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID, p_organization_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM organization_users
    WHERE user_id = p_user_id
    AND organization_id = p_organization_id;
$$;

-- Function to invite a user to an organization
CREATE OR REPLACE FUNCTION invite_user_to_organization(
    p_email TEXT,
    p_organization_id UUID,
    p_role user_role DEFAULT 'member'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;
    
    -- If user exists, add to organization
    IF v_user_id IS NOT NULL THEN
        INSERT INTO organization_users (organization_id, user_id, role)
        VALUES (p_organization_id, v_user_id, p_role)
        ON CONFLICT (organization_id, user_id) 
        DO UPDATE SET role = p_role;
    ELSE
        -- In a real implementation, you would send an invitation email
        -- For now, just return null to indicate user not found
        RETURN NULL;
    END IF;
    
    RETURN v_user_id;
END;
$$;

-- Create document statistics function
CREATE OR REPLACE FUNCTION get_document_statistics(p_organization_id UUID, p_period TEXT DEFAULT 'month')
RETURNS TABLE (
    period TEXT,
    document_count BIGINT,
    successful_count BIGINT,
    failed_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p_period = 'day' THEN TO_CHAR(created_at, 'YYYY-MM-DD')
            WHEN p_period = 'week' THEN TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD')
            WHEN p_period = 'month' THEN TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM')
            ELSE TO_CHAR(DATE_TRUNC('year', created_at), 'YYYY')
        END AS period,
        COUNT(*) AS document_count,
        COUNT(CASE WHEN status = 'processed' THEN 1 END) AS successful_count,
        COUNT(CASE WHEN status = 'processing_failed' THEN 1 END) AS failed_count
    FROM documents
    WHERE organization_id = p_organization_id
    GROUP BY period
    ORDER BY period;
END;
$$;

-- Function to get certificate expirations
CREATE OR REPLACE FUNCTION get_certificate_expirations(p_organization_id UUID)
RETURNS TABLE (
    days_to_expiry TEXT,
    certificate_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN expiry_date - CURRENT_DATE <= 7 THEN 'This week'
            WHEN expiry_date - CURRENT_DATE <= 30 THEN 'This month'
            WHEN expiry_date - CURRENT_DATE <= 90 THEN 'This quarter'
            ELSE 'Later'
        END AS days_to_expiry,
        COUNT(*) AS certificate_count
    FROM certificates
    WHERE organization_id = p_organization_id
    AND expiry_date >= CURRENT_DATE
    GROUP BY days_to_expiry
    ORDER BY 
        CASE days_to_expiry
            WHEN 'This week' THEN 1
            WHEN 'This month' THEN 2
            WHEN 'This quarter' THEN 3
            ELSE 4
        END;
END;
$$;

-- Create audit log function
CREATE OR REPLACE FUNCTION create_audit_log(
    p_organization_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        p_organization_id,
        p_user_id,
        p_action,
        p_entity_type,
        p_entity_id,
        COALESCE(p_metadata, '{}'::JSONB)
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create Row Level Security policies

-- Organizations - Users can only see organizations they belong to
CREATE POLICY organization_user_policy ON organizations
    USING (id IN (SELECT organization_id FROM organization_users WHERE user_id = auth.uid()));

-- Organization users - Users can only see memberships for their organizations
CREATE POLICY organization_users_select_policy ON organization_users
    USING (organization_id IN (SELECT organization_id FROM organization_users WHERE user_id = auth.uid()));

-- Organization users - Only organization admins can modify memberships 
-- (Using current_setting('request.jwt.claims') to access the user ID)
CREATE POLICY organization_users_insert_policy ON organization_users
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_users 
            WHERE organization_id = organization_id 
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY organization_users_update_policy ON organization_users
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM organization_users 
            WHERE organization_id = organization_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY organization_users_delete_policy ON organization_users
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM organization_users 
            WHERE organization_id = organization_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Documents - Users can only see documents in their organizations
CREATE POLICY documents_select_policy ON documents
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- Documents - Users can only insert documents to their organizations
CREATE POLICY documents_insert_policy ON documents
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- Documents - Users can only update their own documents or if they're admins
CREATE POLICY documents_update_policy ON documents
    FOR UPDATE
    USING (
        (uploaded_by_id = auth.uid()) OR
        (
            organization_id IN (
                SELECT organization_id FROM organization_users 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Documents - Only admins can delete documents
CREATE POLICY documents_delete_policy ON documents
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Apply similar policies to patients and certificates
CREATE POLICY patients_select_policy ON patients
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY patients_insert_policy ON patients
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY patients_update_policy ON patients
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY patients_delete_policy ON patients
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY certificates_select_policy ON certificates
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY certificates_insert_policy ON certificates
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY certificates_update_policy ON certificates
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY certificates_delete_policy ON certificates
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Activity logs - Users can only see logs for their organizations
CREATE POLICY activity_logs_select_policy ON activity_logs
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- Activity logs - System can insert logs for any organization
CREATE POLICY activity_logs_insert_policy ON activity_logs
    FOR INSERT
    WITH CHECK (TRUE);

-- Create example data for testing

-- Insert example organization
INSERT INTO organizations (id, name, slug, settings)
VALUES (
    '55a787fe-7182-4f98-81bc-6a5bcc593d9e',
    'Demo Medical Center',
    'demo-medical-center',
    '{"theme": "light", "features": {"analytics": true, "alerts": true}}'
);

-- Insert organization user (will need to be updated with a real user ID when created)
INSERT INTO organization_users (organization_id, user_id, role)
VALUES (
    '55a787fe-7182-4f98-81bc-6a5bcc593d9e',
    '00000000-0000-0000-0000-000000000000', -- This will be updated later
    'admin'
);