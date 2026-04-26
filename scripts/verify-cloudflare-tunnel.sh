#!/bin/bash

# Verify Cloudflare Tunnel setup and diagnose HTTPS issues

set +e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "VERIFY CLOUDFLARE TUNNEL SETUP"
echo "========================================="
echo ""

# Check if cloudflared is installed
echo -e "${BLUE}[CHECK 1]${NC} Cloudflared installation..."
if command -v cloudflared >/dev/null 2>&1; then
    VERSION=$(cloudflared --version 2>&1 | head -n 1)
    echo -e "${GREEN}✓${NC} Cloudflared installed: $VERSION"
else
    echo -e "${RED}✗${NC} Cloudflared not found. Please install it first."
    exit 1
fi
echo ""

# Check config file
echo -e "${BLUE}[CHECK 2]${NC} Config file..."
CONFIG_FILE="/etc/cloudflared/config.yml"
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}✓${NC} Config file exists: $CONFIG_FILE"
    echo ""
    echo "Config contents:"
    echo "----------------------------------------"
    sudo cat "$CONFIG_FILE"
    echo "----------------------------------------"
    echo ""
    
    # Validate YAML syntax
    if sudo cloudflared tunnel --config "$CONFIG_FILE" info >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} YAML syntax is valid"
        TUNNEL_INFO=$(sudo cloudflared tunnel --config "$CONFIG_FILE" info 2>&1)
        echo "$TUNNEL_INFO"
    else
        echo -e "${RED}✗${NC} YAML syntax error:"
        sudo cloudflared tunnel --config "$CONFIG_FILE" info 2>&1 | head -n 5
    fi
else
    echo -e "${RED}✗${NC} Config file not found: $CONFIG_FILE"
fi
echo ""

# Check tunnel service
echo -e "${BLUE}[CHECK 3]${NC} Tunnel service status..."
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Cloudflared service is running"
    systemctl status cloudflared --no-pager -l | head -n 10
elif systemctl is-enabled --quiet cloudflared 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Cloudflared service is enabled but not running"
    echo "   Start it with: sudo systemctl start cloudflared"
else
    echo -e "${RED}✗${NC} Cloudflared service is not installed or enabled"
    echo "   Install with: sudo cloudflared service install"
fi
echo ""

# Check tunnel connection
echo -e "${BLUE}[CHECK 4]${NC} Tunnel connection..."
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    # Check if tunnel is actually connected
    TUNNEL_LOGS=$(sudo journalctl -u cloudflared --no-pager -n 20 2>&1)
    if echo "$TUNNEL_LOGS" | grep -q "Connection established\|INF" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Tunnel appears to be connected"
        echo "Recent logs:"
        echo "$TUNNEL_LOGS" | tail -n 5
    else
        echo -e "${YELLOW}⚠${NC} Tunnel status unclear. Recent logs:"
        echo "$TUNNEL_LOGS" | tail -n 10
    fi
else
    echo -e "${RED}✗${NC} Cannot check tunnel connection - service not running"
fi
echo ""

# Check credentials file
echo -e "${BLUE}[CHECK 5]${NC} Credentials file..."
CREDENTIALS_PATH=$(sudo grep "credentials-file:" "$CONFIG_FILE" 2>/dev/null | awk '{print $2}' | tr -d '"' | tr -d "'")
if [ -n "$CREDENTIALS_PATH" ]; then
    if [ -f "$CREDENTIALS_PATH" ]; then
        echo -e "${GREEN}✓${NC} Credentials file exists: $CREDENTIALS_PATH"
    else
        echo -e "${RED}✗${NC} Credentials file not found: $CREDENTIALS_PATH"
        echo "   Available files in /root/.cloudflared/:"
        sudo ls -la /root/.cloudflared/ 2>/dev/null || echo "   Directory not found"
    fi
else
    echo -e "${YELLOW}⚠${NC} Could not determine credentials file path from config"
fi
echo ""

# Check local service (nginx)
echo -e "${BLUE}[CHECK 6]${NC} Local service (nginx on port 80)..."
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:80 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓${NC} Nginx is responding on port 80"
else
    echo -e "${RED}✗${NC} Nginx is not responding on port 80"
    echo "   Check nginx status: docker-compose -f docker-compose.prod.yml ps nginx"
fi
echo ""

