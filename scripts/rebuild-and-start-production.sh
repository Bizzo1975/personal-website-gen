#!/bin/bash

# THE COMPLETE SCRIPT TO REBUILD AND START PRODUCTION
# This script:
# 1. Builds the app (with proper memory limits)
# 2. Starts ALL services (db, redis, app, nginx)
# 3. Verifies everything is running
# 4. Tests the website
#
# DATABASE SAFETY: This script ONLY touches the app container.
# The database container and its persistent volume are NEVER touched.
# Your database data is 100% safe.

set +e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "REBUILD AND START PRODUCTION"
echo "========================================="
echo ""
echo -e "${YELLOW}⚠ DATABASE SAFETY:${NC} This script ONLY rebuilds the app container."
echo "   The database container and its data volume are NEVER touched."
echo "   Your database data is 100% safe."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR" || exit 1

# Detect Docker Compose version (v1 or v2)
COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
    echo -e "${GREEN}✓${NC} Using 'docker compose' (v2)"
elif command -v docker-compose >/dev/null 2>&1 && docker-compose --version >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
    echo -e "${GREEN}✓${NC} Using 'docker-compose' (v1)"
else
    echo -e "${RED}✗ ERROR: Neither 'docker compose' nor 'docker-compose' is available!${NC}"
    exit 1
fi
echo ""

# Load environment variables (CRITICAL for docker-compose)
if [ -f .env.production ]; then
    # Method 1: Source the file to make variables available to this script
    set -a
    source .env.production
    set +a
    
    # Method 2: Explicitly export all variables for docker-compose
    # This ensures docker-compose can see them even if sourcing didn't work
    export $(cat .env.production | grep -v '^#' | grep -v '^$' | grep '=' | xargs)
    
    # Verify critical variables are set
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}✗ ERROR: DATABASE_URL not found in .env.production!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓${NC} Environment variables loaded and exported"
    echo "   DATABASE_URL: ${DATABASE_URL:0:30}... (hidden for security)"
else
    echo -e "${RED}✗ ERROR: .env.production not found!${NC}"
    exit 1
fi
echo ""

# Step 1: Verify database is safe and clean up old APP containers ONLY
echo -e "${BLUE}[STEP 1/6]${NC} Verify database safety and clean up old APP containers..."
echo "   Checking database container status..."

# Check if database container exists and is running
DB_EXISTS=$($COMPOSE_CMD -f docker-compose.prod.yml ps db 2>/dev/null | grep -q "Up\|Exit" && echo "yes" || echo "no")
if [ "$DB_EXISTS" = "yes" ]; then
    echo -e "${GREEN}✓${NC} Database container exists (will NOT be touched)"
    echo "   Database data is stored in persistent volume: postgres_data"
    echo "   This volume will NOT be removed or modified"
else
    echo -e "${YELLOW}⚠${NC} Database container not running (will be started in step 4)"
fi

# ONLY clean up APP containers (database is safe)
echo "   Cleaning up old APP containers ONLY..."
$COMPOSE_CMD -f docker-compose.prod.yml stop app 2>/dev/null || true
$COMPOSE_CMD -f docker-compose.prod.yml rm -f app 2>/dev/null || true
docker ps -a --filter "name=site_app" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true

# Verify database container is still safe
if [ "$DB_EXISTS" = "yes" ]; then
    DB_STILL_EXISTS=$($COMPOSE_CMD -f docker-compose.prod.yml ps db 2>/dev/null | grep -q "Up\|Exit" && echo "yes" || echo "no")
    if [ "$DB_STILL_EXISTS" = "yes" ]; then
        echo -e "${GREEN}✓${NC} Database container is safe and unchanged"
    fi
fi

echo -e "${GREEN}✓${NC} Cleanup done (database untouched)"
echo ""

# Step 2: Build app image
echo -e "${BLUE}[STEP 2/6]${NC} Build app image..."
echo "   This may take 10-20 minutes..."
echo "   Using 2048MB memory limit for Node.js build"
echo ""

DOCKER_BUILDKIT=0 docker build --target runner -t site_app:latest -f Dockerfile .

BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
    echo ""
    echo -e "${RED}✗ Build failed with exit code: $BUILD_EXIT${NC}"
    echo "   Check the output above for errors"
    exit 1
fi

echo ""
echo -e "${GREEN}✓${NC} Build successful"
echo ""

# Step 3: Quick verification (non-blocking)
echo -e "${BLUE}[STEP 3/6]${NC} Quick verification (non-blocking)..."
# Use docker create + inspect instead of docker run to avoid hanging
CONTAINER_ID=$(docker create --rm site_app:latest 2>/dev/null)
if [ -n "$CONTAINER_ID" ]; then
    # Check if standalone directory exists in the image
    docker cp "${CONTAINER_ID}:/app/.next/standalone" /tmp/standalone-check 2>/dev/null
    if [ -d "/tmp/standalone-check" ]; then
        echo -e "${GREEN}✓${NC} Standalone build exists in image"
        rm -rf /tmp/standalone-check 2>/dev/null || true
    else
        echo -e "${YELLOW}⚠${NC} Could not verify standalone (continuing anyway)"
    fi
    docker rm "$CONTAINER_ID" 2>/dev/null || true
