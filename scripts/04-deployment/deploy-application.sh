#!/bin/bash

# Deploy Personal Website Application to Production
# This script deploys the application to the production server

set -e  # Exit on any error

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/deployment/deploy_$TIMESTAMP.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo ""
    echo "=========================================="
    echo "Personal Website - Application Deployment"
    echo "=========================================="
    echo ""
}

# Ensure log directory exists
setup_logging() {
    sudo mkdir -p /var/log/deployment
    sudo chown deploy:deploy /var/log/deployment
    touch "$LOG_FILE"
}

# Get deployment configuration
get_config() {
    print_status "Loading deployment configuration..."
    
    # Domain configuration
    DOMAIN_NAME=${DOMAIN_NAME:-willworkforlunch.com}
    ADMIN_EMAIL=${ADMIN_EMAIL:-admin@willworkforlunch.com}
    
    # Application directory
    APP_DIR="/home/deploy/personal-website"
    
    # Database configuration
    DB_PASSWORD=${POSTGRES_PASSWORD:-$(openssl rand -hex 16)}
    REDIS_PASSWORD=${REDIS_PASSWORD:-$(openssl rand -hex 16)}
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-$(openssl rand -hex 32)}
    CRON_SECRET=${CRON_SECRET:-$(openssl rand -hex 16)}
    
    print_status "Configuration loaded for domain: $DOMAIN_NAME"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if running as deploy user
    if [ "$USER" != "deploy" ]; then
        print_error "This script must be run as the deploy user"
        exit 1
    fi
    
    # Check required tools
    local missing_tools=()
    
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v docker-compose >/dev/null 2>&1 || missing_tools+=("docker-compose")
    command -v git >/dev/null 2>&1 || missing_tools+=("git")
    command -v openssl >/dev/null 2>&1 || missing_tools+=("openssl")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Test Docker access
    if ! docker ps >/dev/null 2>&1; then
        print_error "Cannot access Docker. Ensure deploy user is in docker group and logout/login"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Setup application directory
setup_application_directory() {
    print_status "Setting up application directory..."
    
    # Create application directory if it doesn't exist
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # If directory is empty or this is a fresh deployment, clone/copy application files
    if [ ! -f "package.json" ]; then
        print_status "Application files not found, setting up..."
        
        # In production, you would typically clone from Git or copy files
        # For this script, we assume files are already present or copied manually
        if [ ! -f "/tmp/personal-website-deploy.tar.gz" ]; then
            print_error "Application files not found. Please:"
            print_error "1. Clone repository: git clone <repo-url> $APP_DIR"
            print_error "2. Or copy files to $APP_DIR"
            print_error "3. Or provide deployment archive at /tmp/personal-website-deploy.tar.gz"
            exit 1
        else
            print_status "Extracting application from deployment archive..."
            tar -xzf /tmp/personal-website-deploy.tar.gz -C "$APP_DIR" --strip-components=1
        fi
    fi
    
    print_success "Application directory ready"
}

# Create production environment file
create_production_environment() {
    print_status "Creating production environment configuration..."
    
    cat > "$APP_DIR/.env.production" << EOF
# Production Environment Configuration
NODE_ENV=production
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=https://$DOMAIN_NAME
NEXT_PUBLIC_SITE_URL=https://$DOMAIN_NAME
DOMAIN_NAME=$DOMAIN_NAME

# Database Configuration
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@db:5432/personal_website
POSTGRES_DB=personal_website
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$DB_PASSWORD

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=$ADMIN_EMAIL
SMTP_PASS=$SMTP_PASS
ADMIN_EMAIL=$ADMIN_EMAIL
CONTACT_EMAIL=$ADMIN_EMAIL

# Security
CRON_SECRET=$CRON_SECRET

# Production optimizations
NEXT_TELEMETRY_DISABLED=1
EOF
    
    # Secure the environment file
    chmod 600 "$APP_DIR/.env.production"
    
    print_success "Production environment file created"
}

# Create Docker Compose override for production
create_docker_override() {
    print_status "Creating Docker Compose production configuration..."
    
    cat > "$APP_DIR/docker-compose.override.yml" << EOF
version: '3.8'

services:
  app:
    ports:
      - "127.0.0.1:3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    restart: unless-stopped
    env_file:
      - .env.production
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d personal_website"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass $REDIS_PASSWORD
    env_file:
      - .env.production
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "$REDIS_PASSWORD", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
EOF
    
    print_success "Docker Compose override created"
}

# Build and deploy application
build_and_deploy() {
    print_status "Building and deploying application..."
    
    cd "$APP_DIR"
    
    # Stop existing containers
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Remove old images to ensure fresh build
    docker image prune -f
    
    # Build and start containers
    print_status "Building Docker containers (this may take several minutes)..."
    # Use cache for faster builds - only use --no-cache if explicitly needed
    # Production builds need the builder stage, so ensure sufficient memory
    docker-compose -f docker-compose.prod.yml build
    
    print_status "Starting application containers..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for containers to be healthy
    print_status "Waiting for containers to be ready..."
    sleep 30
    
    # Check container status
    local unhealthy_containers=$(docker-compose -f docker-compose.prod.yml ps --filter "health=unhealthy" -q)
    
    if [ -n "$unhealthy_containers" ]; then
        print_error "Some containers are unhealthy:"
        docker-compose -f docker-compose.prod.yml ps
        print_error "Check logs: docker-compose -f docker-compose.prod.yml logs"
        exit 1
    fi
    
    print_success "Application deployed successfully"
}

