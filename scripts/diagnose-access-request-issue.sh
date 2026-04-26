#!/bin/bash

# Diagnose access request form submission issues

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
echo "DIAGNOSE ACCESS REQUEST ISSUES"
echo "========================================="
echo ""

# Check if app container is running
echo -e "${BLUE}[CHECK 1]${NC} App container status..."
APP_STATUS=$($COMPOSE_CMD -f docker-compose.prod.yml ps app 2>&1 | grep -c "Up")
if [ "$APP_STATUS" -eq 0 ]; then
    echo -e "${RED}✗${NC} App container is not running"
    echo "   Start it with: $COMPOSE_CMD -f docker-compose.prod.yml up -d app"
else
    echo -e "${GREEN}✓${NC} App container is running"
fi
echo ""

# Check reCAPTCHA configuration
echo -e "${BLUE}[CHECK 2]${NC} reCAPTCHA configuration..."
if [ -z "$RECAPTCHA_SECRET_KEY" ]; then
    echo -e "${YELLOW}⚠${NC} RECAPTCHA_SECRET_KEY is not set in .env.production"
    echo "   reCAPTCHA verification will be skipped"
else
    echo -e "${GREEN}✓${NC} RECAPTCHA_SECRET_KEY is set"
fi

# Check for NEXT_PUBLIC_RECAPTCHA_SITE_KEY in app container
echo -e "${BLUE}[CHECK 3]${NC} reCAPTCHA site key in app container..."
if [ "$APP_STATUS" -gt 0 ]; then
    SITE_KEY=$($COMPOSE_CMD -f docker-compose.prod.yml exec -T app sh -c 'echo $NEXT_PUBLIC_RECAPTCHA_SITE_KEY' 2>&1 | tr -d '\r\n')
    if [ -z "$SITE_KEY" ] || [ "$SITE_KEY" = "" ]; then
        echo -e "${RED}✗${NC} NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set in app container"
        echo "   Add it to .env.production and restart the app"
    else
        echo -e "${GREEN}✓${NC} NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set"
    fi
else
    echo -e "${YELLOW}⚠${NC} Cannot check - app container not running"
fi
echo ""

# Check database connection
echo -e "${BLUE}[CHECK 4]${NC} Database connection..."
DB_STATUS=$($COMPOSE_CMD -f docker-compose.prod.yml ps db 2>&1 | grep -c "Up")
if [ "$DB_STATUS" -eq 0 ]; then
    echo -e "${RED}✗${NC} Database container is not running"
else
    echo -e "${GREEN}✓${NC} Database container is running"
    
    # Check if access_requests table exists
    TABLE_CHECK=$($COMPOSE_CMD -f docker-compose.prod.yml exec -T db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-personal_website}" -c "
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'access_requests'
);
" 2>&1 | grep -i "t" | head -n 1)
    
    if echo "$TABLE_CHECK" | grep -qi "t"; then
        echo -e "${GREEN}✓${NC} access_requests table exists"
    else
        echo -e "${RED}✗${NC} access_requests table does not exist"
        echo "   Run database migrations to create the table"
    fi
fi
echo ""

# Check app logs for recent errors
echo -e "${BLUE}[CHECK 5]${NC} Recent app logs (last 20 lines)..."
if [ "$APP_STATUS" -gt 0 ]; then
    echo "----------------------------------------"
    $COMPOSE_CMD -f docker-compose.prod.yml logs app --tail 20 2>&1 | grep -i "error\|fail\|access.request" || echo "No recent errors found"
    echo "----------------------------------------"
else
    echo -e "${YELLOW}⚠${NC} Cannot check - app container not running"
fi
echo ""

# Test API endpoint
echo -e "${BLUE}[CHECK 6]${NC} Testing /api/access-requests endpoint..."
if [ "$APP_STATUS" -gt 0 ]; then
    # Test if endpoint is accessible (should return 400 for missing data, not 500)
    TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost/api/access-requests \
        -H "Content-Type: application/json" \
        -d '{}' 2>&1)
    
    if [ "$TEST_RESPONSE" = "400" ]; then
        echo -e "${GREEN}✓${NC} API endpoint is accessible (returned 400 for invalid request - expected)"
    elif [ "$TEST_RESPONSE" = "500" ]; then
        echo -e "${RED}✗${NC} API endpoint returned 500 (server error)"
        echo "   Check app logs for details"
    elif [ "$TEST_RESPONSE" = "000" ] || [ -z "$TEST_RESPONSE" ]; then
        echo -e "${RED}✗${NC} Cannot reach API endpoint (connection refused)"
        echo "   Make sure nginx is running and routing correctly"
    else
        echo -e "${YELLOW}⚠${NC} API endpoint returned: $TEST_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠${NC} Cannot test - app container not running"
fi
echo ""

# Summary
echo "========================================="
echo "SUMMARY & RECOMMENDATIONS"
echo "========================================="
echo ""

if [ -z "$RECAPTCHA_SECRET_KEY" ]; then
    echo -e "${YELLOW}⚠${NC} reCAPTCHA is not configured"
    echo "   If you want to use reCAPTCHA:"
    echo "   1. Get keys from https://www.google.com/recaptcha/admin"
    echo "   2. Add RECAPTCHA_SECRET_KEY to .env.production"
    echo "   3. Add NEXT_PUBLIC_RECAPTCHA_SITE_KEY to .env.production"
    echo "   4. Restart the app container"
    echo ""
fi

echo "Common issues and fixes:"
echo "1. reCAPTCHA errors:"
echo "   - Make sure NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set in .env.production"
echo "   - Make sure RECAPTCHA_SECRET_KEY is set in .env.production"
echo "   - Verify the keys match (site key and secret key from same reCAPTCHA setup)"
echo ""
echo "2. Database errors:"
echo "   - Check if access_requests table exists: $COMPOSE_CMD -f docker-compose.prod.yml exec db psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-personal_website} -c '\\dt access_requests'"
echo "   - Check database connection: $COMPOSE_CMD -f docker-compose.prod.yml exec app node -e \"require('./src/lib/db').query('SELECT 1').then(() => console.log('OK')).catch(e => console.error(e))\""
echo ""
echo "3. Network/CORS errors:"
echo "   - Check browser console for CORS errors"
echo "   - Verify the API endpoint URL is correct"
echo ""
echo "4. Rate limiting:"
echo "   - Maximum 3 access requests per hour per IP"
echo "   - Wait 1 hour or use a different IP if rate limited"
echo ""

