#!/bin/bash

# Script to check memory and swap, and help configure swap if needed
# This helps prevent build failures due to insufficient memory

set +e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "========================================="
echo "MEMORY AND SWAP CHECKER"
echo "========================================="
echo ""

# Check current memory
echo -e "${BLUE}[MEMORY STATUS]${NC}"
free -h
echo ""

# Check swap
echo -e "${BLUE}[SWAP STATUS]${NC}"
SWAP_INFO=$(swapon --show)
if [ -z "$SWAP_INFO" ]; then
    echo -e "${YELLOW}⚠ No swap space configured${NC}"
    echo ""
    echo "Swap space can help prevent build failures when memory is low."
    echo ""
    read -p "Would you like to create a 2GB swap file? (y/n): " create_swap
    
    if [ "$create_swap" = "y" ] || [ "$create_swap" = "Y" ]; then
        echo ""
        echo -e "${YELLOW}Creating 2GB swap file...${NC}"
        
        # Check if swap file already exists
        if [ -f /swapfile ]; then
            echo -e "${YELLOW}⚠ /swapfile already exists. Removing old swap...${NC}"
            swapoff /swapfile 2>/dev/null || true
            rm -f /swapfile
        fi
        
        # Create swap file
        sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        
        # Make it permanent
        if ! grep -q "/swapfile" /etc/fstab; then
            echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
        fi
        
        echo ""
        echo -e "${GREEN}✓ Swap file created and enabled${NC}"
        echo ""
        free -h
    else
        echo "Skipping swap creation."
    fi
else
    echo -e "${GREEN}✓ Swap is configured:${NC}"
    echo "$SWAP_INFO"
fi
echo ""

# Check available disk space
echo -e "${BLUE}[DISK SPACE]${NC}"
df -h / | tail -1
echo ""

# Memory recommendations
echo -e "${BLUE}[RECOMMENDATIONS]${NC}"
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}')

if [ "$TOTAL_MEM" -lt 4096 ]; then
    echo -e "${YELLOW}⚠ Total RAM is less than 4GB (${TOTAL_MEM}MB)${NC}"
    echo "   Consider:"
    echo "   - Adding swap space (2-4GB recommended)"
    echo "   - Reducing build memory limit to 2048MB in Dockerfile"
    echo "   - Building during off-peak hours"
elif [ "$TOTAL_MEM" -lt 8192 ]; then
    echo -e "${YELLOW}⚠ Total RAM is less than 8GB (${TOTAL_MEM}MB)${NC}"
    echo "   Consider:"
    echo "   - Adding swap space (2GB recommended)"
    echo "   - Current build memory limit (3072MB) should work"
else
    echo -e "${GREEN}✓ Total RAM is ${TOTAL_MEM}MB - should be sufficient${NC}"
fi

echo ""
echo "Current build memory limit: 3072MB"
echo "If builds still fail, you can:"
echo "  1. Increase swap space (run this script again)"
echo "  2. Reduce build memory to 2048MB in Dockerfile"
echo "  3. Build during off-peak hours when memory is more available"
echo ""

