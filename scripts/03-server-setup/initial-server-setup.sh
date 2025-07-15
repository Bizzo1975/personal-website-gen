#!/bin/bash

# Initial Server Setup for Personal Website
# This script configures a fresh Digital Ocean droplet for production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_header() {
    echo ""
    echo "=========================================="
    echo "Personal Website - Initial Server Setup"
    echo "=========================================="
    echo ""
}

# Check if running as root
check_user() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Update system packages
update_system() {
    print_status "Updating system packages..."
    
    apt update
    apt upgrade -y
    
    print_success "System packages updated"
}

# Create deploy user
create_deploy_user() {
    print_status "Setting up deploy user..."
    
    # Check if deploy user already exists
    if id "deploy" &>/dev/null; then
        print_warning "Deploy user already exists, skipping creation"
        return
    fi
    
    # Create deploy user
    adduser --disabled-password --gecos "" deploy
    
    # Add to sudo group
    usermod -aG sudo deploy
    
    # Create .ssh directory for deploy user
    mkdir -p /home/deploy/.ssh
    
    # Copy root's authorized_keys to deploy user (if exists)
    if [ -f /root/.ssh/authorized_keys ]; then
        cp /root/.ssh/authorized_keys /home/deploy/.ssh/
        chown -R deploy:deploy /home/deploy/.ssh
        chmod 700 /home/deploy/.ssh
        chmod 600 /home/deploy/.ssh/authorized_keys
        print_success "SSH keys copied to deploy user"
    else
        print_warning "No SSH keys found in /root/.ssh/authorized_keys"
        print_warning "You may need to manually configure SSH access for the deploy user"
    fi
    
    print_success "Deploy user created and configured"
}

# Configure SSH security
configure_ssh() {
    print_status "Configuring SSH security..."
    
    # Backup original SSH config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Update SSH configuration
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    
    # Add additional security settings
    echo "" >> /etc/ssh/sshd_config
    echo "# Additional security settings" >> /etc/ssh/sshd_config
    echo "MaxAuthTries 3" >> /etc/ssh/sshd_config
    echo "ClientAliveInterval 300" >> /etc/ssh/sshd_config
    echo "ClientAliveCountMax 2" >> /etc/ssh/sshd_config
    echo "AllowUsers deploy" >> /etc/ssh/sshd_config
    
    # Test SSH configuration
    sshd -t
    
    # Restart SSH service
    systemctl restart ssh
    
    print_success "SSH security configured"
}

# Configure firewall
configure_firewall() {
    print_status "Configuring UFW firewall..."
    
    # Set default policies
    ufw --force default deny incoming
    ufw --force default allow outgoing
    
    # Allow SSH, HTTP, and HTTPS
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall
    ufw --force enable
    
    print_success "Firewall configured and enabled"
}

# Install fail2ban for additional security
install_fail2ban() {
    print_status "Installing and configuring fail2ban..."
    
    apt install fail2ban -y
    
    # Create custom jail configuration
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 24h

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 1h

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6
bantime = 1h

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 24h
EOF
    
    # Start and enable fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    
    print_success "Fail2ban installed and configured"
}

# Install essential packages
install_essential_packages() {
    print_status "Installing essential packages..."
    
    apt install -y \
        htop \
        curl \
        wget \
        unzip \
        git \
        nginx \
        certbot \
        python3-certbot-nginx \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        logrotate \
        cron
    
    print_success "Essential packages installed"
}

# Configure timezone
configure_timezone() {
    print_status "Configuring timezone..."
    
    # Set timezone to UTC (recommended for servers)
    timedatectl set-timezone UTC
    
    print_success "Timezone set to UTC"
}

# Configure automatic updates
configure_auto_updates() {
    print_status "Configuring automatic security updates..."
    
    apt install unattended-upgrades -y
    
    # Enable automatic updates
    dpkg-reconfigure -plow unattended-upgrades
    
    # Configure automatic updates for security packages only
    cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
    
    print_success "Automatic security updates configured"
}

# Create directory structure
create_directory_structure() {
    print_status "Creating directory structure..."
    
    # Create application directories
    mkdir -p /home/deploy/personal-website
    mkdir -p /home/deploy/backups
    mkdir -p /home/deploy/ssl
    mkdir -p /home/deploy/logs
    mkdir -p /var/log/deployment
    
    # Set correct ownership
    chown -R deploy:deploy /home/deploy
    chown deploy:deploy /var/log/deployment
    
    print_success "Directory structure created"
}

