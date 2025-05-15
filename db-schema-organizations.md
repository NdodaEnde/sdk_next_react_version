# Organization Management Database Schema

This document outlines the database schema for organization management in a multi-tenant application.

## Tables

### Organizations

Stores information about organizations (tenants) in the system.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::JSONB,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for faster slug lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);
```

### Organization Members

Stores the relationship between users and organizations, including their role within the organization.

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_default_organization BOOLEAN DEFAULT FALSE,
  
  -- Each user can only have one role per organization
  UNIQUE(organization_id, user_id)
);

-- Index for looking up by user_id
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
-- Index for looking up by organization_id
CREATE INDEX idx_organization_members_organization_id ON organization_members(organization_id);
-- Index for finding a user's default organization
CREATE INDEX idx_organization_members_default ON organization_members(user_id, is_default_organization) WHERE is_default_organization = TRUE;
```

### Organization Invitations

Stores invitations for users to join organizations.

```sql
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  token VARCHAR(255) NOT NULL UNIQUE, -- Secure token for accepting the invitation
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  
  -- Can only have one pending invitation per email per organization
  UNIQUE(organization_id, email, status) WHERE status = 'pending'
);

-- Index for looking up by token
CREATE INDEX idx_organization_invitations_token ON organization_invitations(token);
-- Index for looking up by email
CREATE INDEX idx_organization_invitations_email ON organization_invitations(email);
```

### Organization Documents

Tracks documents that belong to specific organizations.

```sql
CREATE TABLE organization_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processed', 'error'
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Index for looking up by organization_id
CREATE INDEX idx_organization_documents_organization_id ON organization_documents(organization_id);
-- Index for looking up by uploader
CREATE INDEX idx_organization_documents_uploaded_by ON organization_documents(uploaded_by);
```

## Database Functions

### Organization Creation

```sql
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name TEXT,
  org_slug TEXT,
  user_id UUID
) RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Insert new organization
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO org_id;
  
  -- Add user as owner
  INSERT INTO organization_members (organization_id, user_id, role, is_default_organization)
  VALUES (org_id, user_id, 'owner', TRUE);
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql;
```

### Get User Organizations

```sql
CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  role VARCHAR,
  is_default BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    om.role,
    om.is_default_organization
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = p_user_id AND o.is_active = TRUE
  ORDER BY om.is_default_organization DESC, o.name;
END;
$$ LANGUAGE plpgsql;
```

## Row Level Security (RLS) Policies

To ensure data isolation between organizations:

```sql
-- Organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_select ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Organization Members table
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_select ON organization_members
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only organization admins and owners can insert/update/delete members
CREATE POLICY members_insert ON organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = NEW.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );
  
-- Organization Documents table
ALTER TABLE organization_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_select ON organization_documents
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

## Migration Strategy

1. Create the new tables in the database
2. Setup RLS policies
3. Create database functions
4. For existing users, create a default organization and assign them as owners
5. Migrate existing documents to be linked to appropriate organizations

## API Endpoints

The following API endpoints will be needed to interact with this schema:

1. `GET /api/organizations` - List organizations for the current user
2. `POST /api/organizations` - Create a new organization
3. `GET /api/organizations/:id` - Get organization details
4. `PUT /api/organizations/:id` - Update organization details
5. `GET /api/organizations/:id/members` - List organization members
6. `POST /api/organizations/:id/members` - Add a member directly
7. `DELETE /api/organizations/:id/members/:userId` - Remove a member
8. `PUT /api/organizations/:id/members/:userId/role` - Update a member's role
9. `POST /api/organizations/:id/invitations` - Create an invitation
10. `GET /api/organizations/invitations` - List pending invitations for current user
11. `POST /api/organizations/invitations/:token/accept` - Accept an invitation
12. `POST /api/organizations/invitations/:token/decline` - Decline an invitation
13. `POST /api/user/default-organization/:id` - Set a user's default organization