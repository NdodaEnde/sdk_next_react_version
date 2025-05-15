# Organization Management System

This document describes the multi-tenant organization management system implemented for the MedicData Analytics application. The system has been updated to work with both SQLite in development and PostgreSQL in production environments.

## Overview

The organization management system allows users to:

- Create and manage organizations (tenants)
- Switch between multiple organizations
- Invite other users to join their organizations
- Assign roles within organizations (owner, admin, member)
- Set a default organization
- Access organization-specific data and resources
- View and manage pending invitations
- Access organization settings

This implementation follows a multi-tenant architecture where data is isolated between organizations, and users can belong to multiple organizations with different roles. All API calls include organization context, ensuring proper data isolation in the multi-tenant environment.

## Architecture

### Database Schema

The organization management system uses the following database schema:

#### Organizations Table

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
```

#### Organization Members Table

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
```

#### Organization Invitations Table

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
```

### Backend Components

#### Organization Routes

A Flask Blueprint that provides the API endpoints for organization management:

```python
# Register organization routes blueprint
app.register_blueprint(org_routes, url_prefix='/api')
```

The routes handle:
- Creating, reading, updating organizations
- Managing organization members
- Creating and responding to invitations
- Setting default organizations

#### Organization Middleware

Middleware functions that handle organization context in requests:

```python
# Import organization middleware
from org_middleware import requires_organization, with_org_context, requires_org_role
```

The middleware provides:
- `requires_organization`: Ensures an organization context is present
- `with_org_context`: Adds organization context if available
- `requires_org_role`: Requires a specific role within an organization

### Frontend Components

#### Organization Context

A React context provider that manages organization state:

```javascript
import { OrganizationProvider, useOrganization } from '../utils/organizationContext';
```

The context provides:
- Current organization state
- Organization switching
- Organization creation
- Member management
- API headers with organization context

#### Organization Switcher

A React component that allows users to switch between organizations:

```javascript
import OrganizationSwitcher from '../components/OrganizationSwitcher';
```

## API Endpoints

### Organization Management

- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create a new organization
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization details

### Member Management

- `GET /api/organizations/:id/members` - List organization members
- `POST /api/organizations/:id/members` - Add a member directly
- `DELETE /api/organizations/:id/members/:userId` - Remove a member
- `PUT /api/organizations/:id/members/:userId/role` - Update a member's role

### Invitation System

- `POST /api/organizations/:id/invitations` - Create an invitation
- `GET /api/invitations` - List pending invitations for current user
- `POST /api/invitations/:token/accept` - Accept an invitation
- `POST /api/invitations/:token/decline` - Decline an invitation

### User Preferences

- `POST /api/user/default-organization/:id` - Set a user's default organization

## Organization Context in Requests

The organization context is passed in API requests through:

1. **HTTP Headers**: Using `X-Organization-ID` header
2. **JWT Token**: Using `org_id` claim in the authentication token

Backend endpoints can use the `requires_organization` decorator to ensure an organization context:

```python
@app.route('/api/example', methods=['GET'])
@requires_organization
def example_endpoint(current_user, org_id):
    # Access is restricted to members of the organization
    # org_id is available as a parameter
    return jsonify({"organization_id": org_id})
```

For role-based access within an organization:

```python
@app.route('/api/admin-example', methods=['GET'])
@requires_org_role('admin')
def admin_example(current_user, org_id):
    # Only admins of the organization can access
    return jsonify({"message": "Admin access granted"})
```

## Frontend Usage

### Organization Provider

Wrap your application with the organization provider:

```jsx
function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <YourApp />
      </OrganizationProvider>
    </AuthProvider>
  );
}
```

### Using Organization Context

Access organization context in components:

```jsx
function YourComponent() {
  const { 
    organizations, 
    currentOrganization, 
    switchOrganization 
  } = useOrganization();
  
  return (
    <div>
      <h1>Current Organization: {currentOrganization?.name}</h1>
      <button onClick={() => switchOrganization(anotherOrgId)}>
        Switch Organization
      </button>
    </div>
  );
}
```

### Making API Requests with Organization Context

Use the API utility functions to make authenticated requests with organization context:

```jsx
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';

function YourComponent() {
  async function fetchData() {
    try {
      // Organization context is automatically included in headers
      const data = await apiGet('/api/your-endpoint');
      // Authentication errors are automatically handled
    } catch (err) {
      console.error(err);
    }
  }
  
  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
    </div>
  );
}
```

### Role-Based UI Components

Use role-based conditionals to control UI access:

```jsx
function OrganizationActions() {
  const { organization } = useOrganization();
  const isAdmin = organization?.role === 'admin' || organization?.role === 'owner';
  
  return (
    <div>
      {/* Regular member actions */}
      <button>View Reports</button>
      
      {/* Admin-only actions */}
      {isAdmin && (
        <>
          <button>Invite Members</button>
          <button>Manage Settings</button>
        </>
      )}
    </div>
  );
}
```

## Pages and Components

The following pages and components have been implemented for organization management:

### Pages

1. **Organizations Page** (`/organizations`):
   - List of user's organizations
   - Organization creation form
   - Organization switching

2. **Organization Detail** (`/organizations/[id]`):
   - Organization overview
   - Member management tab
   - Invitation management tab
   - Activity log tab

3. **Organization Settings** (`/organizations/[id]/settings`):
   - Update organization details
   - Organization deletion (for owners)

4. **Invitations Page** (`/invitations`):
   - List of pending invitations
   - Accept/decline invitations

5. **Invitation Accept Page** (`/invitations/[token]`):
   - View invitation details
   - Accept/decline invitation

### Key Components

1. **OrganizationSwitcher**:
   - Dropdown for switching between organizations
   - Set default organization

2. **InvitationList**:
   - Display pending invitations
   - Invitation actions

3. **MemberList**:
   - Display organization members
   - Role management

4. **RoleBadge**:
   - Visual indicator of user roles

## Testing

The organization management system can be tested using the provided test scripts:

```bash
# Run backend organization tests
python backend/test_organizations.py

# Run with a real token for more thorough testing
TEST_TOKEN=your_jwt_token python backend/test_organizations.py

# Run frontend component tests
npm test components/organizations
```

## Security Considerations

1. **Organization Isolation**: Data is isolated between organizations using organization context
2. **Role-Based Access**: Restricted access to organization management functions based on roles
3. **Invitation System**: Secure invitation system for adding new members
4. **JWT Validation**: Proper validation of authentication tokens with organization context
5. **Error Handling**: Standardized error handling for authentication issues
6. **API Security**: All API endpoints require authentication and proper authorization

## Production Considerations

For production deployment:

1. **Database Implementation**: The system now supports both SQLite (development) and PostgreSQL (production)
2. **Email Integration**: Add email notifications for invitations
3. **Organization Limits**: Implement limits based on subscription tier
4. **Audit Logging**: Add logging for organization management actions
5. **Data Migration**: Scripts to help migrate data between environments

## New Features

### API Utilities

The `apiUtils.js` module provides standardized functions for API calls with authentication and error handling:

```javascript
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';

// Make authenticated request
const data = await apiGet('/api/endpoint');

// Handle authentication errors automatically
if (isAuthError(error)) {
  handleAuthError(error);
}
```

### Organization Settings Page

The organization settings page allows admins and owners to:

- Update organization details
- View organization metadata
- Delete organizations (owners only)

### Invitation Acceptance Flow

The invitation flow now includes:

1. Email with invitation link
2. Dedicated page for viewing invitation details
3. Accept/decline options
4. Auto-redirect after acceptance
5. Automatic organization joining