#!/bin/bash

# Install Dependencies for Personal Website
# This script installs Docker, Node.js, and other required dependencies

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
    echo "Personal Website - Dependencies Installation"
    echo "=========================================="
    echo ""
}

# Check if running as deploy user or root
check_user() {
    if [ "$USER" != "deploy" ] && [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as deploy user or root"
        exit 1
    fi
}

# Install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        print_warning "Docker is already installed"
        docker --version
        return
    fi
    
    # Update package database
    sudo apt update
    
    # Install prerequisites
    sudo apt install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package database again
    sudo apt update
    
    # Install Docker Engine
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add deploy user to docker group
    sudo usermod -aG docker deploy
    
    # Enable and start Docker service
    sudo systemctl enable docker
    sudo systemctl start docker
    
    print_success "Docker installed successfully"
    docker --version
}

# Install Docker Compose (standalone)
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    # Check if docker-compose is already installed
    if command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is already installed"
        docker-compose --version
        return
    fi
    
    # Get latest version
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Download Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Create symlink for easier access
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    print_success "Docker Compose installed successfully"
    docker-compose --version
}

# Install Node.js
install_nodejs() {
    print_status "Installing Node.js..."
    
    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        print_warning "Node.js is already installed"
        node --version
        npm --version
        return
    fi
    
    # Install Node.js 18.x LTS
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Verify installation
    print_success "Node.js installed successfully"
    node --version
    npm --version
    
    # Install global packages for development
    sudo npm install -g pm2
    
    print_success "PM2 process manager installed"
}

# Install PostgreSQL client tools
install_postgresql_tools() {
    print_status "Installing PostgreSQL client tools..."
    
    # Check if psql is already installed
    if command -v psql &> /dev/null; then
        print_warning "PostgreSQL tools are already installed"
        psql --version
        return
    fi
    
    # Install PostgreSQL client
    sudo apt install -y postgresql-client-15
    
    print_success "PostgreSQL client tools installed"
    psql --version
}

# Install Redis tools
install_redis_tools() {
    print_status "Installing Redis tools..."
    
    # Check if redis-cli is already installed
    if command -v redis-cli &> /dev/null; then
        print_warning "Redis tools are already installed"
        redis-cli --version
        return
    fi
    
    # Install Redis tools
    sudo apt install -y redis-tools
    
    print_success "Redis tools installed"
    redis-cli --version
}

# Install SSL tools
install_ssl_tools() {
    print_status "Installing SSL tools..."
    
    # Check if certbot is already installed
    if command -v certbot &> /dev/null; then
        print_warning "Certbot is already installed"
        certbot --version
        return
    fi
    
    # Install Certbot and Nginx plugin
    sudo apt install -y certbot python3-certbot-nginx
    
    print_success "SSL tools installed"
    certbot --version
}

# Install monitoring tools
install_monitoring_tools() {
    print_status "Installing monitoring tools..."
    
    # Install system monitoring tools
    sudo apt install -y \
        htop \
        iotop \
        nethogs \
        nload \
        ncdu \
        tree \
        jq \
        curl \
        wget \
        vim \
        nano
    
    print_success "Monitoring tools installed"
}

# Install backup tools
install_backup_tools() {
    print_status "Installing backup tools..."
    
    # Install backup and compression tools
    sudo apt install -y \
        rsync \
        gzip \
        tar \
        zip \
        unzip \
        awscli
    
    print_success "Backup tools installed"
}

# Configure Docker for production
configure_docker() {
    print_status "Configuring Docker for production..."
    
    # Create Docker daemon configuration
    sudo mkdir -p /etc/docker
    
    cat | sudo tee /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "userland-proxy": false,
  "live-restore": true,
  "default-address-pools": [
    {
      "base": "172.20.0.0/16",
      "size": 24
    }
  ]
}
EOF
    
    # Restart Docker to apply configuration
    sudo systemctl restart docker
    
    # Configure Docker to start on boot
    sudo systemctl enable docker
    
    print_success "Docker configured for production"
}

# Install Git LFS (Large File Storage)
install_git_lfs() {
    print_status "Installing Git LFS..."
    
    # Check if git-lfs is already installed
    if command -v git-lfs &> /dev/null; then
        print_warning "Git LFS is already installed"
        git lfs version
        return
    fi
    
    # Install Git LFS
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
    sudo apt install -y git-lfs
    
    print_success "Git LFS installed"
    git lfs version
}