# Initialize database schema (only if needed)
initialize_database() {
    print_status "Checking database initialization..."
    
    # Check if database tables exist
    local table_count=$(docker-compose -f docker-compose.prod.yml exec -T db \
        psql -U postgres -d personal_website -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")
    
    if [ "$table_count" -eq 0 ]; then
        print_status "Initializing database schema..."
        
        # Run initialization script
        if [ -f "init.sql" ]; then
            docker-compose -f docker-compose.prod.yml exec -T db \
                psql -U postgres -d personal_website -f /docker-entrypoint-initdb.d/01-init.sql
            print_success "Database schema initialized"
        else
            print_warning "No init.sql found, skipping schema initialization"
        fi
    else
        print_status "Database already initialized ($table_count tables found)"
    fi
}

# Setup log directories and rotation
setup_logging_structure() {
    print_status "Setting up application logging..."
    
    # Create log directories
    mkdir -p "$APP_DIR/logs"
    
    # Create application log rotation config
    sudo tee /etc/logrotate.d/personal-website << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    postrotate
        docker-compose -f $APP_DIR/docker-compose.prod.yml restart app
    endscript
}
EOF
    
    print_success "Application logging configured"
}

# Test application deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Test application health endpoint
    local health_check=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    
    if [ "$health_check" = "200" ]; then
        print_success "Application health check passed"
    else
        print_warning "Application health check failed (HTTP $health_check)"
        print_status "This may be normal if the application is still starting up"
    fi
    
    # Test database connectivity
    if docker-compose -f docker-compose.prod.yml exec -T db \
        psql -U postgres -d personal_website -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "Database connectivity test passed"
    else
        print_error "Database connectivity test failed"
        exit 1
    fi
    
    # Test Redis connectivity  
    if docker-compose -f docker-compose.prod.yml exec -T redis \
        redis-cli --no-auth-warning -a "$REDIS_PASSWORD" ping >/dev/null 2>&1; then
        print_success "Redis connectivity test passed"
    else
        print_warning "Redis connectivity test failed"
    fi
    
    print_success "Deployment tests completed"
}

# Create monitoring and maintenance scripts
create_maintenance_scripts() {
    print_status "Creating maintenance scripts..."
    
    # Application status script
    cat > "$APP_DIR/check-status.sh" << 'EOF'
#!/bin/bash
echo "=== APPLICATION STATUS ==="
echo "Date: $(date)"
echo ""

echo "=== CONTAINER STATUS ==="
docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml ps
echo ""

echo "=== CONTAINER HEALTH ==="
docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T app curl -s http://localhost:3000/api/health || echo "Health check failed"
echo ""

echo "=== DISK USAGE ==="
df -h /home/deploy
echo ""

echo "=== MEMORY USAGE ==="
free -h
echo ""
EOF
    
    # Application restart script
    cat > "$APP_DIR/restart-app.sh" << 'EOF'
#!/bin/bash
echo "Restarting Personal Website application..."
cd /home/deploy/personal-website
docker-compose -f docker-compose.prod.yml restart app
echo "Application restarted"
docker-compose -f docker-compose.prod.yml ps
EOF
    
    # Application logs script
    cat > "$APP_DIR/view-logs.sh" << 'EOF'
#!/bin/bash
echo "Personal Website Application Logs"
echo "Press Ctrl+C to exit"
echo ""
cd /home/deploy/personal-website
docker-compose -f docker-compose.prod.yml logs -f app
EOF
    
    # Make scripts executable
    chmod +x "$APP_DIR/check-status.sh"
    chmod +x "$APP_DIR/restart-app.sh"
    chmod +x "$APP_DIR/view-logs.sh"
    
    print_success "Maintenance scripts created"
}

# Generate deployment report
generate_deployment_report() {
    local report_file="/home/deploy/deployment-report-$TIMESTAMP.txt"
    
    cat > "$report_file" << EOF
================================================================================
APPLICATION DEPLOYMENT REPORT
================================================================================

Deployment Date: $(date)
Deployment ID: $TIMESTAMP
Domain: $DOMAIN_NAME
Application Directory: $APP_DIR

CONTAINER STATUS:
$(docker-compose -f $APP_DIR/docker-compose.prod.yml ps)

HEALTH CHECKS:
- Application: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "Failed")
- Database: $(docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c "SELECT 'OK';" 2>/dev/null | grep OK || echo "Failed")
- Redis: $(docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T redis redis-cli --no-auth-warning -a "$REDIS_PASSWORD" ping 2>/dev/null || echo "Failed")

PORTS:
- Application: 127.0.0.1:3000 (internal)
- Database: Internal only (db:5432)
- Redis: Internal only (redis:6379)

MAINTENANCE SCRIPTS:
- Check status: $APP_DIR/check-status.sh
- Restart app: $APP_DIR/restart-app.sh
- View logs: $APP_DIR/view-logs.sh

NEXT STEPS:
1. Configure Nginx reverse proxy
2. Setup SSL certificates
3. Configure DNS to point to this server
4. Import data if this is a migration
5. Test all functionality

MONITORING:
- Application logs: docker-compose -f $APP_DIR/docker-compose.prod.yml logs -f app
- Container status: docker-compose -f $APP_DIR/docker-compose.prod.yml ps
- System resources: htop

================================================================================
EOF
    
    print_success "Deployment report generated: $report_file"
    cat "$report_file"
}

# Main execution
main() {
    print_header
    
    setup_logging
    get_config
    check_prerequisites
    setup_application_directory
    create_production_environment
    create_docker_override
    build_and_deploy
    initialize_database
    setup_logging_structure
    test_deployment
    create_maintenance_scripts
    generate_deployment_report
    
    print_success "Application deployment completed successfully!"
    print_status "Application should be accessible at: http://localhost:3000"
    print_status "Next: Configure Nginx reverse proxy and SSL"
}

# Run main function
main "$@" 