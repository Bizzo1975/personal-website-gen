#!/bin/bash

# HTTPS/SSL Diagnostic Script
# Run this on your production server to gather SSL/HTTPS diagnostic information

echo "=========================================="
echo "  HTTPS/SSL Diagnostic Information"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Nginx Container Status
echo "1. Nginx Container Status:"
echo "----------------------------------------"
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.prod.yml ps nginx 2>/dev/null || echo -e "${YELLOW}Nginx container not found or docker-compose not in current directory${NC}"
else
    echo -e "${RED}docker-compose not found${NC}"
fi
echo ""

# 2. Port 443 Status
echo "2. Port 443 Listening Status:"
echo "----------------------------------------"
if command -v ss &> /dev/null; then
    PORT443=$(sudo ss -tlnp 2>/dev/null | grep ':443 ' || echo "")
    if [ -z "$PORT443" ]; then
        echo -e "${RED}Port 443 is NOT listening${NC}"
    else
        echo -e "${GREEN}Port 443 is listening:${NC}"
        echo "$PORT443"
    fi
elif command -v netstat &> /dev/null; then
    PORT443=$(sudo netstat -tlnp 2>/dev/null | grep ':443 ' || echo "")
    if [ -z "$PORT443" ]; then
        echo -e "${RED}Port 443 is NOT listening${NC}"
    else
        echo -e "${GREEN}Port 443 is listening:${NC}"
        echo "$PORT443"
    fi
else
    echo -e "${YELLOW}Cannot check port status (ss/netstat not available)${NC}"
fi
echo ""

# 3. SSL Certificate Files
echo "3. SSL Certificate Files:"
echo "----------------------------------------"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check multiple possible locations
SSL_PATHS=(
    "$PROJECT_ROOT/ssl"
    "/opt/app/site/ssl"
    "/etc/letsencrypt"
    "/etc/nginx/ssl"
)

FOUND_CERTS=false
for SSL_PATH in "${SSL_PATHS[@]}"; do
    if [ -d "$SSL_PATH" ]; then
        echo -e "${GREEN}Found SSL directory: $SSL_PATH${NC}"
        find "$SSL_PATH" -name "*.pem" -o -name "*.crt" -o -name "*.key" 2>/dev/null | head -10
        FOUND_CERTS=true
    fi
done

if [ "$FOUND_CERTS" = false ]; then
    echo -e "${RED}No SSL certificate directories found${NC}"
    echo "Searched in:"
    for SSL_PATH in "${SSL_PATHS[@]}"; do
        echo "  - $SSL_PATH"
    done
fi
echo ""

# 4. Nginx SSL Configuration
echo "4. Nginx HTTPS Configuration:"
echo "----------------------------------------"
NGINX_CONF="$PROJECT_ROOT/nginx.conf"
if [ ! -f "$NGINX_CONF" ]; then
    NGINX_CONF="/opt/app/site/nginx.conf"
fi

if [ -f "$NGINX_CONF" ]; then
    HTTPS_BLOCK=$(grep -n "listen 443" "$NGINX_CONF" 2>/dev/null)
    if [ -z "$HTTPS_BLOCK" ]; then
        echo -e "${RED}No HTTPS server block found (listen 443)${NC}"
    else
        echo -e "${GREEN}HTTPS server block found at:${NC}"
        echo "$HTTPS_BLOCK"
    fi
    
    # Check if HTTPS block is commented out
    COMMENTED=$(grep -n "^[[:space:]]*#.*listen 443" "$NGINX_CONF" 2>/dev/null)
    if [ -n "$COMMENTED" ]; then
        echo -e "${YELLOW}⚠️  HTTPS server block appears to be COMMENTED OUT${NC}"
        echo "Commented lines:"
        echo "$COMMENTED" | head -3
    fi
else
    echo -e "${RED}nginx.conf not found at: $NGINX_CONF${NC}"
fi
echo ""

# 5. Docker Compose SSL Volumes
echo "5. Docker Compose SSL Volume Configuration:"
echo "----------------------------------------"
DOCKER_COMPOSE="$PROJECT_ROOT/docker-compose.prod.yml"
if [ ! -f "$DOCKER_COMPOSE" ]; then
    DOCKER_COMPOSE="/opt/app/site/docker-compose.prod.yml"
fi

