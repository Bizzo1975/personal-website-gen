#!/bin/bash

# Comprehensive script to check and clean orphaned build artifacts
# SAFE: Shows what will be removed before removing anything
# Allows selective cleanup

set +e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "========================================="
echo "CHECK AND CLEAN BUILD ARTIFACTS"
echo "========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR" || exit 1

# Function to format bytes to human readable
format_size() {
    local size=$1
    if [ "$size" -lt 1024 ]; then
        echo "${size}B"
    elif [ "$size" -lt 1048576 ]; then
        echo "$((size / 1024))KB"
    elif [ "$size" -lt 1073741824 ]; then
        echo "$((size / 1048576))MB"
    else
        echo "$((size / 1073741824))GB"
    fi
}

# Function to get directory size
get_dir_size() {
    local dir=$1
    if [ -d "$dir" ]; then
        du -sb "$dir" 2>/dev/null | awk '{print $1}' || echo "0"
    else
        echo "0"
    fi
}

echo -e "${BLUE}[STEP 1]${NC} Checking disk space..."
echo ""
df -h / | tail -1
echo ""

TOTAL_CLEANUP_SIZE=0

# Check 1: Next.js build artifacts (.next folders)
echo -e "${BLUE}[CHECK 1]${NC} Next.js build artifacts (.next folders)"
NEXT_DIRS=$(find "$PROJECT_DIR" -type d -name ".next" 2>/dev/null)
if [ -n "$NEXT_DIRS" ]; then
    echo -e "${YELLOW}Found .next directories:${NC}"
    while IFS= read -r dir; do
        if [ -n "$dir" ]; then
            size=$(get_dir_size "$dir")
            size_human=$(format_size "$size")
            echo "  - $dir ($size_human)"
            TOTAL_CLEANUP_SIZE=$((TOTAL_CLEANUP_SIZE + size))
        fi
    done <<< "$NEXT_DIRS"
else
    echo -e "${GREEN}✓${NC} No .next directories found"
fi
echo ""

# Check 2: node_modules folders
echo -e "${BLUE}[CHECK 2]${NC} node_modules folders"
NODE_MODULES_DIRS=$(find "$PROJECT_DIR" -type d -name "node_modules" 2>/dev/null)
if [ -n "$NODE_MODULES_DIRS" ]; then
    echo -e "${YELLOW}Found node_modules directories:${NC}"
    while IFS= read -r dir; do
        if [ -n "$dir" ]; then
            size=$(get_dir_size "$dir")
            size_human=$(format_size "$size")
            echo "  - $dir ($size_human)"
            TOTAL_CLEANUP_SIZE=$((TOTAL_CLEANUP_SIZE + size))
        fi
    done <<< "$NODE_MODULES_DIRS"
else
    echo -e "${GREEN}✓${NC} No node_modules directories found"
fi
echo ""

# Check 3: Docker build cache
echo -e "${BLUE}[CHECK 3]${NC} Docker build cache"
BUILD_CACHE_SIZE=$(docker system df --format "{{.Size}}" 2>/dev/null | grep -E "GB|MB|KB" | head -1 || echo "0")
echo "  Docker build cache: $BUILD_CACHE_SIZE"
echo ""

# Check 4: Docker images (unused)
echo -e "${BLUE}[CHECK 4]${NC} Docker images (unused/dangling)"
UNUSED_IMAGES=$(docker images --filter "dangling=true" -q 2>/dev/null | wc -l)
if [ "$UNUSED_IMAGES" -gt 0 ]; then
    echo -e "${YELLOW}Found $UNUSED_IMAGES dangling images${NC}"
    docker images --filter "dangling=true" --format "  - {{.ID}} {{.Repository}}:{{.Tag}} ({{.Size}})"
else
    echo -e "${GREEN}✓${NC} No dangling images found"
fi
echo ""

# Check 5: Stopped containers
echo -e "${BLUE}[CHECK 5]${NC} Stopped containers"
STOPPED_CONTAINERS=$(docker ps -a --filter "status=exited" --format "{{.ID}}" 2>/dev/null | wc -l)
if [ "$STOPPED_CONTAINERS" -gt 0 ]; then
    echo -e "${YELLOW}Found $STOPPED_CONTAINERS stopped containers${NC}"
    docker ps -a --filter "status=exited" --format "  - {{.ID}} {{.Names}} ({{.Status}})"
else
    echo -e "${GREEN}✓${NC} No stopped containers found"
fi
echo ""

# Check 6: Old build logs
echo -e "${BLUE}[CHECK 6]${NC} Old build logs"
LOG_FILES=$(find "$PROJECT_DIR" -type f -name "*.log" -o -name "*debug*.log" 2>/dev/null | head -10)
if [ -n "$LOG_FILES" ]; then
    echo -e "${YELLOW}Found log files:${NC}"
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
            size_human=$(format_size "$size")
            echo "  - $file ($size_human)"
            TOTAL_CLEANUP_SIZE=$((TOTAL_CLEANUP_SIZE + size))
        fi
    done <<< "$LOG_FILES"
else
    echo -e "${GREEN}✓${NC} No log files found"
fi
echo ""