# Configure log rotation
configure_log_rotation() {
    print_status "Configuring log rotation..."
    
    # Create logrotate configuration for deployment logs
    cat > /etc/logrotate.d/personal-website << 'EOF'
/home/deploy/logs/*.log {
    weekly
    missingok
    rotate 12
    compress
    delaycompress
    notifempty
    copytruncate
}

/var/log/deployment/*.log {
    weekly
    missingok
    rotate 12
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
    
    print_success "Log rotation configured"
}

# Enable and configure swapfile (for better performance)
configure_swap() {
    print_status "Configuring swap file..."
    
    # Check if swap already exists
    if swapon --show | grep -q "/swapfile"; then
        print_warning "Swap file already exists, skipping"
        return
    fi
    
    # Create 2GB swap file
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Make swap permanent
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    
    # Configure swappiness
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    
    print_success "Swap file configured (2GB)"
}

# Set up system monitoring
setup_monitoring() {
    print_status "Setting up basic system monitoring..."
    
    # Create simple system monitoring script
    cat > /home/deploy/system-status.sh << 'EOF'
#!/bin/bash

echo "=== SYSTEM STATUS REPORT ==="
echo "Date: $(date)"
echo ""

echo "=== DISK USAGE ==="
df -h | grep -E '^/dev|^tmpfs'
echo ""

echo "=== MEMORY USAGE ==="
free -h
echo ""

echo "=== CPU LOAD ==="
uptime
echo ""

echo "=== ACTIVE CONNECTIONS ==="
ss -tuln | head -20
echo ""

echo "=== RECENT LOGINS ==="
last -n 10
echo ""

echo "=== SYSTEM UPTIME ==="
uptime
echo ""
EOF
    
    chmod +x /home/deploy/system-status.sh
    chown deploy:deploy /home/deploy/system-status.sh
    
    print_success "System monitoring setup complete"
}

# Generate setup report
generate_setup_report() {
    local report_file="/home/deploy/server-setup-report.txt"
    
    cat > "$report_file" << EOF
================================================================================
SERVER SETUP REPORT
================================================================================

Setup Date: $(date)
Server: $(hostname)
OS: $(lsb_release -d | cut -f2)
Kernel: $(uname -r)

COMPLETED TASKS:
✓ System packages updated
✓ Deploy user created and configured
✓ SSH security hardened
✓ UFW firewall configured
✓ Fail2ban installed
✓ Essential packages installed
✓ Timezone set to UTC
✓ Automatic updates configured
✓ Directory structure created
✓ Log rotation configured
✓ Swap file configured (2GB)
✓ System monitoring setup

SECURITY SETTINGS:
- Root login disabled via SSH
- Password authentication disabled
- SSH limited to deploy user only
- UFW firewall active (SSH, HTTP, HTTPS allowed)
- Fail2ban active for SSH and web protection
- Automatic security updates enabled

NEXT STEPS:
1. Test SSH access with deploy user
2. Run install-dependencies.sh to install Docker and Node.js
3. Run configure-security.sh for additional hardening
4. Deploy application using deployment scripts

ACCESS:
- SSH: ssh deploy@$(curl -s ifconfig.me)
- Deploy user has sudo privileges
- Application directory: /home/deploy/personal-website
- Backups directory: /home/deploy/backups

================================================================================
EOF
    
    chown deploy:deploy "$report_file"
    
    print_success "Setup report generated: $report_file"
}

# Main execution
main() {
    print_header
    
    check_user
    update_system
    create_deploy_user
    configure_ssh
    configure_firewall
    install_fail2ban
    install_essential_packages
    configure_timezone
    configure_auto_updates
    create_directory_structure
    configure_log_rotation
    configure_swap
    setup_monitoring
    generate_setup_report
    
    print_success "Initial server setup completed successfully!"
    print_warning "IMPORTANT: Test SSH access with deploy user before logging out as root"
    print_status "Next: Run install-dependencies.sh to install Docker and Node.js"
}

# Run main function
main "$@" 