#!/bin/bash

# Personal Website - Complete Deployment Orchestrator
# This script orchestrates the full deployment process from development to production

set -e  # Exit on any error

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/deployment_$TIMESTAMP.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Create logs directory
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

print_header() {
    log "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    log "${BLUE}║                    PERSONAL WEBSITE                            ║${NC}"
    log "${BLUE}║                 COMPLETE DEPLOYMENT                            ║${NC}"
    log "${BLUE}║                                                               ║${NC}"
    log "${BLUE}║  This script will deploy your website to production          ║${NC}"
    log "${BLUE}║  Target: willworkforlunch.com (Digital Ocean + CloudFlare)   ║${NC}"
    log "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    log ""
}

print_status() {
    log "${BLUE}[INFO]${NC} $1"
}

print_success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    log "${RED}[ERROR]${NC} $1"
}

print_phase() {
    log ""
    log "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    log "${PURPLE}  PHASE $1: $2${NC}"
    log "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    log ""
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_tools=()
    
    # Required tools
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v docker-compose >/dev/null 2>&1 || missing_tools+=("docker-compose")
    command -v node >/dev/null 2>&1 || missing_tools+=("node")
    command -v npm >/dev/null 2>&1 || missing_tools+=("npm")
    command -v pg_dump >/dev/null 2>&1 || missing_tools+=("pg_dump")
    command -v psql >/dev/null 2>&1 || missing_tools+=("psql")
    command -v ssh >/dev/null 2>&1 || missing_tools+=("ssh")
    command -v scp >/dev/null 2>&1 || missing_tools+=("scp")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_error "Please install missing tools before continuing."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
        print_error "Please run this script from the project root directory."
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Get deployment configuration
get_deployment_config() {
    print_status "Gathering deployment configuration..."
    
    # Production server details
    echo ""
    echo "========================================"
    echo "Production Server Configuration"
    echo "========================================"
    
    read -p "Production server IP/hostname: " PROD_SERVER
    [ -z "$PROD_SERVER" ] && { print_error "Server IP is required"; exit 1; }
    
    read -p "SSH user (default: deploy): " PROD_USER
    PROD_USER=${PROD_USER:-deploy}
    
    read -p "SSH port (default: 22): " SSH_PORT
    SSH_PORT=${SSH_PORT:-22}
    
    # Development database details
    echo ""
    echo "========================================"
    echo "Development Database Configuration"
    echo "========================================"
    
    read -p "Dev database host (default: localhost): " DEV_DB_HOST
    DEV_DB_HOST=${DEV_DB_HOST:-localhost}
    
    read -p "Dev database port (default: 5436): " DEV_DB_PORT
    DEV_DB_PORT=${DEV_DB_PORT:-5436}
    
    read -p "Dev database user (default: postgres): " DEV_DB_USER
    DEV_DB_USER=${DEV_DB_USER:-postgres}
    
    read -p "Dev database name (default: personal_website): " DEV_DB_NAME
    DEV_DB_NAME=${DEV_DB_NAME:-personal_website}
    
    read -s -p "Dev database password: " DEV_DB_PASSWORD
    echo ""
    
    # Domain configuration
    echo ""
    echo "========================================"
    echo "Domain Configuration"
    echo "========================================"
    
    read -p "Domain name (default: willworkforlunch.com): " DOMAIN_NAME
    DOMAIN_NAME=${DOMAIN_NAME:-willworkforlunch.com}
    
    read -p "Admin email: " ADMIN_EMAIL
    [ -z "$ADMIN_EMAIL" ] && { print_error "Admin email is required"; exit 1; }
    
    # Deployment type
    echo ""
    echo "========================================"
    echo "Deployment Options"
    echo "========================================"
    echo "1. Fresh installation (new server setup)"
    echo "2. Application update (server already configured)"
    echo "3. Data migration only"
    echo "4. Complete reinstall (destroy existing data)"
    
    read -p "Select deployment type (1-4): " DEPLOYMENT_TYPE
    
    case $DEPLOYMENT_TYPE in
        1) DEPLOYMENT_MODE="fresh";;
        2) DEPLOYMENT_MODE="update";;
        3) DEPLOYMENT_MODE="migration";;
        4) DEPLOYMENT_MODE="reinstall";;
        *) print_error "Invalid selection"; exit 1;;
    esac
    
    # Confirmation
    echo ""
    echo "========================================"
    echo "Deployment Summary"
    echo "========================================"
    echo "Target Server: $PROD_USER@$PROD_SERVER:$SSH_PORT"
    echo "Domain: $DOMAIN_NAME"
    echo "Admin Email: $ADMIN_EMAIL"
    echo "Deployment Mode: $DEPLOYMENT_MODE"
    echo "Source Database: $DEV_DB_USER@$DEV_DB_HOST:$DEV_DB_PORT/$DEV_DB_NAME"
    echo ""
    
    read -p "Proceed with deployment? (y/N): " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled by user"
        exit 0
    fi
    
    # Export variables for sub-scripts
    export PROD_SERVER PROD_USER SSH_PORT
    export DEV_DB_HOST DEV_DB_PORT DEV_DB_USER DEV_DB_NAME DEV_DB_PASSWORD
    export DOMAIN_NAME ADMIN_EMAIL DEPLOYMENT_MODE
    export TIMESTAMP LOG_FILE
}

