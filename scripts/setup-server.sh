#!/bin/bash

# Server Setup Script for Local Server
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
DEPLOY_USER="deploy"
SERVER_TYPE="local"  # local, vps, or cloud

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

# Function to check if running as root or with sudo
check_root() {
    if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
        print_error "This script must be run as root or with sudo privileges"
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

# Function to create deploy user
create_deploy_user() {
    print_status "Creating deploy user..."
    
    # Create user if it doesn't exist
    if ! id "$DEPLOY_USER" &>/dev/null; then
        adduser --disabled-password --gecos "" $DEPLOY_USER
        usermod -aG sudo $DEPLOY_USER
        print_success "Deploy user created"
    else
        print_warning "Deploy user already exists"
    fi
    
    # Setup SSH for deploy user
    mkdir -p /home/$DEPLOY_USER/.ssh
    cp ~/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/
    chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
    chmod 700 /home/$DEPLOY_USER/.ssh
    chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
    
    print_success "SSH setup completed for deploy user"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    print_success "Firewall configured"
}

# Function to secure SSH
secure_ssh() {
    print_status "Securing SSH configuration..."
    
    # Disable root login
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    
    # Disable password authentication
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    
    # Restart SSH service
    systemctl restart ssh
    
    print_success "SSH secured"
}

# Function to install fail2ban
install_fail2ban() {
    print_status "Installing fail2ban..."
    
    apt install -y fail2ban
    
    # Configure fail2ban
    cat > /etc/fail2ban/jail.local << 'EOF'
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
    
    systemctl enable fail2ban
    systemctl start fail2ban
    
    print_success "Fail2ban installed and configured"
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Start and enable Docker
    systemctl enable docker
    systemctl start docker
    
    # Add deploy user to docker group
    usermod -aG docker $DEPLOY_USER
    
    print_success "Docker installed"
}

# Function to install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    apt install -y docker-compose-plugin
    
    print_success "Docker Compose installed"
}

# Function to install Nginx
install_nginx() {
    print_status "Installing Nginx..."
    
    apt install -y nginx
    
    # Start and enable Nginx
    systemctl enable nginx
    systemctl start nginx
    
    print_success "Nginx installed"
}

# Function to install Certbot
install_certbot() {
    print_status "Installing Certbot..."
    
    apt install -y certbot python3-certbot-nginx
    
    print_success "Certbot installed"
}

# Function to install Node.js (for debugging)
install_nodejs() {
    print_status "Installing Node.js..."
    
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    print_success "Node.js installed"
}

# Function to create application directory
create_app_directory() {
    print_status "Creating application directory..."
    
    mkdir -p /home/$DEPLOY_USER/personal-website
    chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/personal-website
    
    print_success "Application directory created"
}

# Function to setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    cat > /etc/logrotate.d/personal-website << 'EOF'
/home/deploy/personal-website/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
}
EOF
    
    print_success "Log rotation configured"
}

# Function to create monitoring script
create_monitoring_script() {
    print_status "Creating monitoring script..."
    
    cat > /home/$DEPLOY_USER/health-check.sh << 'EOF'
#!/bin/bash

# Health check script for personal website
APP_DIR="/home/deploy/personal-website"
LOG_FILE="/home/deploy/health-check.log"

echo "$(date): Starting health check" >> $LOG_FILE

# Check if Docker is running
if ! systemctl is-active --quiet docker; then
    echo "$(date): ERROR - Docker is not running" >> $LOG_FILE
    systemctl start docker
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
DISK_USAGE=$(df /home | tail -1 | awk '{print $5}' | sed 's/%//')
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
    
    chmod +x /home/$DEPLOY_USER/health-check.sh
    chown $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/health-check.sh
    
    # Add to crontab (every 5 minutes)
    (crontab -u $DEPLOY_USER -l 2>/dev/null; echo "*/5 * * * * /home/$DEPLOY_USER/health-check.sh") | crontab -u $DEPLOY_USER -
    
    print_success "Monitoring script created"
}

# Function to display setup summary
display_summary() {
    print_success "Server setup completed successfully!"
    echo ""
    echo "=== SERVER SETUP SUMMARY ==="
    echo "Domain: $DOMAIN"
    echo "Deploy User: $DEPLOY_USER"
    echo "Application Directory: /home/$DEPLOY_USER/personal-website"
    echo "Backup Directory: /home/$DEPLOY_USER/backups"
    echo ""
    echo "=== INSTALLED SOFTWARE ==="
    echo "✓ Docker: $(docker --version)"
    echo "✓ Docker Compose: $(docker-compose --version)"
    echo "✓ Nginx: $(nginx -v 2>&1)"
    echo "✓ Certbot: $(certbot --version)"
    echo "✓ Node.js: $(node --version)"
    echo "✓ Fail2ban: $(fail2ban-client --version)"
    echo ""
    echo "=== NEXT STEPS ===""
    echo "1. Switch to deploy user: su - $DEPLOY_USER"
    echo "2. Clone your repository to /home/$DEPLOY_USER/personal-website"
    echo "3. Create .env.production file"
    echo "4. Run deployment script: ./scripts/deploy-production.sh"
    echo ""
    echo "=== SECURITY NOTES ==="
    echo "✓ SSH root login disabled"
    echo "✓ Password authentication disabled"
    echo "✓ Firewall configured (ports 22, 80, 443 open)"
    echo "✓ Fail2ban installed for intrusion prevention"
    echo ""
    echo "=== IMPORTANT ==="
    echo "Make sure you have SSH key access to the deploy user before logging out!"
}

# Main setup function
main() {
    print_status "Starting server setup for $DOMAIN"
    echo "Timestamp: $(date)"
    
    check_root
    update_system
    create_deploy_user
    configure_firewall
    secure_ssh
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
    
    print_success "Server setup completed successfully!"
}

# Run main function
main "$@"
