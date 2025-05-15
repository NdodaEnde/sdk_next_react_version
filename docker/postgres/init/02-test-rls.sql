-- Create test organizations and users to verify RLS
INSERT INTO organizations (id, name, slug, type) 
VALUES ('00000000-0000-0000-0000-000000000003', 'Test Org A', 'test-org-a', 'service_provider');

INSERT INTO organizations (id, name, slug, type) 
VALUES ('00000000-0000-0000-0000-000000000004', 'Test Org B', 'test-org-b', 'service_provider');

-- Create test users
INSERT INTO users (id, email, full_name) 
VALUES ('00000000-0000-0000-0000-000000000002', 'user-a@example.com', 'User A');

INSERT INTO users (id, email, full_name) 
VALUES ('00000000-0000-0000-0000-000000000003', 'user-b@example.com', 'User B');

-- Add users to their organizations
INSERT INTO organization_users (organization_id, user_id, role, is_primary) 
VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'owner', true);

INSERT INTO organization_users (organization_id, user_id, role, is_primary) 
VALUES ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'owner', true);

-- Create test documents for each organization
INSERT INTO documents (id, organization_id, name, type, storage_path, size_bytes, mime_type, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'Document for Org A',
  'medical_certificate',
  '/documents/org-a/doc1.pdf',
  1024,
  'application/pdf',
  '00000000-0000-0000-0000-000000000002'
);

INSERT INTO documents (id, organization_id, name, type, storage_path, size_bytes, mime_type, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000004',
  'Document for Org B',
  'fitness_declaration',
  '/documents/org-b/doc1.pdf',
  2048,
  'application/pdf',
  '00000000-0000-0000-0000-000000000003'
);

-- Test RLS with different tenant contexts

-- Create function to test RLS isolation
CREATE OR REPLACE FUNCTION test_rls_isolation() RETURNS TEXT AS $$
DECLARE
  org_a_count INTEGER;
  org_b_count INTEGER;
  result TEXT;
BEGIN
  -- Set context to Org A
  PERFORM set_current_tenant('00000000-0000-0000-0000-000000000003'::uuid);
  
  -- Count documents visible to Org A
  SELECT COUNT(*) INTO org_a_count FROM documents;
  
  -- Set context to Org B
  PERFORM set_current_tenant('00000000-0000-0000-0000-000000000004'::uuid);
  
  -- Count documents visible to Org B
  SELECT COUNT(*) INTO org_b_count FROM documents;
  
  -- Check results
  IF org_a_count = 1 AND org_b_count = 1 THEN
    result := 'SUCCESS: RLS isolation is working correctly! Each org can only see its own documents.';
  ELSE
    result := 'FAILURE: RLS isolation test failed! Org A saw ' || org_a_count || ' documents and Org B saw ' || org_b_count || ' documents.';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Execute the test and log the result
DO $$
DECLARE
  test_result TEXT;
BEGIN
  test_result := test_rls_isolation();
  RAISE NOTICE '%', test_result;
END $$;