# Test HTTPS connectivity
echo -e "${BLUE}[CHECK 7]${NC} Testing HTTPS connectivity..."
echo ""
echo "Testing from server:"
HTTPS_TEST=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://www.willworkforlunch.com 2>&1)
if [ "$HTTPS_TEST" = "200" ] || [ "$HTTPS_TEST" = "301" ] || [ "$HTTPS_TEST" = "302" ]; then
    echo -e "${GREEN}✓${NC} HTTPS is working! HTTP status: $HTTPS_TEST"
elif [ "$HTTPS_TEST" = "000" ] || [ -z "$HTTPS_TEST" ]; then
    echo -e "${RED}✗${NC} HTTPS connection failed (timeout or connection refused)"
    echo "   This could indicate:"
    echo "   - Tunnel is not properly connected"
    echo "   - DNS hasn't propagated yet"
    echo "   - Cloudflare routing issue"
else
    echo -e "${YELLOW}⚠${NC} HTTPS returned status: $HTTPS_TEST"
fi
echo ""

# Test HTTP connectivity (should work)
echo -e "${BLUE}[CHECK 8]${NC} Testing HTTP connectivity..."
HTTP_TEST=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://www.willworkforlunch.com 2>&1)
if [ "$HTTP_TEST" = "200" ] || [ "$HTTP_TEST" = "301" ] || [ "$HTTP_TEST" = "302" ]; then
    echo -e "${GREEN}✓${NC} HTTP is working! HTTP status: $HTTP_TEST"
else
    echo -e "${YELLOW}⚠${NC} HTTP returned status: $HTTP_TEST"
fi
echo ""

# Check tunnel routing
echo -e "${BLUE}[CHECK 9]${NC} Checking tunnel routing configuration..."
if [ -f "$CONFIG_FILE" ]; then
    HOSTNAME=$(sudo grep -A 1 "hostname:" "$CONFIG_FILE" | grep "hostname:" | awk '{print $2}' | tr -d '"' | tr -d "'")
    SERVICE=$(sudo grep -A 2 "hostname:" "$CONFIG_FILE" | grep "service:" | awk '{print $2}' | tr -d '"' | tr -d "'")
    if [ -n "$HOSTNAME" ] && [ -n "$SERVICE" ]; then
        echo -e "${GREEN}✓${NC} Tunnel routing configured:"
        echo "   Hostname: $HOSTNAME"
        echo "   Service: $SERVICE"
    else
        echo -e "${RED}✗${NC} Could not determine tunnel routing from config"
    fi
fi
echo ""

# Summary and recommendations
echo "========================================="
echo "SUMMARY & RECOMMENDATIONS"
echo "========================================="
echo ""

if systemctl is-active --quiet cloudflared 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Tunnel service is running"
else
    echo -e "${RED}✗${NC} Tunnel service is NOT running"
    echo "   Fix: sudo systemctl start cloudflared"
    echo ""
fi

if [ "$HTTPS_TEST" != "200" ] && [ "$HTTPS_TEST" != "301" ] && [ "$HTTPS_TEST" != "302" ]; then
    echo -e "${YELLOW}⚠${NC} HTTPS is not working. Troubleshooting steps:"
    echo ""
    echo "1. Verify tunnel is connected:"
    echo "   sudo journalctl -u cloudflared -n 50 | grep -i 'connection\|error\|fail'"
    echo ""
    echo "2. Check for tunnel connection errors:"
    echo "   sudo journalctl -u cloudflared -f"
    echo "   Look for 'Connection established' or error messages"
    echo ""
    echo "3. Restart tunnel service:"
    echo "   sudo systemctl restart cloudflared"
    echo "   sudo systemctl status cloudflared"
    echo ""
    echo "4. Verify DNS propagation (from your local machine):"
    echo "   nslookup www.willworkforlunch.com"
    echo "   Should resolve to Cloudflare IPs (not your server IP)"
    echo ""
    echo "5. Check Cloudflare SSL/TLS mode:"
    echo "   - Dashboard → SSL/TLS → Overview"
    echo "   - Should be 'Full' or 'Full (strict)'"
    echo ""
    echo "6. Clear browser cache and try again"
    echo ""
else
    echo -e "${GREEN}✓${NC} HTTPS appears to be working!"
fi
echo ""