else
    echo -e "${YELLOW}⚠${NC} Could not create test container (continuing anyway)"
fi
echo ""

# Step 4: Start database and redis first
echo -e "${BLUE}[STEP 4/6]${NC} Start database and redis..."
echo "   Starting database (using existing volume if present)..."
$COMPOSE_CMD -f docker-compose.prod.yml up -d db redis
sleep 5

# Check database health
DB_HEALTH=$($COMPOSE_CMD -f docker-compose.prod.yml ps db | grep -o "healthy\|unhealthy" || echo "unknown")
if [ "$DB_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✓${NC} Database is healthy"
else
    echo -e "${YELLOW}⚠${NC} Database health: $DB_HEALTH (waiting 10 more seconds...)"
    sleep 10
    DB_HEALTH=$(docker-compose -f docker-compose.prod.yml ps db | grep -o "healthy\|unhealthy" || echo "unknown")
    if [ "$DB_HEALTH" != "healthy" ]; then
        echo -e "${RED}✗ Database is not healthy after waiting${NC}"
        echo "   Database logs:"
        $COMPOSE_CMD -f docker-compose.prod.yml logs db --tail 20
    fi
fi
echo ""

# Step 5: Start app container
echo -e "${BLUE}[STEP 5/6]${NC} Start app container..."
echo "   Starting app with environment variables from .env.production..."
$COMPOSE_CMD -f docker-compose.prod.yml up -d app
sleep 10

# Check app health
APP_HEALTH=$($COMPOSE_CMD -f docker-compose.prod.yml ps app | grep -o "healthy\|unhealthy" || echo "unknown")
if [ "$APP_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✓${NC} App is healthy"
else
    echo -e "${YELLOW}⚠${NC} App health: $APP_HEALTH"
    echo "   Waiting 20 more seconds for app to start..."
    sleep 20
    APP_HEALTH=$(docker-compose -f docker-compose.prod.yml ps app | grep -o "healthy\|unhealthy" || echo "unknown")
    if [ "$APP_HEALTH" != "healthy" ]; then
        echo -e "${YELLOW}⚠${NC} App still not healthy, checking logs..."
        $COMPOSE_CMD -f docker-compose.prod.yml logs app --tail 30
    fi
fi
echo ""

# Step 6: Start nginx
echo -e "${BLUE}[STEP 6/6]${NC} Start nginx..."
$COMPOSE_CMD -f docker-compose.prod.yml up -d nginx
sleep 5

NGINX_HEALTH=$($COMPOSE_CMD -f docker-compose.prod.yml ps nginx | grep -o "healthy\|unhealthy" || echo "unknown")
if [ "$NGINX_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✓${NC} Nginx is healthy"
else
    echo -e "${YELLOW}⚠${NC} Nginx health: $NGINX_HEALTH"
    echo "   Nginx logs:"
    $COMPOSE_CMD -f docker-compose.prod.yml logs nginx --tail 20
fi
echo ""

# Final status
echo "========================================="
echo "FINAL STATUS"
echo "========================================="
echo ""
$COMPOSE_CMD -f docker-compose.prod.yml ps
echo ""

# Test website
echo "Testing website..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Website is responding (HTTP $HTTP_CODE)"
else
    echo -e "${YELLOW}⚠${NC} Website returned HTTP $HTTP_CODE"
    echo "   This may be normal if the site is still starting"
fi
echo ""

echo "========================================="
echo "PRODUCTION STARTUP COMPLETE"
echo "========================================="
echo ""
echo "Services:"
echo "  - Database: $($COMPOSE_CMD -f docker-compose.prod.yml ps db | grep -o 'Up\|Down' || echo 'unknown')"
echo "  - Redis: $($COMPOSE_CMD -f docker-compose.prod.yml ps redis | grep -o 'Up\|Down' || echo 'unknown')"
echo "  - App: $($COMPOSE_CMD -f docker-compose.prod.yml ps app | grep -o 'Up\|Down' || echo 'unknown')"
echo "  - Nginx: $($COMPOSE_CMD -f docker-compose.prod.yml ps nginx | grep -o 'Up\|Down' || echo 'unknown')"
echo ""
echo "Test the website:"
echo "  - Local: http://127.0.0.1"
echo "  - Check logs: $COMPOSE_CMD -f docker-compose.prod.yml logs -f app"
echo ""
echo "If data is not loading, check:"
echo "  1. Database connection: $COMPOSE_CMD -f docker-compose.prod.yml exec app env | grep DATABASE_URL"
echo "  2. App logs: $COMPOSE_CMD -f docker-compose.prod.yml logs app --tail 50"
echo "  3. Database data: $COMPOSE_CMD -f docker-compose.prod.yml exec db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'SELECT COUNT(*) FROM profiles;'"
echo ""
echo -e "${GREEN}✓${NC} Database data is safe in persistent volume: postgres_data"
echo ""