# Setup development tools
setup_dev_tools() {
    print_status "Setting up development tools..."
    
    # Create useful aliases for deploy user
    cat >> /home/deploy/.bashrc << 'EOF'

# Personal Website aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# Docker aliases
alias dps='docker ps'
alias dpsa='docker ps -a'
alias di='docker images'
alias dcu='docker-compose up'
alias dcd='docker-compose down'
alias dcl='docker-compose logs'
alias dcr='docker-compose restart'

# Application aliases
alias cdapp='cd /home/deploy/personal-website'
alias logs='docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml logs'
alias status='docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml ps'
alias backup='sudo /home/deploy/backup-complete.sh'

# System monitoring
alias sysinfo='/home/deploy/system-status.sh'
alias diskspace='df -h'
alias meminfo='free -h'
alias cpuinfo='lscpu'
EOF
    
    # Set correct ownership
    chown deploy:deploy /home/deploy/.bashrc
    
    print_success "Development tools configured"
}

# Test all installations
test_installations() {
    print_status "Testing installations..."
    
    local errors=()
    
    # Test Docker
    if ! docker --version &> /dev/null; then
        errors+=("Docker")
    fi
    
    # Test Docker Compose
    if ! docker-compose --version &> /dev/null; then
        errors+=("Docker Compose")
    fi
    
    # Test Node.js
    if ! node --version &> /dev/null; then
        errors+=("Node.js")
    fi
    
    # Test npm
    if ! npm --version &> /dev/null; then
        errors+=("npm")
    fi
    
    # Test PostgreSQL tools
    if ! psql --version &> /dev/null; then
        errors+=("PostgreSQL tools")
    fi
    
    # Test SSL tools
    if ! certbot --version &> /dev/null; then
        errors+=("Certbot")
    fi
    
    if [ ${#errors[@]} -eq 0 ]; then
        print_success "All installations verified successfully!"
    else
        print_error "Installation verification failed for: ${errors[*]}"
        exit 1
    fi
}

# Generate installation report
generate_install_report() {
    local report_file="/home/deploy/dependencies-install-report.txt"
    
    cat > "$report_file" << EOF
================================================================================
DEPENDENCIES INSTALLATION REPORT
================================================================================

Installation Date: $(date)
Server: $(hostname)

INSTALLED COMPONENTS:
✓ Docker: $(docker --version 2>/dev/null || echo "Failed")
✓ Docker Compose: $(docker-compose --version 2>/dev/null || echo "Failed")
✓ Node.js: $(node --version 2>/dev/null || echo "Failed")
✓ npm: $(npm --version 2>/dev/null || echo "Failed")
✓ PM2: $(pm2 --version 2>/dev/null || echo "Failed")
✓ PostgreSQL tools: $(psql --version 2>/dev/null || echo "Failed")
✓ Redis tools: $(redis-cli --version 2>/dev/null || echo "Failed")
✓ Certbot: $(certbot --version 2>/dev/null || echo "Failed")
✓ Git LFS: $(git lfs version 2>/dev/null || echo "Failed")

DOCKER CONFIGURATION:
- Log rotation enabled (10MB max, 3 files)
- Storage driver: overlay2
- Production optimizations applied
- Auto-start on boot enabled

USER CONFIGURATION:
- Deploy user added to docker group
- Useful aliases configured
- Development tools setup

NEXT STEPS:
1. Logout and login again for group changes to take effect
2. Test Docker access: docker ps
3. Run configure-security.sh for additional hardening
4. Deploy application using deployment scripts

================================================================================
EOF
    
    chown deploy:deploy "$report_file"
    
    print_success "Installation report generated: $report_file"
}

# Main execution
main() {
    print_header
    
    check_user
    install_docker
    install_docker_compose
    install_nodejs
    install_postgresql_tools
    install_redis_tools
    install_ssl_tools
    install_monitoring_tools
    install_backup_tools
    configure_docker
    install_git_lfs
    setup_dev_tools
    test_installations
    generate_install_report
    
    print_success "Dependencies installation completed successfully!"
    print_warning "IMPORTANT: Logout and login again for Docker group changes to take effect"
    print_status "Next: Run configure-security.sh for additional security hardening"
}

# Run main function
main "$@" 