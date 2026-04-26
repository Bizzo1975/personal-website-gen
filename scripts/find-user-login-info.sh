#!/bin/bash

# Find user login information from the database
# This script queries the users table to find all user accounts

set +e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR" || exit 1

# Detect Docker Compose version
COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1 && docker-compose --version >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}✗ ERROR: Docker Compose not found!${NC}"
    exit 1
fi

# Load environment variables
if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
fi

echo "========================================="
echo "FIND USER LOGIN INFORMATION"
echo "========================================="
echo ""

# Check if database is running
DB_STATUS=$($COMPOSE_CMD -f docker-compose.prod.yml ps db 2>&1 | grep -c "Up")
if [ "$DB_STATUS" -eq 0 ]; then
    echo -e "${YELLOW}⚠ Database container is not running${NC}"
    echo "   Starting database..."
    $COMPOSE_CMD -f docker-compose.prod.yml up -d db
    sleep 5
fi

echo -e "${BLUE}[QUERY 1]${NC} Checking profiles table for email..."
echo ""

# Check profiles table for email
PROFILE_EMAIL=$($COMPOSE_CMD -f docker-compose.prod.yml exec -T db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-personal_website}" -t -c "
SELECT email FROM profiles LIMIT 1;
" 2>&1 | xargs)

if [ -n "$PROFILE_EMAIL" ] && [ "$PROFILE_EMAIL" != "email" ]; then
    echo -e "${GREEN}✓${NC} Found profile email: $PROFILE_EMAIL"
    echo ""
    echo -e "${BLUE}[QUERY 2]${NC} Checking if this email has a user account..."
    echo ""
    
    USER_CHECK=$($COMPOSE_CMD -f docker-compose.prod.yml exec -T db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-personal_website}" -c "
SELECT 
    id,
    name,
    email,
    role,
    email_verified,
    created_at
FROM users
WHERE email = '$PROFILE_EMAIL';
" 2>&1)
    
    if echo "$USER_CHECK" | grep -q "$PROFILE_EMAIL"; then
        echo "$USER_CHECK"
        echo ""
        echo -e "${GREEN}✓${NC} User account found for profile email!"
    else
        echo -e "${YELLOW}⚠${NC} No user account found for profile email: $PROFILE_EMAIL"
        echo "   You may need to create a user account with this email."
    fi
    echo ""
fi

echo -e "${BLUE}[QUERY 3]${NC} Fetching all users from database..."
echo ""

# Query users table
USERS=$($COMPOSE_CMD -f docker-compose.prod.yml exec -T db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-personal_website}" -c "
SELECT 
    id,
    name,
    email,
    role,
    email_verified,
    created_at
FROM users
ORDER BY created_at DESC;
" 2>&1)

if [ $? -eq 0 ]; then
    echo "$USERS"
    echo ""
    echo -e "${GREEN}✓${NC} User information retrieved"
    echo ""
    echo -e "${YELLOW}Note:${NC} Passwords are hashed and cannot be retrieved."
    echo "   If you need to reset a password, you can:"
    echo "   1. Use the admin panel to reset it"
    echo "   2. Or create a new user with admin role"
    echo ""
    echo "To check if a specific email exists:"
    echo "  docker-compose -f docker-compose.prod.yml exec db psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-personal_website} -c \"SELECT email, role FROM users WHERE email = 'your-email@example.com';\""
else
    echo -e "${RED}✗${NC} Failed to query users"
    echo "$USERS"
fi

