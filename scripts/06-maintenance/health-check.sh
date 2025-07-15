#!/bin/bash

# Health Check Script for Personal Website
# This script performs comprehensive health checks on the production system

set -e  # Exit on any error

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/home/deploy/personal-website"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
HEALTH_LOG="/var/log/deployment/health_check_$TIMESTAMP.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Health status counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0
TOTAL_CHECKS=0

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$HEALTH_LOG"
}

print_success() {
    echo -e "${GREEN}[✓ PASS]${NC} $1" | tee -a "$HEALTH_LOG"
    ((CHECKS_PASSED++))
    ((TOTAL_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}[⚠ WARN]${NC} $1" | tee -a "$HEALTH_LOG"
    ((CHECKS_WARNING++))
    ((TOTAL_CHECKS++))
}

print_error() {
    echo -e "${RED}[✗ FAIL]${NC} $1" | tee -a "$HEALTH_LOG"
    ((CHECKS_FAILED++))
    ((TOTAL_CHECKS++))
}

print_header() {
    echo ""
    echo "=========================================="
    echo "Personal Website - System Health Check"
    echo "=========================================="
    echo "Date: $(date)"
    echo "Check ID: $TIMESTAMP"
    echo ""
}

# Ensure log directory exists
setup_logging() {
    if [ "$USER" = "deploy" ]; then
        sudo mkdir -p /var/log/deployment
        sudo chown deploy:deploy /var/log/deployment
    else
        mkdir -p /var/log/deployment
    fi
    touch "$HEALTH_LOG"
}

# Check system resources
check_system_resources() {
    print_status "Checking system resources..."
    
    # Disk space check
    local disk_usage=$(df /home/deploy | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        print_success "Disk usage: ${disk_usage}% (Available: $(df -h /home/deploy | tail -1 | awk '{print $4}'))"
    elif [ "$disk_usage" -lt 90 ]; then
        print_warning "Disk usage: ${disk_usage}% (Available: $(df -h /home/deploy | tail -1 | awk '{print $4}'))"
    else
        print_error "Disk usage: ${disk_usage}% - Running low on disk space!"
    fi
    
    # Memory usage check
    local mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ "$mem_usage" -lt 80 ]; then
        print_success "Memory usage: ${mem_usage}% ($(free -h | grep Mem | awk '{print $3"/"$2}'))"
    elif [ "$mem_usage" -lt 90 ]; then
        print_warning "Memory usage: ${mem_usage}% ($(free -h | grep Mem | awk '{print $3"/"$2}'))"
    else
        print_error "Memory usage: ${mem_usage}% - High memory usage!"
    fi
    
    # Load average check
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_threshold=$(echo "$cpu_cores * 2" | bc 2>/dev/null || echo $((cpu_cores * 2)))
    
    if (( $(echo "$load_avg < $load_threshold" | bc -l 2>/dev/null || [ ${load_avg%.*} -lt $load_threshold ]) )); then
        print_success "System load: $load_avg (CPU cores: $cpu_cores)"
    else
        print_warning "System load: $load_avg - High system load (CPU cores: $cpu_cores)"
    fi
}

# Check Docker containers
check_docker_containers() {
    print_status "Checking Docker containers..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not installed or not in PATH"
        return
    fi
    
    # Check if Docker daemon is running
    if ! docker ps &> /dev/null; then
        print_error "Docker daemon is not running"
        return
    fi
    
    print_success "Docker daemon is running"
    
    # Check application containers
    if [ -d "$APP_DIR" ]; then
        cd "$APP_DIR"
        
        # Check if docker-compose file exists
        if [ ! -f "docker-compose.prod.yml" ]; then
            print_warning "docker-compose.prod.yml not found in $APP_DIR"
            return
        fi
        
        # Get container status
        local containers_up=$(docker-compose -f docker-compose.prod.yml ps --filter "status=running" -q | wc -l)
        local containers_total=$(docker-compose -f docker-compose.prod.yml ps -q | wc -l)
        
        if [ "$containers_up" -eq "$containers_total" ] && [ "$containers_total" -gt 0 ]; then
            print_success "All containers running ($containers_up/$containers_total)"
        elif [ "$containers_up" -gt 0 ]; then
            print_warning "Some containers not running ($containers_up/$containers_total)"
        else
            print_error "No containers running"
        fi
        
        # Check individual container health
        local unhealthy=$(docker-compose -f docker-compose.prod.yml ps --filter "health=unhealthy" -q | wc -l)
        if [ "$unhealthy" -eq 0 ]; then
            print_success "All containers healthy"
        else
            print_error "$unhealthy containers unhealthy"
        fi
    else
        print_warning "Application directory not found: $APP_DIR"
    fi
}

# Check application connectivity
check_application_connectivity() {
    print_status "Checking application connectivity..."
    
    # Check if application is responding on localhost
    local health_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    
    if [ "$health_status" = "200" ]; then
        print_success "Application health endpoint responding (HTTP $health_status)"
    elif [ "$health_status" = "000" ]; then
        print_error "Application not reachable on localhost:3000"
    else
        print_warning "Application health endpoint returned HTTP $health_status"
    fi
    
    # Check if website is accessible externally (if domain is configured)
    local domain="willworkforlunch.com"
    if command -v dig &> /dev/null; then
        local external_ip=$(dig +short $domain 2>/dev/null | tail -1)
        if [ -n "$external_ip" ]; then
            local external_status=$(curl -s -o /dev/null -w "%{http_code}" https://$domain 2>/dev/null || echo "000")
            if [ "$external_status" = "200" ]; then
                print_success "External website accessible (https://$domain - HTTP $external_status)"
            else
                print_warning "External website issues (https://$domain - HTTP $external_status)"
            fi
        fi
    fi
}

# Check database connectivity
check_database_connectivity() {
    print_status "Checking database connectivity..."
    
    if [ -d "$APP_DIR" ]; then
        cd "$APP_DIR"
        
        # Test database connection through Docker
        if docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c "SELECT 1;" &> /dev/null; then
            print_success "Database connection successful"
            
            # Get database statistics
            local user_count=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs || echo "0")
            local post_count=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -t -c "SELECT COUNT(*) FROM posts;" 2>/dev/null | xargs || echo "0")
            local project_count=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -t -c "SELECT COUNT(*) FROM projects;" 2>/dev/null | xargs || echo "0")
            
            print_success "Database records: $user_count users, $post_count posts, $project_count projects"
            
            # Check database size
            local db_size=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -t -c "SELECT pg_size_pretty(pg_database_size('personal_website'));" 2>/dev/null | xargs || echo "Unknown")
            print_success "Database size: $db_size"
            
        else
            print_error "Database connection failed"
        fi
    else
        print_warning "Cannot check database - application directory not found"
    fi
}

