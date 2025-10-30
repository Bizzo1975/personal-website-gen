#!/bin/bash

# Local Server Deployment Script for Personal Website
# This script automates the deployment process to your local server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="willworkforlunch.com"
APP_DIR="$HOME/personal-website"
BACKUP_DIR="$HOME/backups"
LOG_FILE="$HOME/deployment.log"

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        print_status "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        print_status "Run: sudo apt install docker-compose-plugin -y"
        exit 1
    fi
    
    # Check if .env.production exists
    if [ ! -f "$APP_DIR/.env.production" ]; then
        print_error ".env.production file not found. Please create it first."
        print_status "Copy config/env.production.template to .env.production and update with your values"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to create backup
create_backup() {
    print_status "Creating backup before deployment..."
    
    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
    mkdir -p $BACKUP_DIR
    
    # Database backup
    if docker-compose -f $APP_DIR/docker-compose.prod.yml ps db | grep -q "Up"; then
        docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T db pg_dump -U postgres personal_website | gzip > $BACKUP_DIR/database_$BACKUP_DATE.sql.gz
        print_success "Database backup created: database_$BACKUP_DATE.sql.gz"
    else
        print_warning "Database not running, skipping database backup"
    fi
    
    # Content backup
    if [ -d "$APP_DIR/public/uploads" ]; then
        tar -czf $BACKUP_DIR/content_$BACKUP_DATE.tar.gz -C $APP_DIR public/uploads public/images
        print_success "Content backup created: content_$BACKUP_DATE.tar.gz"
    fi
    
    # Config backup
    tar -czf $BACKUP_DIR/config_$BACKUP_DATE.tar.gz -C $APP_DIR .env.production docker-compose.prod.yml
    print_success "Config backup created: config_$BACKUP_DATE.tar.gz"
}

# Function to stop existing services
stop_services() {
    print_status "Stopping existing services..."
    
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml down || true
    print_success "Services stopped"
}

# Function to build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    cd $APP_DIR
    
    # Build the application
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check if services are running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if application is responding
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        print_success "Application health check passed"
    else
        print_warning "Application health check failed"
    fi
    
    # Check database connection
    if docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T db pg_isready -U postgres -d personal_website > /dev/null; then
        print_success "Database connection verified"
    else
        print_warning "Database connection check failed"
    fi
    
    # Check Redis connection
    if docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null; then
        print_success "Redis connection verified"
    else
        print_warning "Redis connection check failed"
    fi
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create backup script
    cat > $HOME/backup-production.sh << 'EOF'
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/backups"
mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f $HOME/personal-website/docker-compose.prod.yml exec -T db pg_dump -U postgres personal_website | gzip > $BACKUP_DIR/database_$BACKUP_DATE.sql.gz

# Content backup
tar -czf $BACKUP_DIR/content_$BACKUP_DATE.tar.gz -C $HOME/personal-website public/uploads public/images

# Config backup
tar -czf $BACKUP_DIR/config_$BACKUP_DATE.tar.gz -C $HOME/personal-website .env.production docker-compose.prod.yml

echo "Backup completed: $BACKUP_DATE"
EOF
    
    chmod +x $HOME/backup-production.sh
    
    # Setup cron job for daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * $HOME/backup-production.sh >> $HOME/backup.log 2>&1") | crontab -
    
    print_success "Monitoring setup completed"
}

# Function to display deployment summary
display_summary() {
    print_success "Deployment completed successfully!"
    echo ""
    echo "=== DEPLOYMENT SUMMARY ==="
    echo "Domain: https://$DOMAIN"
    echo "Application Directory: $APP_DIR"
    echo "Backup Directory: $BACKUP_DIR"
    echo "Log File: $LOG_FILE"
    echo ""
    echo "=== USEFUL COMMANDS ==="
    echo "View logs: docker-compose -f $APP_DIR/docker-compose.prod.yml logs -f"
    echo "Check status: docker-compose -f $APP_DIR/docker-compose.prod.yml ps"
    echo "Restart services: docker-compose -f $APP_DIR/docker-compose.prod.yml restart"
    echo "Run backup: $HOME/backup-production.sh"
    echo ""
    echo "=== NEXT STEPS ==="
    echo "1. Configure Nginx and SSL certificates"
    echo "2. Test all functionality"
    echo "3. Set up monitoring alerts"
    echo "4. Configure domain DNS records"
    echo ""
    echo "=== LOCAL SERVER NOTES ==="
    echo "- Ensure your router forwards ports 80 and 443 to this server"
    echo "- Update CloudFlare DNS with your server's public IP"
    echo "- Consider using CloudFlare Tunnel for additional security"
}

# Function to check if running as correct user
check_user() {
    if [ "$USER" = "root" ]; then
        print_warning "Running as root. Consider using a regular user for better security."
    fi
}

# Main deployment function
main() {
    print_status "Starting local server deployment for $DOMAIN"
    echo "Timestamp: $(date)" | tee -a $LOG_FILE
    
    check_user
    check_prerequisites
    create_backup
    stop_services
    deploy_services
    verify_deployment
    setup_monitoring
    display_summary
    
    print_success "Deployment completed successfully!"
}

# Run main function
main "$@"
