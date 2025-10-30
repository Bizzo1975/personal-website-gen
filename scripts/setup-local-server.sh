#!/bin/bash

# Local Server Setup Script for Personal Website
# This script prepares a local server for production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="willworkforlunch.com"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running with sudo
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        print_error "This script requires sudo privileges"
        print_status "Please run: sudo $0"
        exit 1
    fi
}

# Function to update system
update_system() {
    print_status "Updating system packages..."
    
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl wget git unzip htop
    
    print_success "System updated"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    
    print_success "Firewall configured"
}

# Function to install fail2ban
install_fail2ban() {
    print_status "Installing fail2ban..."
    
    sudo apt install -y fail2ban
    
    # Configure fail2ban
    sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF
    
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    
    print_success "Fail2ban installed and configured"
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Start and enable Docker
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed"
}

# Function to install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    sudo apt install -y docker-compose-plugin
    
    print_success "Docker Compose installed"
}

# Function to install Nginx
install_nginx() {
    print_status "Installing Nginx..."
    
    sudo apt install -y nginx
    
    # Start and enable Nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    print_success "Nginx installed"
}

# Function to install Certbot
install_certbot() {
    print_status "Installing Certbot..."
    
    sudo apt install -y certbot python3-certbot-nginx
    
    print_success "Certbot installed"
}

# Function to install Node.js (for debugging)
install_nodejs() {
    print_status "Installing Node.js..."
    
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
    sudo apt install -y nodejs
    
    print_success "Node.js installed"
}

# Function to create application directory
create_app_directory() {
    print_status "Creating application directory..."
    
    mkdir -p $HOME/personal-website
    chmod 755 $HOME/personal-website
    
    print_success "Application directory created"
}

# Function to setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    sudo tee /etc/logrotate.d/personal-website > /dev/null << EOF
$HOME/personal-website/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF
    
    print_success "Log rotation configured"
}

# Function to create monitoring script
create_monitoring_script() {
    print_status "Creating monitoring script..."
    
    cat > $HOME/health-check.sh << 'EOF'
#!/bin/bash

# Health check script for personal website
APP_DIR="$HOME/personal-website"
LOG_FILE="$HOME/health-check.log"

echo "$(date): Starting health check" >> $LOG_FILE

# Check if Docker is running
if ! systemctl is-active --quiet docker; then
    echo "$(date): ERROR - Docker is not running" >> $LOG_FILE
    sudo systemctl start docker
fi

# Check if application containers are running
cd $APP_DIR
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "$(date): Application containers are running" >> $LOG_FILE
else
    echo "$(date): ERROR - Application containers are not running" >> $LOG_FILE
    docker-compose -f docker-compose.prod.yml up -d
fi

# Check disk space
DISK_USAGE=$(df $HOME | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): WARNING - Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "$(date): WARNING - Memory usage is ${MEMORY_USAGE}%" >> $LOG_FILE
fi

echo "$(date): Health check completed" >> $LOG_FILE
EOF
    
    chmod +x $HOME/health-check.sh
    
    # Add to crontab (every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * $HOME/health-check.sh") | crontab -
    
    print_success "Monitoring script created"
}

# Function to display setup summary
display_summary() {
    print_success "Local server setup completed successfully!"
    echo ""
    echo "=== SERVER SETUP SUMMARY ==="
    echo "Domain: $DOMAIN"
    echo "Application Directory: $HOME/personal-website"
    echo "Backup Directory: $HOME/backups"
    echo ""
    echo "=== INSTALLED SOFTWARE ==="
    echo "✓ Docker: $(docker --version)"
    echo "✓ Docker Compose: $(docker-compose --version)"
    echo "✓ Nginx: $(nginx -v 2>&1)"
    echo "✓ Certbot: $(certbot --version)"
    echo "✓ Node.js: $(node --version)"
    echo "✓ Fail2ban: $(fail2ban-client --version)"
    echo ""
    echo "=== NEXT STEPS ==="
    echo "1. Clone your repository to $HOME/personal-website"
    echo "2. Create .env.production file"
    echo "3. Run deployment script: ./scripts/deploy-local-server.sh"
    echo ""
    echo "=== LOCAL SERVER NOTES ==="
    echo "✓ Firewall configured (ports 22, 80, 443 open)"
    echo "✓ Fail2ban installed for intrusion prevention"
    echo "✓ Docker and Docker Compose installed"
    echo "✓ Nginx and Certbot ready for SSL"
    echo ""
    echo "=== IMPORTANT ==="
    echo "1. Ensure your router forwards ports 80 and 443 to this server"
    echo "2. Update CloudFlare DNS with your server's public IP"
    echo "3. Consider using CloudFlare Tunnel for additional security"
    echo "4. Test all functionality before going live"
}

# Main setup function
main() {
    print_status "Starting local server setup for $DOMAIN"
    echo "Timestamp: $(date)"
    
    check_sudo
    update_system
    configure_firewall
    install_fail2ban
    install_docker
    install_docker_compose
    install_nginx
    install_certbot
    install_nodejs
    create_app_directory
    setup_log_rotation
    create_monitoring_script
    display_summary
    
    print_success "Local server setup completed successfully!"
}

# Run main function
main "$@"