# Test connectivity
test_connectivity() {
    print_status "Testing connectivity..."
    
    # Test production server
    if ! ssh -p "$SSH_PORT" -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_SERVER" "echo 'Connection successful'" >/dev/null 2>&1; then
        print_error "Cannot connect to production server"
        print_error "Please ensure SSH key authentication is configured"
        exit 1
    fi
    
    # Test development database
    if ! PGPASSWORD="$DEV_DB_PASSWORD" psql -h "$DEV_DB_HOST" -p "$DEV_DB_PORT" -U "$DEV_DB_USER" -d "$DEV_DB_NAME" -c "\q" >/dev/null 2>&1; then
        print_error "Cannot connect to development database"
        exit 1
    fi
    
    print_success "All connectivity tests passed!"
}

# Execute deployment phases
execute_deployment() {
    case $DEPLOYMENT_MODE in
        "fresh")
            execute_fresh_deployment
            ;;
        "update")
            execute_update_deployment
            ;;
        "migration")
            execute_migration_only
            ;;
        "reinstall")
            execute_reinstall_deployment
            ;;
    esac
}

execute_fresh_deployment() {
    print_phase "1" "Server Setup & Security"
    "$SCRIPT_DIR/03-server-setup/initial-server-setup.sh"
    "$SCRIPT_DIR/03-server-setup/install-dependencies.sh"
    "$SCRIPT_DIR/03-server-setup/configure-security.sh"
    
    print_phase "2" "Data Migration"
    "$SCRIPT_DIR/02-migration/export-dev-data.sh"
    "$SCRIPT_DIR/02-migration/validate-export.sh"
    
    print_phase "3" "Application Deployment"
    "$SCRIPT_DIR/04-deployment/deploy-application.sh"
    "$SCRIPT_DIR/04-deployment/configure-nginx.sh"
    
    print_phase "4" "SSL & DNS Configuration"
    "$SCRIPT_DIR/03-server-setup/setup-ssl.sh"
    "$SCRIPT_DIR/04-deployment/cloudflare-dns-setup.sh"
    
    print_phase "5" "Data Import & Validation"
    "$SCRIPT_DIR/02-migration/import-to-production.sh"
    
    print_phase "6" "Backup & Monitoring Setup"
    "$SCRIPT_DIR/05-backup-restore/setup-automated-backups.sh"
    "$SCRIPT_DIR/06-maintenance/health-check.sh"
}

execute_update_deployment() {
    print_phase "1" "Pre-Update Backup"
    "$SCRIPT_DIR/05-backup-restore/backup-full-system.sh"
    
    print_phase "2" "Application Update"
    "$SCRIPT_DIR/04-deployment/deploy-application.sh"
    
    print_phase "3" "Health Check"
    "$SCRIPT_DIR/06-maintenance/health-check.sh"
}

execute_migration_only() {
    print_phase "1" "Data Export"
    "$SCRIPT_DIR/02-migration/export-dev-data.sh"
    "$SCRIPT_DIR/02-migration/validate-export.sh"
    
    print_phase "2" "Data Import"
    "$SCRIPT_DIR/02-migration/import-to-production.sh"
    
    print_phase "3" "Validation"
    "$SCRIPT_DIR/06-maintenance/health-check.sh"
}

execute_reinstall_deployment() {
    print_warning "This will DESTROY all existing data on the production server!"
    read -p "Type 'DESTROY' to confirm: " DESTROY_CONFIRM
    if [ "$DESTROY_CONFIRM" != "DESTROY" ]; then
        print_error "Reinstall cancelled"
        exit 1
    fi
    
    print_phase "1" "Cleanup Existing Installation"
    ssh -p "$SSH_PORT" "$PROD_USER@$PROD_SERVER" "
        docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml down -v || true
        sudo rm -rf /home/deploy/personal-website
        docker system prune -af
    "
    
    # Then run fresh deployment
    execute_fresh_deployment
}

# Generate deployment report
generate_deployment_report() {
    local report_file="$LOG_DIR/deployment_report_$TIMESTAMP.txt"
    
    cat > "$report_file" << EOF
================================================================================
DEPLOYMENT REPORT
================================================================================

Deployment Date: $(date)
Deployment ID: $TIMESTAMP
Deployment Mode: $DEPLOYMENT_MODE
Target Server: $PROD_USER@$PROD_SERVER
Domain: $DOMAIN_NAME

DEPLOYMENT LOG: $LOG_FILE

NEXT STEPS:
1. Verify website functionality: https://$DOMAIN_NAME
2. Test admin access: https://$DOMAIN_NAME/admin
3. Check email functionality
4. Monitor logs for 24-48 hours
5. Update DNS if not already done

MONITORING:
- Application logs: ssh $PROD_USER@$PROD_SERVER 'docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml logs -f app'
- System health: ssh $PROD_USER@$PROD_SERVER '/home/deploy/personal-website/scripts/06-maintenance/health-check.sh'
- Backup status: ssh $PROD_USER@$PROD_SERVER 'ls -la /home/deploy/backups/'

SUPPORT:
- Deployment logs: $LOG_FILE
- Server logs: /var/log/deployment/ (on server)
- Rollback: Use backup-restore scripts if needed

================================================================================
EOF
    
    print_success "Deployment report generated: $report_file"
    cat "$report_file"
}

# Main execution
main() {
    print_header
    
    print_status "Starting deployment process..."
    print_status "Log file: $LOG_FILE"
    
    check_prerequisites
    get_deployment_config
    test_connectivity
    execute_deployment
    generate_deployment_report
    
    print_success "Deployment completed successfully!"
    print_status "Website should be available at: https://$DOMAIN_NAME"
    print_status "Admin panel: https://$DOMAIN_NAME/admin"
}

# Error handling
trap 'print_error "Deployment failed! Check log file: $LOG_FILE"' ERR

# Run main function
main "$@" 