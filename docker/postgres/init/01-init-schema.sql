-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set up the RLS-related functions
CREATE OR REPLACE FUNCTION set_current_tenant(org_id uuid) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', org_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_tenant() RETURNS uuid AS $$
DECLARE
  current_org_id uuid;
BEGIN
  SELECT current_setting('app.current_tenant_id', true)::uuid INTO current_org_id;
  RETURN current_org_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('service_provider', 'client')),
  parent_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create organization_users join table
CREATE TABLE IF NOT EXISTS organization_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (organization_id, user_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  storage_path text NOT NULL,
  size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create document_versions table for version control
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  storage_path text NOT NULL,
  size_bytes bigint NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (document_id, version_number)
);

-- Add RLS policies to all tables

-- 1. Enable RLS on tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for organizations

-- Service providers can see their own org and their clients
CREATE POLICY organization_select_policy ON organizations
  FOR SELECT USING (
    id = get_current_tenant() OR 
    parent_id = get_current_tenant() OR
    id IN (SELECT parent_id FROM organizations WHERE id = get_current_tenant())
  );

-- Organizations can only update their own data
CREATE POLICY organization_update_policy ON organizations
  FOR UPDATE USING (id = get_current_tenant());

-- 3. Policies for organization_users
CREATE POLICY org_users_select_policy ON organization_users
  FOR SELECT USING (organization_id = get_current_tenant());

CREATE POLICY org_users_insert_policy ON organization_users
  FOR INSERT WITH CHECK (organization_id = get_current_tenant());

CREATE POLICY org_users_update_policy ON organization_users
  FOR UPDATE USING (organization_id = get_current_tenant());

CREATE POLICY org_users_delete_policy ON organization_users
  FOR DELETE USING (organization_id = get_current_tenant());

-- 4. Policies for documents
CREATE POLICY documents_select_policy ON documents
  FOR SELECT USING (organization_id = get_current_tenant());

CREATE POLICY documents_insert_policy ON documents
  FOR INSERT WITH CHECK (organization_id = get_current_tenant());

CREATE POLICY documents_update_policy ON documents
  FOR UPDATE USING (organization_id = get_current_tenant());

CREATE POLICY documents_delete_policy ON documents
  FOR DELETE USING (organization_id = get_current_tenant());

-- 5. Policies for document_versions
CREATE POLICY document_versions_select_policy ON document_versions
  FOR SELECT USING (
    document_id IN (SELECT id FROM documents WHERE organization_id = get_current_tenant())
  );

CREATE POLICY document_versions_insert_policy ON document_versions
  FOR INSERT WITH CHECK (
    document_id IN (SELECT id FROM documents WHERE organization_id = get_current_tenant())
  );

-- Create security definer function for creating organization with owner
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name text,
  org_slug text,
  org_type text,
  parent_org_id uuid,
  user_id uuid,
  user_role text DEFAULT 'owner'
) RETURNS uuid AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create the organization
  INSERT INTO organizations (name, slug, type, parent_id)
  VALUES (org_name, org_slug, org_type, parent_org_id)
  RETURNING id INTO new_org_id;
  
  -- Add the user as owner
  INSERT INTO organization_users (organization_id, user_id, role, is_primary)
  VALUES (new_org_id, user_id, user_role, true);
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a sample organization for testing
INSERT INTO organizations (id, name, slug, type) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Organization', 'test-org', 'service_provider');

-- Create a sample user
INSERT INTO users (id, email, full_name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin User');

-- Add the user to the organization
INSERT INTO organization_users (organization_id, user_id, role, is_primary) 
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner', true);

-- Create a client organization
INSERT INTO organizations (id, name, slug, type, parent_id) 
VALUES (
  '00000000-0000-0000-0000-000000000002', 
  'Client Organization', 
  'client-org', 
  'client', 
  '00000000-0000-0000-0000-000000000001'
);

-- Add the same user to the client org
INSERT INTO organization_users (organization_id, user_id, role, is_primary) 
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'admin', false);