if [ -f "$DOCKER_COMPOSE" ]; then
    SSL_VOLUMES=$(grep -A 10 "nginx:" "$DOCKER_COMPOSE" | grep -i "ssl\|cert" || echo "")
    if [ -z "$SSL_VOLUMES" ]; then
        echo -e "${YELLOW}No SSL certificate volumes found in docker-compose.prod.yml${NC}"
    else
        echo -e "${GREEN}SSL volumes found:${NC}"
        echo "$SSL_VOLUMES"
    fi
else
    echo -e "${RED}docker-compose.prod.yml not found${NC}"
fi
echo ""

# 6. CloudFlare Tunnel Status
echo "6. CloudFlare Tunnel Status:"
echo "----------------------------------------"
if command -v docker &> /dev/null; then
    CLOUDFLARE=$(docker ps | grep cloudflared || echo "")
    if [ -z "$CLOUDFLARE" ]; then
        echo -e "${YELLOW}CloudFlare tunnel container not running${NC}"
    else
        echo -e "${GREEN}CloudFlare tunnel is running:${NC}"
        echo "$CLOUDFLARE"
    fi
else
    echo -e "${RED}Docker not found${NC}"
fi
echo ""

# 7. Firewall Status
echo "7. Firewall Status (Port 443):"
echo "----------------------------------------"
if command -v ufw &> /dev/null; then
    UFW_443=$(sudo ufw status 2>/dev/null | grep "443" || echo "")
    if [ -z "$UFW_443" ]; then
        echo -e "${YELLOW}Port 443 not found in UFW rules${NC}"
    else
        echo -e "${GREEN}UFW port 443 status:${NC}"
        echo "$UFW_443"
    fi
elif command -v firewall-cmd &> /dev/null; then
    FIREWALLD_443=$(sudo firewall-cmd --list-ports 2>/dev/null | grep "443" || echo "")
    if [ -z "$FIREWALLD_443" ]; then
        echo -e "${YELLOW}Port 443 not found in firewalld rules${NC}"
    else
        echo -e "${GREEN}Firewalld port 443 status:${NC}"
        echo "$FIREWALLD_443"
    fi
else
    echo -e "${YELLOW}Cannot check firewall (ufw/firewall-cmd not available)${NC}"
fi
echo ""

# 8. External HTTPS Test
echo "8. External HTTPS Connection Test:"
echo "----------------------------------------"
if command -v curl &> /dev/null; then
    HTTPS_TEST=$(curl -I -k --connect-timeout 5 https://willworkforlunch.com 2>&1 | head -3)
    if echo "$HTTPS_TEST" | grep -q "HTTP"; then
        echo -e "${GREEN}HTTPS connection test:${NC}"
        echo "$HTTPS_TEST"
    else
        echo -e "${RED}HTTPS connection failed:${NC}"
        echo "$HTTPS_TEST"
    fi
else
    echo -e "${YELLOW}curl not available for HTTPS test${NC}"
fi
echo ""

# 9. DNS Configuration
echo "9. DNS Configuration:"
echo "----------------------------------------"
if command -v dig &> /dev/null; then
    DNS_RESULT=$(dig +short willworkforlunch.com 2>/dev/null)
    if [ -n "$DNS_RESULT" ]; then
        echo -e "${GREEN}DNS A record for willworkforlunch.com:${NC}"
        echo "$DNS_RESULT"
    else
        echo -e "${YELLOW}Could not resolve DNS${NC}"
    fi
elif command -v nslookup &> /dev/null; then
    DNS_RESULT=$(nslookup willworkforlunch.com 2>/dev/null | grep "Address:" | tail -1)
    if [ -n "$DNS_RESULT" ]; then
        echo -e "${GREEN}DNS lookup result:${NC}"
        echo "$DNS_RESULT"
    else
        echo -e "${YELLOW}Could not resolve DNS${NC}"
    fi
else
    echo -e "${YELLOW}DNS tools not available${NC}"
fi
echo ""

# 10. Certbot Status
echo "10. Certbot Status:"
echo "----------------------------------------"
if command -v certbot &> /dev/null; then
    CERTBOT_VERSION=$(certbot --version 2>/dev/null)
    echo -e "${GREEN}Certbot is installed:${NC}"
    echo "$CERTBOT_VERSION"
else
    echo -e "${YELLOW}Certbot is NOT installed${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "  Summary"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Review the information above"
echo "2. Determine your SSL certificate source:"
echo "   - Let's Encrypt (Certbot) - Recommended"
echo "   - CloudFlare SSL"
echo "   - Custom certificate"
echo "3. Share this output to enable HTTPS configuration"
echo ""

