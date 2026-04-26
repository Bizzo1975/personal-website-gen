#!/bin/bash

# Install Cloudflared on Ubuntu/Debian
# This script installs cloudflared from Cloudflare's official releases

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "INSTALL CLOUDFLARED"
echo "========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗${NC} This script must be run as root or with sudo"
    echo "   Run: sudo $0"
    exit 1
fi

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    ARCH="amd64"
elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    ARCH="arm64"
else
    echo -e "${RED}✗${NC} Unsupported architecture: $ARCH"
    exit 1
fi

echo -e "${BLUE}[STEP 1]${NC} Detecting architecture..."
echo "   Architecture: $ARCH"
echo ""

echo -e "${BLUE}[STEP 2]${NC} Downloading cloudflared..."
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Get latest version URL
LATEST_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb"

echo "   Downloading from: $LATEST_URL"
wget -q "$LATEST_URL" -O cloudflared.deb

if [ ! -f cloudflared.deb ]; then
    echo -e "${RED}✗${NC} Failed to download cloudflared"
    exit 1
fi

echo -e "${GREEN}✓${NC} Download complete"
echo ""

echo -e "${BLUE}[STEP 3]${NC} Installing cloudflared..."
dpkg -i cloudflared.deb || {
    echo -e "${YELLOW}⚠${NC} Some dependencies may be missing, fixing..."
    apt-get install -f -y
}

echo -e "${GREEN}✓${NC} Installation complete"
echo ""

echo -e "${BLUE}[STEP 4]${NC} Verifying installation..."
VERSION=$(cloudflared --version 2>&1 | head -1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} cloudflared installed successfully"
    echo "   Version: $VERSION"
else
    echo -e "${RED}✗${NC} Installation verification failed"
    exit 1
fi

# Cleanup
cd /
rm -rf "$TEMP_DIR"

echo ""
echo "========================================="
echo "INSTALLATION COMPLETE"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Authenticate: sudo cloudflared tunnel login"
echo "  2. Create tunnel: sudo cloudflared tunnel create webnode-01"
echo "  3. Configure tunnel: See Proxmox_Web_Hosting_Master_Plan_Full.md Step 8"
echo ""