# Check 7: npm cache
echo -e "${BLUE}[CHECK 7]${NC} npm cache"
if command -v npm >/dev/null 2>&1; then
    NPM_CACHE_SIZE=$(npm cache verify 2>/dev/null | grep -oE "[0-9]+[KMGT]?B" | head -1 || echo "unknown")
    echo "  npm cache size: $NPM_CACHE_SIZE"
else
    echo "  npm not found (skipping)"
fi
echo ""

# Summary
TOTAL_CLEANUP_SIZE_HUMAN=$(format_size "$TOTAL_CLEANUP_SIZE")
echo "========================================="
echo -e "${CYAN}SUMMARY${NC}"
echo "========================================="
echo "Total potential cleanup: $TOTAL_CLEANUP_SIZE_HUMAN"
echo ""

# Show Docker system info
echo -e "${BLUE}[DOCKER SYSTEM INFO]${NC}"
docker system df
echo ""

# Interactive cleanup
echo "========================================="
echo -e "${YELLOW}INTERACTIVE CLEANUP${NC}"
echo "========================================="
echo ""
echo "What would you like to clean?"
echo ""
echo "1) Remove .next directories (Next.js build artifacts)"
echo "2) Remove node_modules directories (will need npm install after)"
echo "3) Clean Docker build cache"
echo "4) Remove unused Docker images"
echo "5) Remove stopped containers"
echo "6) Remove log files"
echo "7) Clean npm cache"
echo "8) Clean ALL (recommended before rebuild)"
echo "9) Exit without cleaning"
echo ""
read -p "Enter your choice (1-9): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}Removing .next directories...${NC}"
        find "$PROJECT_DIR" -type d -name ".next" -exec rm -rf {} + 2>/dev/null
        echo -e "${GREEN}✓${NC} Removed .next directories"
        ;;
    2)
        echo ""
        echo -e "${YELLOW}Removing node_modules directories...${NC}"
        find "$PROJECT_DIR" -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null
        echo -e "${GREEN}✓${NC} Removed node_modules directories"
        echo -e "${YELLOW}⚠${NC} You will need to run 'npm install' before building"
        ;;
    3)
        echo ""
        echo -e "${YELLOW}Cleaning Docker build cache...${NC}"
        docker builder prune -a -f
        echo -e "${GREEN}✓${NC} Cleaned Docker build cache"
        ;;
    4)
        echo ""
        echo -e "${YELLOW}Removing unused Docker images...${NC}"
        docker image prune -a -f
        echo -e "${GREEN}✓${NC} Removed unused Docker images"
        ;;
    5)
        echo ""
        echo -e "${YELLOW}Removing stopped containers...${NC}"
        docker container prune -f
        echo -e "${GREEN}✓${NC} Removed stopped containers"
        ;;
    6)
        echo ""
        echo -e "${YELLOW}Removing log files...${NC}"
        find "$PROJECT_DIR" -type f \( -name "*.log" -o -name "*debug*.log" \) -delete 2>/dev/null
        echo -e "${GREEN}✓${NC} Removed log files"
        ;;
    7)
        echo ""
        echo -e "${YELLOW}Cleaning npm cache...${NC}"
        if command -v npm >/dev/null 2>&1; then
            npm cache clean --force
            echo -e "${GREEN}✓${NC} Cleaned npm cache"
        else
            echo -e "${RED}✗${NC} npm not found"
        fi
        ;;
    8)
        echo ""
        echo -e "${YELLOW}Cleaning ALL artifacts...${NC}"
        echo ""
        
        echo "  Removing .next directories..."
        find "$PROJECT_DIR" -type d -name ".next" -exec rm -rf {} + 2>/dev/null
        echo -e "  ${GREEN}✓${NC} Removed .next directories"
        
        echo "  Removing node_modules directories..."
        find "$PROJECT_DIR" -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null
        echo -e "  ${GREEN}✓${NC} Removed node_modules directories"
        
        echo "  Cleaning Docker build cache..."
        docker builder prune -a -f 2>/dev/null
        echo -e "  ${GREEN}✓${NC} Cleaned Docker build cache"
        
        echo "  Removing unused Docker images..."
        docker image prune -a -f 2>/dev/null
        echo -e "  ${GREEN}✓${NC} Removed unused Docker images"
        
        echo "  Removing stopped containers..."
        docker container prune -f 2>/dev/null
        echo -e "  ${GREEN}✓${NC} Removed stopped containers"
        
        echo "  Removing log files..."
        find "$PROJECT_DIR" -type f \( -name "*.log" -o -name "*debug*.log" \) -delete 2>/dev/null
        echo -e "  ${GREEN}✓${NC} Removed log files"
        
        echo "  Cleaning npm cache..."
        if command -v npm >/dev/null 2>&1; then
            npm cache clean --force 2>/dev/null
            echo -e "  ${GREEN}✓${NC} Cleaned npm cache"
        fi
        
        echo ""
        echo -e "${GREEN}✓${NC} All cleanup complete!"
        ;;
    9)
        echo ""
        echo "Exiting without cleaning."
        exit 0
        ;;
    *)
        echo ""
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo -e "${GREEN}CLEANUP COMPLETE${NC}"
echo "========================================="
echo ""
echo "Disk space after cleanup:"
df -h / | tail -1
echo ""
echo "Docker system after cleanup:"
docker system df
echo ""
echo -e "${CYAN}You can now try building again.${NC}"
echo ""

