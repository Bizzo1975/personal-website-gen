#!/bin/bash

# Check if access_requests table exists and has correct schema

set +e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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
echo "CHECK ACCESS_REQUESTS TABLE"
echo "========================================="
echo ""

# Check if database is running
DB_STATUS=$($COMPOSE_CMD -f docker-compose.prod.yml ps db 2>&1 | grep -c "Up")
if [ "$DB_STATUS" -eq 0 ]; then
    echo -e "${RED}✗${NC} Database container is not running"
    exit 1
fi

echo -e "${BLUE}[CHECK 1]${NC} Checking if access_requests table exists..."
TABLE_EXISTS=$($COMPOSE_CMD -f docker-compose.prod.yml exec -T db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-personal_website}" -c "
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'access_requests'
);
" 2>&1 | grep -i "t" | head -n 1)

if echo "$TABLE_EXISTS" | grep -qi "t"; then
    echo -e "${GREEN}✓${NC} access_requests table exists"
else
    echo -e "${RED}✗${NC} access_requests table does NOT exist"
    echo "   You need to run database migrations or create the table"
    exit 1
fi
echo ""

echo -e "${BLUE}[CHECK 2]${NC} Checking table schema..."
SCHEMA=$($COMPOSE_CMD -f docker-compose.prod.yml exec -T db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-personal_website}" -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'access_requests'
ORDER BY ordinal_position;
" 2>&1)

echo "$SCHEMA"
echo ""

echo -e "${BLUE}[CHECK 3]${NC} Testing INSERT query..."
TEST_INSERT=$($COMPOSE_CMD -f docker-compose.prod.yml exec -T db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-personal_website}" -c "
INSERT INTO access_requests 
(name, email, subject, message, request_type, requested_access_level, status, submitted_at)
VALUES ('Test User', 'test@example.com', 'Test Subject', 'Test Message', 'access_request', 'personal', 'pending', CURRENT_TIMESTAMP)
RETURNING id, name, email;
" 2>&1)

if echo "$TEST_INSERT" | grep -qi "Test User"; then
    echo -e "${GREEN}✓${NC} INSERT query works"
    
    # Clean up test record
    $COMPOSE_CMD -f docker-compose.prod.yml exec -T db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-personal_website}" -c "
    DELETE FROM access_requests WHERE email = 'test@example.com';
    " >/dev/null 2>&1
else
    echo -e "${RED}✗${NC} INSERT query failed:"
    echo "$TEST_INSERT"
fi
echo ""

echo -e "${BLUE}[CHECK 4]${NC} Checking app container database connection..."
if $COMPOSE_CMD -f docker-compose.prod.yml ps app | grep -q "Up"; then
    DB_CONNECTION=$($COMPOSE_CMD -f docker-compose.prod.yml exec -T app node -e "
    const { query } = require('./src/lib/db');
    query('SELECT 1 as test').then(() => {
        console.log('OK');
        process.exit(0);
    }).catch(e => {
        console.error('ERROR:', e.message);
        process.exit(1);
    });
    " 2>&1)
    
    if echo "$DB_CONNECTION" | grep -q "OK"; then
        echo -e "${GREEN}✓${NC} App container can connect to database"
    else
        echo -e "${RED}✗${NC} App container cannot connect to database:"
        echo "$DB_CONNECTION"
    fi
else
    echo -e "${YELLOW}⚠${NC} App container is not running"
fi
echo ""

echo -e "${BLUE}[CHECK 5]${NC} Getting recent app logs (last 30 lines, no tail command)..."
if $COMPOSE_CMD -f docker-compose.prod.yml ps app | grep -q "Up"; then
    # Use sed to get last N lines (works without tail)
    $COMPOSE_CMD -f docker-compose.prod.yml logs app 2>&1 | sed -n '1,30p' | grep -i "error\|access.request\|500\|database" || echo "No recent errors found in first 30 lines"
    echo ""
    echo "To see more logs, run: docker-compose -f docker-compose.prod.yml logs app > /tmp/logs.txt && head -n 100 /tmp/logs.txt"
else
    echo -e "${YELLOW}⚠${NC} App container is not running"
fi
echo ""

echo "========================================="
echo "DONE"
echo "========================================="
echo ""