# Check Redis connectivity
check_redis_connectivity() {
    print_status "Checking Redis connectivity..."
    
    if [ -d "$APP_DIR" ]; then
        cd "$APP_DIR"
        
        # Test Redis connection through Docker
        if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping &> /dev/null; then
            print_success "Redis connection successful"
        else
            print_warning "Redis connection failed or requires authentication"
        fi
    else
        print_warning "Cannot check Redis - application directory not found"
    fi
}

# Check SSL certificate
check_ssl_certificate() {
    print_status "Checking SSL certificate..."
    
    local domain="willworkforlunch.com"
    
    # Check if certbot is available
    if command -v certbot &> /dev/null; then
        local cert_info=$(sudo certbot certificates 2>/dev/null | grep -A 5 "$domain" || echo "")
        
        if [ -n "$cert_info" ]; then
            local expiry=$(echo "$cert_info" | grep "Expiry Date:" | awk '{print $3, $4}')
            if [ -n "$expiry" ]; then
                print_success "SSL certificate found, expires: $expiry"
            else
                print_warning "SSL certificate found but couldn't determine expiry"
            fi
        else
            print_warning "No SSL certificate found for $domain"
        fi
    else
        print_warning "Certbot not available for SSL check"
    fi
    
    # Check SSL connectivity
    if command -v openssl &> /dev/null; then
        local ssl_status=$(timeout 10s openssl s_client -connect $domain:443 -servername $domain </dev/null 2>/dev/null | grep "Verify return code:" | awk '{print $4}')
        if [ "$ssl_status" = "0" ]; then
            print_success "SSL certificate verification successful"
        else
            print_warning "SSL certificate verification returned code: $ssl_status"
        fi
    fi
}

# Check system services
check_system_services() {
    print_status "Checking system services..."
    
    # Check Nginx
    if systemctl is-active --quiet nginx; then
        print_success "Nginx service running"
    else
        print_error "Nginx service not running"
    fi
    
    # Check Docker
    if systemctl is-active --quiet docker; then
        print_success "Docker service running"
    else
        print_error "Docker service not running"
    fi
    
    # Check fail2ban
    if systemctl is-active --quiet fail2ban; then
        print_success "Fail2ban service running"
    else
        print_warning "Fail2ban service not running"
    fi
}

# Check security status
check_security_status() {
    print_status "Checking security status..."
    
    # Check UFW firewall
    if command -v ufw &> /dev/null; then
        local ufw_status=$(sudo ufw status | head -1 | awk '{print $2}')
        if [ "$ufw_status" = "active" ]; then
            print_success "UFW firewall active"
        else
            print_warning "UFW firewall not active"
        fi
    fi
    
    # Check for root login via SSH
    if grep -q "PermitRootLogin no" /etc/ssh/sshd_config; then
        print_success "Root SSH login disabled"
    else
        print_warning "Root SSH login not explicitly disabled"
    fi
    
    # Check password authentication
    if grep -q "PasswordAuthentication no" /etc/ssh/sshd_config; then
        print_success "SSH password authentication disabled"
    else
        print_warning "SSH password authentication not explicitly disabled"
    fi
}

