#!/bin/bash

# Complete System Backup for Personal Website
# This script creates a comprehensive backup of database, content, and configuration

set -e  # Exit on any error

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Detect environment (development or production)
if [ -f "$PROJECT_ROOT/docker-compose.prod.yml" ] && docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps >/dev/null 2>&1; then
    # Production environment
    ENVIRONMENT="production"
    APP_DIR="/home/deploy/personal-website"
    BACKUP_DIR="/home/deploy/backups"
    COMPOSE_FILE="docker-compose.prod.yml"
elif [ -f "$PROJECT_ROOT/docker-compose.yml" ] && docker-compose -f "$PROJECT_ROOT/docker-compose.yml" ps >/dev/null 2>&1; then
    # Development environment
    ENVIRONMENT="development"
    APP_DIR="$PROJECT_ROOT"
    BACKUP_DIR="$PROJECT_ROOT/backups"
    COMPOSE_FILE="docker-compose.yml"
else
    # Default to project root for development
    ENVIRONMENT="development"
    APP_DIR="$PROJECT_ROOT"
    BACKUP_DIR="$PROJECT_ROOT/backups"
    COMPOSE_FILE="docker-compose.yml"
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=14

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
    echo "Personal Website - Complete System Backup"
    echo "=========================================="
    echo ""
}

