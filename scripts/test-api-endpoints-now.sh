#!/bin/bash

# Test the ACTUAL API endpoints RIGHT NOW (no rebuild needed)

set +e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "TEST API ENDPOINTS RIGHT NOW"
echo "========================================="
echo ""

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

# Test 1: /api/posts
echo -e "${BLUE}[TEST 1]${NC} Testing /api/posts..."
POSTS_RESPONSE=$(curl -s http://127.0.0.1/api/posts 2>&1)
POSTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/api/posts 2>&1)

echo "   HTTP Status: $POSTS_STATUS"
if [ "$POSTS_STATUS" = "200" ]; then
    if echo "$POSTS_RESPONSE" | grep -q '"error"'; then
        echo -e "${RED}✗${NC} API returned error:"
        echo "$POSTS_RESPONSE" | jq '.' 2>/dev/null || echo "$POSTS_RESPONSE" | head -5
    elif echo "$POSTS_RESPONSE" | grep -q '"posts"'; then
        POST_COUNT=$(echo "$POSTS_RESPONSE" | jq '.posts | length' 2>/dev/null || echo "$POSTS_RESPONSE" | grep -o '"posts":\[.*\]' | grep -o '{' | wc -l || echo "?")
        echo -e "${GREEN}✓${NC} API returned $POST_COUNT posts"
        echo "   Response preview:"
        echo "$POSTS_RESPONSE" | jq '.posts[0].title' 2>/dev/null || echo "$POSTS_RESPONSE" | head -3
    else
        echo -e "${YELLOW}⚠${NC} Unexpected response format:"
        echo "$POSTS_RESPONSE" | head -5
    fi
else
    echo -e "${RED}✗${NC} API failed with status $POSTS_STATUS"
    echo "   Response:"
    echo "$POSTS_RESPONSE" | head -5
fi
echo ""

# Test 2: /api/projects
echo -e "${BLUE}[TEST 2]${NC} Testing /api/projects..."
PROJECTS_RESPONSE=$(curl -s http://127.0.0.1/api/projects 2>&1)
PROJECTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/api/projects 2>&1)

echo "   HTTP Status: $PROJECTS_STATUS"
if [ "$PROJECTS_STATUS" = "200" ]; then
    if echo "$PROJECTS_RESPONSE" | grep -q '"error"'; then
        echo -e "${RED}✗${NC} API returned error:"
        echo "$PROJECTS_RESPONSE" | jq '.' 2>/dev/null || echo "$PROJECTS_RESPONSE" | head -5
    elif echo "$PROJECTS_RESPONSE" | grep -q '"projects"'; then
        PROJECT_COUNT=$(echo "$PROJECTS_RESPONSE" | jq '.projects | length' 2>/dev/null || echo "$PROJECTS_RESPONSE" | grep -o '"projects":\[.*\]' | grep -o '{' | wc -l || echo "?")
        echo -e "${GREEN}✓${NC} API returned $PROJECT_COUNT projects"
        echo "   Response preview:"
        echo "$PROJECTS_RESPONSE" | jq '.projects[0].title' 2>/dev/null || echo "$PROJECTS_RESPONSE" | head -3
    else
        echo -e "${YELLOW}⚠${NC} Unexpected response format:"
        echo "$PROJECTS_RESPONSE" | head -5
    fi
else
    echo -e "${RED}✗${NC} API failed with status $PROJECTS_STATUS"
    echo "   Response:"
    echo "$PROJECTS_RESPONSE" | head -5
fi
echo ""

# Test 3: Check app logs for errors
echo -e "${BLUE}[TEST 3]${NC} Check app logs for errors..."
RECENT_LOGS=$($COMPOSE_CMD -f docker-compose.prod.yml logs app --tail 50 2>&1)
ERRORS=$(echo "$RECENT_LOGS" | grep -iE "error|failed|exception" | grep -v "SMTP" | tail -10)

if [ -n "$ERRORS" ]; then
    echo -e "${RED}Found errors in logs:${NC}"
    echo "$ERRORS"
else
    echo -e "${GREEN}✓${NC} No errors in recent logs"
fi
echo ""

echo "========================================="
echo "SUMMARY"
echo "========================================="
echo ""
if [ "$POSTS_STATUS" = "200" ] && [ "$PROJECTS_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ APIs are working!${NC}"
    echo "   If data is missing, it's a filtering issue, not an API error"
elif [ "$POSTS_STATUS" != "200" ] || [ "$PROJECTS_STATUS" != "200" ]; then
    echo -e "${RED}✗ APIs are failing${NC}"
    echo "   Need to transfer fixes and rebuild"
fi
echo ""

