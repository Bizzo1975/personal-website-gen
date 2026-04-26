#!/bin/bash

# Server-Side Build Memory Fix Script
# This script helps fix SIGSEGV errors during Docker builds

set -e

echo "========================================="
echo "SERVER BUILD MEMORY FIX SCRIPT"
echo "========================================="
echo ""

# Step 1: Check Memory
echo "[STEP 1/5] Checking server memory and swap..."
echo ""
echo "--- Memory Status ---"
free -h
echo ""

echo "--- Swap Status ---"
swapon --show || echo "No swap configured"
echo ""

echo "--- Disk Space ---"
df -h / | tail -1
echo ""

# Step 2: Check if we have enough resources
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
SWAP_TOTAL=$(free -m | awk 'NR==3{printf "%.0f", $2}')

echo "Memory Summary:"
echo "  Total RAM: ${TOTAL_MEM}MB"
echo "  Available RAM: ${AVAILABLE_MEM}MB"
echo "  Total Swap: ${SWAP_TOTAL}MB"
echo ""

if [ "$AVAILABLE_MEM" -lt 2048 ]; then
    echo "⚠️  WARNING: Less than 2GB RAM available. Build may fail."
    echo "   Consider creating swap space (see Step 3)"
    echo ""
fi

if [ "$SWAP_TOTAL" -eq 0 ]; then
    echo "⚠️  WARNING: No swap space configured."
    echo "   Consider creating swap space (see Step 3)"
    echo ""
fi

read -p "Continue with cache cleanup? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Step 3: Clear npm cache
echo ""
echo "[STEP 2/5] Clearing npm cache..."
echo ""

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ Error: docker-compose not found"
    exit 1
fi

# Clear npm cache in container
echo "Clearing npm cache in Docker container..."
$DOCKER_COMPOSE_CMD run --rm app sh -c "npm cache clean --force" 2>/dev/null || echo "⚠️  Could not clear npm cache in container (container may not exist yet)"
echo "✅ npm cache cleared"
echo ""

# Step 4: Clear Docker build cache
echo "[STEP 3/5] Clearing Docker build cache..."
echo ""
read -p "This will clear ALL Docker build cache. Continue? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker builder prune -a -f
    echo "✅ Docker build cache cleared"
else
    echo "⏭️  Skipped Docker cache cleanup"
fi
echo ""

# Step 5: Check for swap and offer to create
echo "[STEP 4/5] Checking swap space..."
echo ""

if [ "$SWAP_TOTAL" -eq 0 ]; then
    echo "No swap space detected."
    read -p "Would you like to create a 4GB swap file? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Creating 4GB swap file..."
        
        # Check if swapfile already exists
        if [ -f /swapfile ]; then
            echo "⚠️  /swapfile already exists. Skipping swap creation."
        else
            sudo fallocate -l 4G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
            sudo chmod 600 /swapfile
            sudo mkswap /swapfile
            sudo swapon /swapfile
            
            # Make it permanent
            if ! grep -q "/swapfile" /etc/fstab; then
                echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
            fi
            
            echo "✅ Swap file created and enabled"
            echo "   New swap space: $(free -h | awk 'NR==3{print $2}')"
        fi
    else
        echo "⏭️  Skipped swap creation"
    fi
else
    echo "✅ Swap space is configured: ${SWAP_TOTAL}MB"
fi
echo ""

# Step 6: Clean build artifacts
echo "[STEP 5/5] Cleaning build artifacts..."
echo ""

# Remove .next directories
if [ -d ".next" ]; then
    echo "Removing .next directory..."
    rm -rf .next
    echo "✅ .next directory removed"
fi

# Remove node_modules in container (optional)
read -p "Remove node_modules from container? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    $DOCKER_COMPOSE_CMD run --rm app sh -c "rm -rf node_modules" 2>/dev/null || echo "⚠️  Could not remove node_modules (container may not exist)"
    echo "✅ node_modules removed"
fi
echo ""

# Final summary
echo "========================================="
echo "CLEANUP COMPLETE"
echo "========================================="
echo ""
echo "Current memory status:"
free -h
echo ""
echo "Next steps:"
echo "1. Review memory status above"
echo "2. If memory is low, consider increasing swap or server RAM"
echo "3. Run: ./scripts/rebuild-and-start-production.sh"
echo ""
echo "If build still fails with SIGSEGV:"
echo "- Check server has at least 4GB RAM + 2GB swap"
echo "- Consider building on a machine with more memory"
echo "- Check Docker logs: docker-compose logs app"
echo ""

