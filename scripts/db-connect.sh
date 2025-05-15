#!/bin/bash

# Script to connect to the PostgreSQL database in Docker

if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Usage: ./db-connect.sh [command]"
  echo ""
  echo "Connect to the PostgreSQL database in Docker."
  echo ""
  echo "Commands:"
  echo "  --help, -h           Show this help"
  echo "  --psql, -p           Connect to the PostgreSQL shell"
  echo "  --test-rls, -t       Run the RLS test"
  echo "  --set-tenant, -s ID  Set the current tenant context to the given UUID"
  echo "  --list-orgs, -l      List all organizations"
  echo "  --list-users, -u     List all users"
  echo "  --list-docs, -d      List all documents visible in current tenant context"
  echo ""
  echo "Examples:"
  echo "  ./db-connect.sh -p                                     # Connect to psql"
  echo "  ./db-connect.sh -s 00000000-0000-0000-0000-000000000003 # Set tenant context"
  echo "  ./db-connect.sh -t                                     # Run RLS test"
  exit 0
fi

# Check if the container is running
if ! docker ps | grep -q sdk-postgres; then
  echo "Error: PostgreSQL container is not running. Please start it with docker-compose up -d"
  exit 1
fi

if [ "$1" == "--psql" ] || [ "$1" == "-p" ]; then
  # Connect to the PostgreSQL shell
  docker exec -it sdk-postgres psql -U postgres -d sdk_next
elif [ "$1" == "--test-rls" ] || [ "$1" == "-t" ]; then
  # Run the RLS test
  docker exec -it sdk-postgres psql -U postgres -d sdk_next -c "SELECT test_rls_isolation();"
elif [ "$1" == "--set-tenant" ] || [ "$1" == "-s" ]; then
  if [ -z "$2" ]; then
    echo "Error: Please provide a tenant UUID"
    exit 1
  fi
  # Set tenant context
  docker exec -it sdk-postgres psql -U postgres -d sdk_next -c "SELECT set_current_tenant('$2'::uuid);"
  echo "Current tenant context set to: $2"
elif [ "$1" == "--list-orgs" ] || [ "$1" == "-l" ]; then
  # List organizations
  docker exec -it sdk-postgres psql -U postgres -d sdk_next -c "SELECT id, name, slug, type, parent_id FROM organizations;"
elif [ "$1" == "--list-users" ] || [ "$1" == "-u" ]; then
  # List users
  docker exec -it sdk-postgres psql -U postgres -d sdk_next -c "SELECT id, email, full_name FROM users;"
elif [ "$1" == "--list-docs" ] || [ "$1" == "-d" ]; then
  # List documents in current tenant context
  docker exec -it sdk-postgres psql -U postgres -d sdk_next -c "SELECT id, name, type, organization_id FROM documents;"
else
  echo "Unknown command: $1"
  echo "Use --help for usage information"
  exit 1
fi