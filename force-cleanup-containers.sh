#!/bin/bash

# Force cleanup script for stuck Docker containers
# This script forcefully removes containers that can't be stopped normally

echo "=========================================="
echo "Force Cleanup of Stuck Docker Containers"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

print_status "Finding all personal-website-gen containers..."
CONTAINER_IDS=$(docker ps -a --filter "name=personal-website-gen" --format "{{.ID}}")

if [ -z "$CONTAINER_IDS" ]; then
    print_success "No containers found to clean up"
    exit 0
fi

print_status "Found containers:"
docker ps -a --filter "name=personal-website-gen" --format "  {{.Names}} ({{.ID}}) - {{.Status}}"

echo ""
print_status "Killing containerd-shim processes for these containers..."

for CONTAINER_ID in $CONTAINER_IDS; do
    print_status "Processing container: $CONTAINER_ID"
    
    # Find containerd-shim process for this container
    SHIM_PIDS=$(ps aux | grep "containerd-shim.*$CONTAINER_ID" | grep -v grep | awk '{print $2}')
    
    if [ -n "$SHIM_PIDS" ]; then
        for SHIM_PID in $SHIM_PIDS; do
            print_status "  Killing containerd-shim process: $SHIM_PID"
            kill -9 "$SHIM_PID" 2>/dev/null && print_success "    Killed PID $SHIM_PID" || print_error "    Failed to kill PID $SHIM_PID"
        done
        sleep 1
    fi
    
    # Force remove container
    print_status "  Force removing container: $CONTAINER_ID"
    docker rm -f "$CONTAINER_ID" 2>&1 && print_success "    Removed container $CONTAINER_ID" || print_error "    Failed to remove container $CONTAINER_ID"
done

sleep 2

print_status "Cleaning up network..."
# Remove network if it exists and has no active endpoints
docker network rm personal-website-gen_app-network 2>/dev/null && print_success "Network removed" || print_status "Network cleanup (may have active endpoints, that's OK)"

print_status "Cleaning up any remaining containerd-shim processes..."
REMAINING_SHIMS=$(ps aux | grep "containerd-shim.*personal-website-gen" | grep -v grep | awk '{print $2}')
if [ -n "$REMAINING_SHIMS" ]; then
    for PID in $REMAINING_SHIMS; do
        kill -9 "$PID" 2>/dev/null && print_success "Killed remaining shim process: $PID"
    done
fi

echo ""
print_success "Cleanup completed!"
print_status "You can now run: ./startup-all.sh"