# Check backup status
check_backup_status() {
    print_status "Checking backup status..."
    
    local backup_dir="/home/deploy/backups"
    
    if [ -d "$backup_dir" ]; then
        local latest_backup=$(find "$backup_dir" -name "backup_manifest_*.txt" -mtime -1 | wc -l)
        local total_backups=$(find "$backup_dir" -name "backup_manifest_*.txt" | wc -l)
        
        if [ "$latest_backup" -gt 0 ]; then
            print_success "Recent backup found (last 24h), total backups: $total_backups"
        elif [ "$total_backups" -gt 0 ]; then
            print_warning "No recent backup (last 24h), total backups: $total_backups"
        else
            print_error "No backups found"
        fi
        
        # Check backup directory size
        local backup_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo "Unknown")
        print_success "Backup directory size: $backup_size"
    else
        print_error "Backup directory not found: $backup_dir"
    fi
}

# Generate health report
generate_health_report() {
    local report_file="/home/deploy/health_report_$TIMESTAMP.txt"
    
    cat > "$report_file" << EOF
================================================================================
SYSTEM HEALTH REPORT
================================================================================

Check Date: $(date)
Check ID: $TIMESTAMP
Server: $(hostname)
Uptime: $(uptime)

HEALTH CHECK SUMMARY:
✓ Passed: $CHECKS_PASSED
⚠ Warnings: $CHECKS_WARNING  
✗ Failed: $CHECKS_FAILED
Total Checks: $TOTAL_CHECKS

SYSTEM INFORMATION:
- OS: $(lsb_release -d 2>/dev/null | cut -f2 || uname -a)
- Kernel: $(uname -r)
- CPU: $(nproc) cores
- Memory: $(free -h | grep Mem | awk '{print $2}')
- Disk: $(df -h /home/deploy | tail -1 | awk '{print $2}')

RESOURCE USAGE:
- Disk Usage: $(df /home/deploy | tail -1 | awk '{print $5}')
- Memory Usage: $(free | grep Mem | awk '{printf "%.0f%%", $3/$2 * 100.0}')
- Load Average: $(uptime | awk -F'load average:' '{print $2}')

CONTAINER STATUS:
$(docker-compose -f $APP_DIR/docker-compose.prod.yml ps 2>/dev/null || echo "Unable to get container status")

DATABASE STATUS:
$(docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c "SELECT 'users' as table_name, COUNT(*) as record_count FROM users UNION ALL SELECT 'posts', COUNT(*) FROM posts UNION ALL SELECT 'projects', COUNT(*) FROM projects;" 2>/dev/null || echo "Unable to get database status")

NETWORK CONNECTIVITY:
- Local Health Check: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "Failed")
- External Website: $(curl -s -o /dev/null -w "%{http_code}" https://willworkforlunch.com 2>/dev/null || echo "Failed")

DETAILED LOGS:
Full check log: $HEALTH_LOG

RECOMMENDATIONS:
EOF
    
    if [ $CHECKS_FAILED -gt 0 ]; then
        echo "⚠️  CRITICAL: $CHECKS_FAILED checks failed - immediate attention required" >> "$report_file"
    fi
    
    if [ $CHECKS_WARNING -gt 0 ]; then
        echo "⚠️  WARNING: $CHECKS_WARNING checks have warnings - review recommended" >> "$report_file"
    fi
    
    if [ $CHECKS_FAILED -eq 0 ] && [ $CHECKS_WARNING -eq 0 ]; then
        echo "✅ ALL CHECKS PASSED - System is healthy" >> "$report_file"
    fi
    
    echo "================================================================================" >> "$report_file"
    
    print_success "Health report generated: $report_file"
}

# Main execution
main() {
    print_header
    
    setup_logging
    check_system_resources
    check_docker_containers
    check_application_connectivity
    check_database_connectivity
    check_redis_connectivity
    check_ssl_certificate
    check_system_services
    check_security_status
    check_backup_status
    generate_health_report
    
    echo ""
    echo "=========================================="
    echo "HEALTH CHECK SUMMARY"
    echo "=========================================="
    echo -e "${GREEN}✓ Passed: $CHECKS_PASSED${NC}"
    echo -e "${YELLOW}⚠ Warnings: $CHECKS_WARNING${NC}"
    echo -e "${RED}✗ Failed: $CHECKS_FAILED${NC}"
    echo "Total Checks: $TOTAL_CHECKS"
    echo ""
    
    if [ $CHECKS_FAILED -gt 0 ]; then
        echo -e "${RED}⚠️  CRITICAL: System has failed checks - immediate attention required${NC}"
        exit 1
    elif [ $CHECKS_WARNING -gt 0 ]; then
        echo -e "${YELLOW}⚠️  WARNING: System has warnings - review recommended${NC}"
        exit 0
    else
        echo -e "${GREEN}✅ ALL CHECKS PASSED - System is healthy${NC}"
        exit 0
    fi
}

# Run main function
main "$@" 