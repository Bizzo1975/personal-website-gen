#!/bin/bash

# Production Monitoring Script for Personal Website
# This script provides comprehensive monitoring and maintenance functions

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/deploy/personal-website"
BACKUP_DIR="/home/deploy/backups"
LOG_DIR="/home/deploy/logs"
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

# Function to check service status
check_services() {
    print_status "Checking service status..."
    
    cd $APP_DIR
    
    echo "=== DOCKER SERVICES ==="
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    echo "=== SYSTEM SERVICES ==="
    systemctl status docker nginx --no-pager -l
    
    echo ""
    echo "=== DISK USAGE ==="
    df -h
    
    echo ""
    echo "=== MEMORY USAGE ==="
    free -h
    
    echo ""
    echo "=== LOAD AVERAGE ==="
    uptime
}

# Function to check application health
check_application_health() {
    print_status "Checking application health..."
    
    # Check if application is responding
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        print_success "Application health check passed"
    else
        print_error "Application health check failed"
        return 1
    fi
    
    # Check database connection
    if docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T db pg_isready -U postgres -d personal_website > /dev/null; then
        print_success "Database connection verified"
    else
        print_error "Database connection failed"
        return 1
    fi
    
    # Check Redis connection
    if docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null; then
        print_success "Redis connection verified"
    else
        print_error "Redis connection failed"
        return 1
    fi
}

# Function to check SSL certificate
check_ssl_certificate() {
    print_status "Checking SSL certificate..."
    
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        EXPIRY_DATE=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
        CURRENT_EPOCH=$(date +%s)
        DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
        
        if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
            print_warning "SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
        else
            print_success "SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
        fi
    else
        print_error "SSL certificate not found"
    fi
}

# Function to check logs
check_logs() {
    print_status "Checking recent logs..."
    
    echo "=== APPLICATION LOGS (last 20 lines) ==="
    docker-compose -f $APP_DIR/docker-compose.prod.yml logs --tail=20 app
    
    echo ""
    echo "=== DATABASE LOGS (last 10 lines) ==="
    docker-compose -f $APP_DIR/docker-compose.prod.yml logs --tail=10 db
    
    echo ""
    echo "=== NGINX ERROR LOGS (last 10 lines) ==="
    sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No nginx error logs found"
    
    echo ""
    echo "=== SYSTEM LOGS (last 10 lines) ==="
    sudo tail -10 /var/log/syslog
}

# Function to check backup status
check_backup_status() {
    print_status "Checking backup status..."
    
    if [ -d "$BACKUP_DIR" ]; then
        echo "=== BACKUP DIRECTORY ==="
        ls -la $BACKUP_DIR
        
        echo ""
        echo "=== BACKUP SIZES ==="
        du -sh $BACKUP_DIR/*
        
        echo ""
        echo "=== LATEST BACKUP ==="
        LATEST_BACKUP=$(ls -t $BACKUP_DIR/database_*.sql.gz 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            echo "Latest database backup: $LATEST_BACKUP"
            echo "Size: $(du -h $LATEST_BACKUP | cut -f1)"
            echo "Date: $(stat -c %y $LATEST_BACKUP)"
        else
            print_warning "No database backups found"
        fi
    else
        print_warning "Backup directory not found"
    fi
}

# Function to check security
check_security() {
    print_status "Checking security status..."
    
    echo "=== FIREWALL STATUS ==="
    sudo ufw status
    
    echo ""
    echo "=== FAIL2BAN STATUS ==="
    sudo fail2ban-client status
    
    echo ""
    echo "=== RECENT SSH LOGINS ==="
    sudo grep "Accepted publickey" /var/log/auth.log | tail -5
    
    echo ""
    echo "=== RECENT FAILED LOGIN ATTEMPTS ==="
    sudo grep "Failed password" /var/log/auth.log | tail -5
}

# Function to check performance
check_performance() {
    print_status "Checking performance metrics..."
    
    echo "=== CPU USAGE ==="
    top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "CPU Usage: " 100 - $1 "%"}'
    
    echo ""
    echo "=== MEMORY USAGE ==="
    free -h | awk 'NR==2{printf "Memory Usage: %s/%s (%.2f%%)\n", $3,$2,$3*100/$2 }'
    
    echo ""
    echo "=== DISK USAGE ==="
    df -h | awk '$NF=="/"{printf "Disk Usage: %d/%dGB (%s)\n", $3,$2,$5}'
    
    echo ""
    echo "=== DOCKER CONTAINER RESOURCES ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

# Function to restart services
restart_services() {
    print_status "Restarting services..."
    
    cd $APP_DIR
    
    # Restart Docker services
    docker-compose -f docker-compose.prod.yml restart
    
    # Restart Nginx
    sudo systemctl restart nginx
    
    print_success "Services restarted"
}

# Function to update application
update_application() {
    print_status "Updating application..."
    
    cd $APP_DIR
    
    # Pull latest changes
    git pull origin main
    
    # Rebuild and restart
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Application updated"
}

# Function to run maintenance
run_maintenance() {
    print_status "Running maintenance tasks..."
    
    # Clean up Docker
    docker system prune -f
    
    # Clean up old logs
    sudo journalctl --vacuum-time=7d
    
    # Update system packages
    sudo apt update && sudo apt upgrade -y
    
    # Renew SSL certificate if needed
    sudo certbot renew --dry-run
    
    print_success "Maintenance completed"
}

# Function to create backup
create_backup() {
    print_status "Creating manual backup..."
    
    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
    mkdir -p $BACKUP_DIR
    
    cd $APP_DIR
    
    # Database backup
    docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres personal_website | gzip > $BACKUP_DIR/database_$BACKUP_DATE.sql.gz
    
    # Content backup
    tar -czf $BACKUP_DIR/content_$BACKUP_DATE.tar.gz -C $APP_DIR public/uploads public/images
    
    # Config backup
    tar -czf $BACKUP_DIR/config_$BACKUP_DATE.tar.gz -C $APP_DIR .env.production docker-compose.prod.yml nginx.conf
    
    print_success "Backup created: $BACKUP_DATE"
}

# Function to show help
show_help() {
    echo "Production Monitoring Script for Personal Website"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status      - Check service status"
    echo "  health      - Check application health"
    echo "  ssl         - Check SSL certificate"
    echo "  logs        - Show recent logs"
    echo "  backup      - Check backup status"
    echo "  security    - Check security status"
    echo "  performance - Check performance metrics"
    echo "  restart     - Restart services"
    echo "  update      - Update application"
    echo "  maintenance - Run maintenance tasks"
    echo "  create-backup - Create manual backup"
    echo "  all         - Run all checks"
    echo "  help        - Show this help"
}

# Main function
main() {
    case "${1:-help}" in
        "status")
            check_services
            ;;
        "health")
            check_application_health
            ;;
        "ssl")
            check_ssl_certificate
            ;;
        "logs")
            check_logs
            ;;
        "backup")
            check_backup_status
            ;;
        "security")
            check_security
            ;;
        "performance")
            check_performance
            ;;
        "restart")
            restart_services
            ;;
        "update")
            update_application
            ;;
        "maintenance")
            run_maintenance
            ;;
        "create-backup")
            create_backup
            ;;
        "all")
            check_services
            echo ""
            check_application_health
            echo ""
            check_ssl_certificate
            echo ""
            check_backup_status
            echo ""
            check_security
            echo ""
            check_performance
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function
main "$@"