# Setup backup environment
setup_backup_environment() {
    print_status "Setting up backup environment..."
    
    # Create backup directory structure
    mkdir -p "$BACKUP_DIR"/{database,content,config,logs,stats}
    
    # Ensure proper permissions (only in production)
    if [ "$ENVIRONMENT" = "production" ] && [ "$USER" != "deploy" ]; then
        sudo chown -R deploy:deploy "$BACKUP_DIR" 2>/dev/null || true
    fi
    
    print_success "Backup environment ready"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if application is running
    if ! docker-compose -f "$APP_DIR/$COMPOSE_FILE" ps 2>/dev/null | grep -q "Up"; then
        print_warning "Application containers are not running"
        print_warning "Backup will continue but may be incomplete"
    fi
    
    # Check required tools
    local missing_tools=()
    
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v docker-compose >/dev/null 2>&1 || missing_tools+=("docker-compose")
    command -v tar >/dev/null 2>&1 || missing_tools+=("tar")
    command -v gzip >/dev/null 2>&1 || missing_tools+=("gzip")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# Backup database
backup_database() {
    print_status "Backing up database..."
    
    local db_backup_file="$BACKUP_DIR/database/database_backup_$TIMESTAMP.sql"
    local db_compressed_file="${db_backup_file}.gz"
    
    # Create database backup
    if docker-compose -f "$APP_DIR/$COMPOSE_FILE" exec -T db \
        pg_dump -U postgres --verbose --clean --if-exists personal_website > "$db_backup_file" 2>/dev/null; then
        
        # Compress the backup
        gzip "$db_backup_file"
        
        # Verify compressed backup
        if gzip -t "$db_compressed_file" 2>/dev/null; then
            local backup_size=$(du -h "$db_compressed_file" | cut -f1)
            print_success "Database backup completed: $backup_size"
        else
            print_error "Database backup compression failed"
            exit 1
        fi
    else
        print_error "Database backup failed"
        exit 1
    fi
}

# Backup content and media files
backup_content() {
    print_status "Backing up content and media files..."
    
    local content_backup_file="$BACKUP_DIR/content/content_backup_$TIMESTAMP.tar.gz"
    
    # Create content backup including public directory
    if tar -czf "$content_backup_file" -C "$APP_DIR" public/ 2>/dev/null; then
        local backup_size=$(du -h "$content_backup_file" | cut -f1)
        print_success "Content backup completed: $backup_size"
    else
        print_warning "Content backup completed with warnings (some directories may be empty)"
    fi
    
    # Create content inventory
    find "$APP_DIR/public" -type f > "$BACKUP_DIR/stats/content_inventory_$TIMESTAMP.txt" 2>/dev/null || true
}

# Backup configuration files
backup_configuration() {
    print_status "Backing up configuration files..."
    
    local config_backup_file="$BACKUP_DIR/config/config_backup_$TIMESTAMP.tar.gz"
    
    # List of configuration files to backup
    local config_files=(
        ".env.production"
        "docker-compose.prod.yml"
        "docker-compose.override.yml"
        "nginx.conf"
        "package.json"
        "package-lock.json"
        "next.config.js"
        "tailwind.config.js"
        "Dockerfile"
    )
    
    # Create temporary directory for config files
    local temp_config_dir="/tmp/config_backup_$TIMESTAMP"
    mkdir -p "$temp_config_dir"
    
    # Copy existing config files
    for file in "${config_files[@]}"; do
        if [ -f "$APP_DIR/$file" ]; then
            cp "$APP_DIR/$file" "$temp_config_dir/"
        fi
    done
    
    # Include important system configs
    if [ -f "/etc/nginx/sites-available/willworkforlunch.com" ]; then
        cp "/etc/nginx/sites-available/willworkforlunch.com" "$temp_config_dir/nginx-site.conf"
    fi
    
    # Create backup archive
    tar -czf "$config_backup_file" -C "$temp_config_dir" .
    
    # Cleanup temporary directory
    rm -rf "$temp_config_dir"
    
    local backup_size=$(du -h "$config_backup_file" | cut -f1)
    print_success "Configuration backup completed: $backup_size"
}

# Generate database statistics
generate_database_statistics() {
    print_status "Generating database statistics..."
    
    local stats_file="$BACKUP_DIR/stats/db_stats_$TIMESTAMP.txt"
    
    # Get table statistics
    docker-compose -f "$APP_DIR/$COMPOSE_FILE" exec -T db \
        psql -U postgres -d personal_website -c "
            SELECT 
                'users' as table_name, COUNT(*) as record_count FROM users
            UNION ALL
            SELECT 'posts', COUNT(*) FROM posts  
            UNION ALL
            SELECT 'projects', COUNT(*) FROM projects
            UNION ALL
            SELECT 'pages', COUNT(*) FROM pages
            UNION ALL
            SELECT 'media_files', COUNT(*) FROM media_files
            UNION ALL
            SELECT 'newsletter_subscribers', COUNT(*) FROM newsletter_subscribers
            ORDER BY table_name;
        " > "$stats_file" 2>/dev/null || print_warning "Could not generate complete database statistics"
    
    # Get database size information
    docker-compose -f "$APP_DIR/$COMPOSE_FILE" exec -T db \
        psql -U postgres -d personal_website -c "
            SELECT pg_size_pretty(pg_database_size('personal_website')) as database_size;
        " >> "$stats_file" 2>/dev/null
    
    print_success "Database statistics generated"
}

# Backup application logs
backup_application_logs() {
    print_status "Backing up application logs..."
    
    local logs_backup_file="$BACKUP_DIR/logs/app_logs_$TIMESTAMP.txt"
    
    # Get last 1000 lines of application logs
    # Try 'app' service first, then 'frontend' as fallback
    if docker-compose -f "$APP_DIR/$COMPOSE_FILE" ps app >/dev/null 2>&1; then
        docker-compose -f "$APP_DIR/$COMPOSE_FILE" logs --tail=1000 app > "$logs_backup_file" 2>/dev/null || print_warning "Could not backup application logs"
    elif docker-compose -f "$APP_DIR/$COMPOSE_FILE" ps frontend >/dev/null 2>&1; then
        docker-compose -f "$APP_DIR/$COMPOSE_FILE" logs --tail=1000 frontend > "$logs_backup_file" 2>/dev/null || print_warning "Could not backup application logs"
    else
        print_warning "Could not find application container for log backup"
    fi
    
    # Get system logs if available
    if [ -d "/var/log/deployment" ]; then
        tar -czf "$BACKUP_DIR/logs/system_logs_$TIMESTAMP.tar.gz" /var/log/deployment/ 2>/dev/null || true
    fi
    
    print_success "Application logs backed up"
}

# Create backup manifest
create_backup_manifest() {
    print_status "Creating backup manifest..."
    
    local manifest_file="$BACKUP_DIR/backup_manifest_$TIMESTAMP.txt"
    
    cat > "$manifest_file" << EOF
================================================================================
BACKUP MANIFEST
================================================================================

Backup Date: $(date)
Backup ID: $TIMESTAMP
Environment: $ENVIRONMENT
Server: $(hostname)
Application Version: $(cat "$APP_DIR/package.json" | grep '"version"' | cut -d'"' -f4 2>/dev/null || echo "Unknown")

BACKUP COMPONENTS:
EOF
    
    # List all backup files with sizes
    if [ -f "$BACKUP_DIR/database/database_backup_$TIMESTAMP.sql.gz" ]; then
        echo "✓ Database: $(du -h "$BACKUP_DIR/database/database_backup_$TIMESTAMP.sql.gz" | cut -f1)" >> "$manifest_file"
    fi
    
    if [ -f "$BACKUP_DIR/content/content_backup_$TIMESTAMP.tar.gz" ]; then
        echo "✓ Content: $(du -h "$BACKUP_DIR/content/content_backup_$TIMESTAMP.tar.gz" | cut -f1)" >> "$manifest_file"
    fi
    
    if [ -f "$BACKUP_DIR/config/config_backup_$TIMESTAMP.tar.gz" ]; then
        echo "✓ Configuration: $(du -h "$BACKUP_DIR/config/config_backup_$TIMESTAMP.tar.gz" | cut -f1)" >> "$manifest_file"
    fi
    
    if [ -f "$BACKUP_DIR/logs/app_logs_$TIMESTAMP.txt" ]; then
        echo "✓ Application Logs: $(du -h "$BACKUP_DIR/logs/app_logs_$TIMESTAMP.txt" | cut -f1)" >> "$manifest_file"
    fi
    
    cat >> "$manifest_file" << EOF

SYSTEM INFORMATION:
- Total Backup Size: $(du -sh "$BACKUP_DIR" | cut -f1)
- Available Disk Space: $(df -h /home/deploy | tail -1 | awk '{print $4}')
- Memory Usage: $(free -h | grep Mem | awk '{print $3"/"$2}')

DATABASE STATISTICS:
$(cat "$BACKUP_DIR/stats/db_stats_$TIMESTAMP.txt" 2>/dev/null || echo "Statistics not available")

CONTENT STATISTICS:
- Total Files: $(cat "$BACKUP_DIR/stats/content_inventory_$TIMESTAMP.txt" 2>/dev/null | wc -l || echo "Unknown")

RESTORE INSTRUCTIONS:
1. Stop application: docker-compose -f $APP_DIR/$COMPOSE_FILE down
2. Restore database: gunzip -c $BACKUP_DIR/database/database_backup_$TIMESTAMP.sql.gz | docker-compose -f $APP_DIR/$COMPOSE_FILE exec -T db psql -U postgres personal_website
3. Restore content: tar -xzf $BACKUP_DIR/content/content_backup_$TIMESTAMP.tar.gz -C $APP_DIR/
4. Restore config: tar -xzf $BACKUP_DIR/config/config_backup_$TIMESTAMP.tar.gz -C $APP_DIR/
5. Start application: docker-compose -f $APP_DIR/$COMPOSE_FILE up -d

BACKUP RETENTION:
This backup will be automatically deleted after $RETENTION_DAYS days.
================================================================================
EOF
    
    print_success "Backup manifest created: $manifest_file"
}

# Cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    find "$BACKUP_DIR" -name "*backup_*.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null && deleted_count=$((deleted_count + 1))
    find "$BACKUP_DIR" -name "*backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null && deleted_count=$((deleted_count + 1))
    find "$BACKUP_DIR" -name "*backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null && deleted_count=$((deleted_count + 1))
    find "$BACKUP_DIR" -name "db_stats_*.txt" -mtime +$RETENTION_DAYS -delete 2>/dev/null
    find "$BACKUP_DIR" -name "app_logs_*.txt" -mtime +$RETENTION_DAYS -delete 2>/dev/null
    find "$BACKUP_DIR" -name "backup_manifest_*.txt" -mtime +$RETENTION_DAYS -delete 2>/dev/null
    find "$BACKUP_DIR" -name "content_inventory_*.txt" -mtime +$RETENTION_DAYS -delete 2>/dev/null
    
    if [ $deleted_count -gt 0 ]; then
        print_success "Cleaned up old backups"
    else
        print_status "No old backups to clean up"
    fi
}

