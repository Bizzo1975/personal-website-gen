#!/bin/bash

# Get app logs without using tail command
# This script provides multiple methods to view logs

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

echo "========================================="
echo "GET APP LOGS (NO TAIL COMMAND)"
echo "========================================="
echo ""

# Check if app container is running
APP_STATUS=$($COMPOSE_CMD -f docker-compose.prod.yml ps app 2>&1 | grep -c "Up")
if [ "$APP_STATUS" -eq 0 ]; then
    echo -e "${RED}✗${NC} App container is not running"
    exit 1
fi

echo -e "${BLUE}[METHOD 1]${NC} Using docker-compose logs with --tail (Docker's built-in, not system tail)..."
echo "----------------------------------------"
$COMPOSE_CMD -f docker-compose.prod.yml logs app --tail 50 2>&1
echo "----------------------------------------"
echo ""

echo -e "${BLUE}[METHOD 2]${NC} Using head to get first 50 lines (recent logs are usually at the end)..."
echo "----------------------------------------"
$COMPOSE_CMD -f docker-compose.prod.yml logs app 2>&1 | head -n 50
echo "----------------------------------------"
echo ""

echo -e "${BLUE}[METHOD 3]${NC} Saving to file and reading with head..."
LOG_FILE="/tmp/app-logs-$(date +%s).txt"
$COMPOSE_CMD -f docker-compose.prod.yml logs app 2>&1 > "$LOG_FILE"
echo "Logs saved to: $LOG_FILE"
echo "First 100 lines:"
echo "----------------------------------------"
head -n 100 "$LOG_FILE"
echo "----------------------------------------"
echo ""
echo "To see more: head -n 200 $LOG_FILE"
echo "To see all: cat $LOG_FILE"
echo ""

echo -e "${BLUE}[METHOD 4]${NC} Using sed to get last 50 lines (if sed supports it)..."
echo "----------------------------------------"
$COMPOSE_CMD -f docker-compose.prod.yml logs app 2>&1 | sed -n '$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;$!N;50p'
echo "----------------------------------------"
echo ""

echo -e "${BLUE}[METHOD 5]${NC} Filtering for errors only..."
echo "----------------------------------------"
$COMPOSE_CMD -f docker-compose.prod.yml logs app 2>&1 | grep -i "error\|fail\|exception\|500\|access.request" | head -n 50
echo "----------------------------------------"
echo ""

echo -e "${BLUE}[METHOD 6]${NC} Using docker logs directly (if available)..."
APP_CONTAINER_ID=$($COMPOSE_CMD -f docker-compose.prod.yml ps -q app 2>/dev/null)
if [ -n "$APP_CONTAINER_ID" ]; then
    echo "Container ID: $APP_CONTAINER_ID"
    echo "----------------------------------------"
    docker logs "$APP_CONTAINER_ID" 2>&1 | head -n 50
    echo "----------------------------------------"
else
    echo "Could not get container ID"
fi
echo ""

echo "========================================="
echo "RECOMMENDED: Use METHOD 3 (save to file)"
echo "Then you can:"
echo "  - View with: cat $LOG_FILE"
echo "  - Search with: grep -i 'error' $LOG_FILE"
echo "  - View first N lines: head -n 100 $LOG_FILE"
echo "========================================="
echo ""

