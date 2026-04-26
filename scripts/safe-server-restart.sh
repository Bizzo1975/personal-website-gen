#!/bin/bash

# SAFE SERVER RESTART SCRIPT
# This ensures all data is safe before restarting the server
# Database data is in persistent volumes, so it's safe

set +e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "SAFE SERVER RESTART"
echo "========================================="
echo ""
echo -e "${YELLOW}⚠ IMPORTANT:${NC} This will restart the server."
echo "   Database data is stored in Docker volumes and will be preserved."
echo "   All containers will be stopped gracefully before restart."
echo ""

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR" || exit 1

# Load environment variables
if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
    export $(cat .env.production | grep -v '^#' | grep -v '^$' | grep '=' | xargs)
fi

# Step 1: Verify database volume exists
echo -e "${BLUE}[STEP 1/5]${NC} Verify database volume exists..."
DB_VOLUME=$(docker volume ls | grep -E "postgres_data|site_postgres_data" | awk '{print $2}' | head -1)
if [ -n "$DB_VOLUME" ]; then
    echo -e "${GREEN}✓${NC} Database volume found: $DB_VOLUME"
    echo "   This volume contains all your database data and will be preserved"
else
    echo -e "${YELLOW}⚠${NC} Database volume not found (may be first run)"
fi
echo ""

# Step 2: Stop all containers gracefully
echo -e "${BLUE}[STEP 2/5]${NC} Stop all containers gracefully..."
echo "   This ensures data is flushed to disk before shutdown"
$COMPOSE_CMD -f docker-compose.prod.yml down
sleep 3
echo -e "${GREEN}✓${NC} All containers stopped"
echo ""

# Step 3: Verify database volume still exists
echo -e "${BLUE}[STEP 3/5]${NC} Verify database volume is still safe..."
if [ -n "$DB_VOLUME" ]; then
    VOLUME_STILL_EXISTS=$(docker volume ls | grep -E "postgres_data|site_postgres_data" | awk '{print $2}' | head -1)
    if [ -n "$VOLUME_STILL_EXISTS" ]; then
        echo -e "${GREEN}✓${NC} Database volume is safe: $VOLUME_STILL_EXISTS"
    else
        echo -e "${RED}✗ ERROR: Database volume disappeared!${NC}"
        echo "   DO NOT RESTART - investigate this issue first!"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠${NC} No database volume found (first run - this is OK)"
fi
echo ""

# Step 4: Sync filesystem to ensure all data is written
echo -e "${BLUE}[STEP 4/5]${NC} Sync filesystem (ensure all data is written to disk)..."
sync
echo -e "${GREEN}✓${NC} Filesystem synced"
echo ""

# Step 5: Restart server
echo -e "${BLUE}[STEP 5/5]${NC} Restart server..."
echo ""
echo -e "${YELLOW}⚠${NC} The server will now restart."
echo "   After restart, run: ./scripts/rebuild-and-start-production.sh"
echo "   to start all services again."
echo ""
read -p "Press Enter to continue with restart (or Ctrl+C to cancel)..."
echo ""

# Restart the server
if [ "$EUID" -eq 0 ]; then
    # Running as root
    echo "Restarting server..."
    shutdown -r now
else
    # Not root - need sudo
    echo "Restarting server (requires sudo)..."
    sudo shutdown -r now
fi

