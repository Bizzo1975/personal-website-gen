#!/bin/bash

# Cleanup before restart - removes unnecessary Docker data to free memory
# SAFE: Does NOT touch database volumes or running containers

set +e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "CLEANUP BEFORE RESTART"
echo "========================================="
echo ""
echo -e "${YELLOW}⚠ SAFETY:${NC} This will remove:"
echo "   - Stopped containers"
echo "   - Unused images"
echo "   - Build cache"
echo "   - Dangling images"
echo ""
echo -e "${GREEN}✓ SAFE:${NC} This will NOT touch:"
echo "   - Running containers"
echo "   - Database volumes (your data is safe)"
echo "   - Redis volumes"
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

# Show current disk usage
echo -e "${BLUE}[BEFORE]${NC} Current Docker disk usage:"
docker system df
echo ""

# Step 1: Remove stopped containers (safe - they're not running)
echo -e "${BLUE}[STEP 1/4]${NC} Remove stopped containers..."
STOPPED_COUNT=$(docker ps -a --filter "status=exited" --format "{{.ID}}" | wc -l)
if [ "$STOPPED_COUNT" -gt 0 ]; then
    docker container prune -f
    echo -e "${GREEN}✓${NC} Removed stopped containers"
else
    echo -e "${GREEN}✓${NC} No stopped containers to remove"
fi
echo ""

# Step 2: Remove unused images (safe - only unused ones)
echo -e "${BLUE}[STEP 2/4]${NC} Remove unused images..."
echo "   This removes images not used by any container"
echo "   Your current app image (site_app:latest) will be kept if it's in use"
echo "   Removing orphaned <none> images (old build layers)..."
docker image prune -a -f
echo -e "${GREEN}✓${NC} Removed unused images"
echo ""

# Step 3: Remove build cache (safe - can be rebuilt)
echo -e "${BLUE}[STEP 3/4]${NC} Remove build cache..."
docker builder prune -a -f
echo -e "${GREEN}✓${NC} Removed build cache"
echo ""

# Step 4: Remove dangling images (safe - orphaned layers)
echo -e "${BLUE}[STEP 4/4]${NC} Remove dangling images..."
docker image prune -f
echo -e "${GREEN}✓${NC} Removed dangling images"
echo ""

# Show final disk usage
echo -e "${BLUE}[AFTER]${NC} Docker disk usage after cleanup:"
docker system df
echo ""

# Verify database volume is still safe
echo -e "${BLUE}[VERIFICATION]${NC} Verify database volume is safe..."
DB_VOLUME=$(docker volume ls | grep -E "postgres_data|site_postgres_data" | awk '{print $2}' | head -1)
if [ -n "$DB_VOLUME" ]; then
    echo -e "${GREEN}✓${NC} Database volume is safe: $DB_VOLUME"
    VOLUME_SIZE=$(docker volume inspect "$DB_VOLUME" --format '{{.Mountpoint}}' 2>/dev/null | xargs du -sh 2>/dev/null | awk '{print $1}' || echo "unknown")
    echo "   Volume size: $VOLUME_SIZE"
else
    echo -e "${YELLOW}⚠${NC} Database volume not found (may be first run)"
fi
echo ""

# Show running containers (these are safe)
echo -e "${BLUE}[RUNNING CONTAINERS]${NC} Current running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"
echo ""

echo "========================================="
echo "CLEANUP COMPLETE"
echo "========================================="
echo ""
echo "You can now safely restart the server."
echo "Run: ./scripts/safe-server-restart.sh"
echo ""