# Verify backup integrity
verify_backup_integrity() {
    print_status "Verifying backup integrity..."
    
    local errors=()
    
    # Verify database backup
    if [ -f "$BACKUP_DIR/database/database_backup_$TIMESTAMP.sql.gz" ]; then
        if ! gzip -t "$BACKUP_DIR/database/database_backup_$TIMESTAMP.sql.gz" 2>/dev/null; then
            errors+=("Database backup corrupted")
        fi
    else
        errors+=("Database backup missing")
    fi
    
    # Verify content backup
    if [ -f "$BACKUP_DIR/content/content_backup_$TIMESTAMP.tar.gz" ]; then
        if ! tar -tzf "$BACKUP_DIR/content/content_backup_$TIMESTAMP.tar.gz" >/dev/null 2>&1; then
            errors+=("Content backup corrupted")
        fi
    else
        errors+=("Content backup missing")
    fi
    
    # Verify config backup
    if [ -f "$BACKUP_DIR/config/config_backup_$TIMESTAMP.tar.gz" ]; then
        if ! tar -tzf "$BACKUP_DIR/config/config_backup_$TIMESTAMP.tar.gz" >/dev/null 2>&1; then
            errors+=("Configuration backup corrupted")
        fi
    else
        errors+=("Configuration backup missing")
    fi
    
    if [ ${#errors[@]} -eq 0 ]; then
        print_success "Backup integrity verification passed"
    else
        print_error "Backup integrity verification failed: ${errors[*]}"
        exit 1
    fi
}

# Generate backup summary
generate_backup_summary() {
    local summary_file="$BACKUP_DIR/backup_summary.txt"
    
    cat > "$summary_file" << EOF
=== LATEST BACKUP SUMMARY ===
Backup Date: $(date)
Backup ID: $TIMESTAMP
Status: Completed Successfully

Total Backup Size: $(du -sh "$BACKUP_DIR" | cut -f1)
Available Space: $(df -h /home/deploy | tail -1 | awk '{print $4}')

Recent Backups:
$(find "$BACKUP_DIR" -name "backup_manifest_*.txt" -mtime -7 | sort -r | head -5 | while read file; do echo "- $(basename "$file" .txt)"; done)

Last Backup Verification: $(date)
=== END SUMMARY ===
EOF
    
    print_success "Backup summary updated"
}

# Main execution
main() {
    print_header
    
    print_status "Starting complete system backup..."
    print_status "Environment: $ENVIRONMENT"
    print_status "Backup ID: $TIMESTAMP"
    print_status "Application Directory: $APP_DIR"
    print_status "Backup Directory: $BACKUP_DIR"
    
    setup_backup_environment
    check_prerequisites
    backup_database
    backup_content
    backup_configuration
    generate_database_statistics
    backup_application_logs
    create_backup_manifest
    cleanup_old_backups
    verify_backup_integrity
    generate_backup_summary
    
    print_success "Complete system backup finished successfully!"
    print_status "Backup location: $BACKUP_DIR"
    print_status "Backup ID: $TIMESTAMP"
    print_status "Total backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"
    
    # Show manifest summary
    echo ""
    echo "=== BACKUP MANIFEST SUMMARY ==="
    cat "$BACKUP_DIR/backup_manifest_$TIMESTAMP.txt" | grep -A 10 "BACKUP COMPONENTS:"
}

# Run main function
main "$@" 