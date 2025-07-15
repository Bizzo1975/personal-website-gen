#!/bin/bash

# Export Development Data for Production Migration
# This script exports database and content from development environment

set -e  # Exit on any error

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_DIR="migration_export_$TIMESTAMP"

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
    echo "Personal Website - Development Data Export"
    echo "=========================================="
    echo ""
}

# Get configuration from environment or user input
get_config() {
    print_status "Gathering export configuration..."
    
    # Database configuration
    DB_HOST=${DEV_DB_HOST:-localhost}
    DB_PORT=${DEV_DB_PORT:-5436}
    DB_USER=${DEV_DB_USER:-postgres}
    DB_NAME=${DEV_DB_NAME:-personal_website}
    
    # If password not provided in environment, ask for it
    if [ -z "$DEV_DB_PASSWORD" ]; then
        read -s -p "Development database password: " DB_PASSWORD
        echo ""
    else
        DB_PASSWORD="$DEV_DB_PASSWORD"
    fi
    
    # Production server details (if not provided, ask)
    if [ -z "$PROD_SERVER" ]; then
        read -p "Production server IP/hostname: " PROD_SERVER
    fi
    
    if [ -z "$PROD_USER" ]; then
        read -p "Production server user (default: deploy): " PROD_USER
        PROD_USER=${PROD_USER:-deploy}
    fi
    
    if [ -z "$SSH_PORT" ]; then
        read -p "SSH port (default: 22): " SSH_PORT
        SSH_PORT=${SSH_PORT:-22}
    fi
    
    print_status "Configuration loaded"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    command -v pg_dump >/dev/null 2>&1 || missing_tools+=("pg_dump")
    command -v psql >/dev/null 2>&1 || missing_tools+=("psql")
    command -v tar >/dev/null 2>&1 || missing_tools+=("tar")
    command -v gzip >/dev/null 2>&1 || missing_tools+=("gzip")
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check if we're in the project directory
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Setup export directory
setup_export_directory() {
    print_status "Setting up export directory..."
    
    mkdir -p "$EXPORT_DIR"/{database,content,logs,stats,config}
    
    print_success "Export directory created: $EXPORT_DIR"
}

# Test database connection
test_database_connection() {
    print_status "Testing database connection..."
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null || {
        print_error "Cannot connect to development database"
        print_error "Connection details: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
        exit 1
    }
    
    print_success "Database connection successful"
}

# Generate pre-migration statistics
generate_pre_migration_stats() {
    print_status "Generating pre-migration database statistics..."
    
    local stats_file="$EXPORT_DIR/stats/database_stats_pre_migration.txt"
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            'users' as table_name, COUNT(*) as record_count FROM users
        UNION ALL
        SELECT 'posts', COUNT(*) FROM posts
        UNION ALL  
        SELECT 'projects', COUNT(*) FROM projects
        UNION ALL
        SELECT 'pages', COUNT(*) FROM pages
        UNION ALL
        SELECT 'categories', COUNT(*) FROM categories
        UNION ALL
        SELECT 'access_requests', COUNT(*) FROM access_requests
        UNION ALL
        SELECT 'user_access_levels', COUNT(*) FROM user_access_levels
        UNION ALL
        SELECT 'media_files', COUNT(*) FROM media_files
        UNION ALL
        SELECT 'newsletter_subscribers', COUNT(*) FROM newsletter_subscribers
        ORDER BY table_name;
    " > "$stats_file" 2>/dev/null || print_warning "Could not generate complete database statistics"
    
    # Generate additional database info
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    " > "$EXPORT_DIR/stats/table_sizes.txt" 2>/dev/null
    
    print_success "Database statistics generated"
}

# Export database
export_database() {
    print_status "Exporting database..."
    
    local db_file="$EXPORT_DIR/database/production_migration_$TIMESTAMP.sql"
    local log_file="$EXPORT_DIR/logs/pg_dump.log"
    
    # Create production-ready database export
    print_status "Creating database export (this may take a few minutes)..."
    
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        --verbose \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        --exclude-table-data=sessions \
        --exclude-table-data=verification_tokens \
        -d "$DB_NAME" > "$db_file" 2>"$log_file"
    
    if [ $? -eq 0 ]; then
        # Compress the export
        gzip "$db_file"
        local compressed_size=$(du -h "${db_file}.gz" | cut -f1)
        print_success "Database export completed: ${compressed_size}"
        
        # Verify the compressed file
        if ! gzip -t "${db_file}.gz" 2>/dev/null; then
            print_error "Database export file is corrupted"
            exit 1
        fi
        
        print_success "Database export verified"
    else
        print_error "Database export failed. Check $log_file"
        exit 1
    fi
}

# Export content files
export_content() {
    print_status "Exporting content files..."
    
    # Create content directory structure
    mkdir -p "$EXPORT_DIR/content"/{images,uploads,media}
    
    local files_found=0
    
    # Copy images directory
    if [ -d "public/images" ]; then
        cp -r public/images/* "$EXPORT_DIR/content/images/" 2>/dev/null && \
        files_found=$((files_found + $(find "$EXPORT_DIR/content/images" -type f | wc -l)))
        print_status "Exported images directory"
    fi
    
    # Copy uploads directory
    if [ -d "public/uploads" ]; then
        cp -r public/uploads/* "$EXPORT_DIR/content/uploads/" 2>/dev/null && \
        files_found=$((files_found + $(find "$EXPORT_DIR/content/uploads" -type f | wc -l)))
        print_status "Exported uploads directory"
    fi
    
    # Find and copy additional media files
    find public -name "*.jpg" -o -name "*.png" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" 2>/dev/null | \
        while read -r file; do
            cp "$file" "$EXPORT_DIR/content/media/" 2>/dev/null
        done
    
    # Update file count
    files_found=$(find "$EXPORT_DIR/content" -type f | wc -l)
    
    # Create content archive
    tar -czf "$EXPORT_DIR/production_content_$TIMESTAMP.tar.gz" -C "$EXPORT_DIR" content/ 2>/dev/null
    
    # Generate content statistics
    echo "Total files: $files_found" > "$EXPORT_DIR/stats/content_stats.txt"
    du -sh "$EXPORT_DIR/content" >> "$EXPORT_DIR/stats/content_stats.txt" 2>/dev/null
    
    # Create content inventory
    find "$EXPORT_DIR/content" -type f > "$EXPORT_DIR/stats/content_inventory.txt"
    
    print_success "Content export completed: $files_found files"
}

# Export configuration files
export_configuration() {
    print_status "Exporting configuration files..."
    
    # Copy environment configuration (without sensitive data)
    if [ -f ".env.local" ]; then
        # Create sanitized version of .env.local
        grep -v -E "(PASSWORD|SECRET|KEY)" .env.local > "$EXPORT_DIR/config/env_reference.txt" 2>/dev/null || true
    fi
    
    # Copy Docker configurations
    cp docker-compose.yml "$EXPORT_DIR/config/" 2>/dev/null || true
    cp docker-compose.prod.yml "$EXPORT_DIR/config/" 2>/dev/null || true
    cp Dockerfile "$EXPORT_DIR/config/" 2>/dev/null || true
    cp nginx.conf "$EXPORT_DIR/config/" 2>/dev/null || true
    
    # Copy package.json for reference
    cp package.json "$EXPORT_DIR/config/" 2>/dev/null || true
    
    print_success "Configuration files exported"
}

# Validate export integrity
validate_export() {
    print_status "Validating export integrity..."
    
    local errors=()
    
    # Check database export
    if [ ! -f "$EXPORT_DIR/database/production_migration_$TIMESTAMP.sql.gz" ]; then
        errors+=("Database export missing")
    elif ! gzip -t "$EXPORT_DIR/database/production_migration_$TIMESTAMP.sql.gz" 2>/dev/null; then
        errors+=("Database export corrupted")
    fi
    
    # Check content archive
    if [ ! -f "$EXPORT_DIR/production_content_$TIMESTAMP.tar.gz" ]; then
        errors+=("Content archive missing")
    elif ! tar -tzf "$EXPORT_DIR/production_content_$TIMESTAMP.tar.gz" >/dev/null 2>&1; then
        errors+=("Content archive corrupted")
    fi
    
    # Check statistics files
    if [ ! -f "$EXPORT_DIR/stats/database_stats_pre_migration.txt" ]; then
        errors+=("Database statistics missing")
    fi
    
    if [ ${#errors[@]} -eq 0 ]; then
        print_success "Export validation passed"
    else
        print_error "Export validation failed: ${errors[*]}"
        exit 1
    fi
}

# Transfer to production server
transfer_to_production() {
    if [ -z "$PROD_SERVER" ]; then
        print_warning "Production server not specified, skipping transfer"
        print_status "Files ready for manual transfer in: $EXPORT_DIR"
        return
    fi
    
    print_status "Transferring files to production server..."
    
    # Test connection first
    if ! ssh -p "$SSH_PORT" -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_SERVER" "echo 'Connection test successful'" >/dev/null 2>&1; then
        print_error "Cannot connect to production server"
        print_status "Files ready for manual transfer in: $EXPORT_DIR"
        return
    fi
    
    # Transfer database backup
    scp -P "$SSH_PORT" "$EXPORT_DIR/database/production_migration_$TIMESTAMP.sql.gz" \
        "$PROD_USER@$PROD_SERVER:/home/deploy/" || {
        print_error "Failed to transfer database backup"
        exit 1
    }
    
    # Transfer content backup
    scp -P "$SSH_PORT" "$EXPORT_DIR/production_content_$TIMESTAMP.tar.gz" \
        "$PROD_USER@$PROD_SERVER:/home/deploy/" || {
        print_error "Failed to transfer content backup"
        exit 1
    }
    
    # Transfer statistics files
    scp -P "$SSH_PORT" "$EXPORT_DIR/stats/"* \
        "$PROD_USER@$PROD_SERVER:/home/deploy/" 2>/dev/null || print_warning "Could not transfer statistics files"
    
    print_success "Files transferred to production server"
}

# Generate export summary
generate_export_summary() {
    local summary_file="$EXPORT_DIR/EXPORT_SUMMARY.txt"
    
    cat > "$summary_file" << EOF
================================================================================
DEVELOPMENT DATA EXPORT SUMMARY
================================================================================

Export Date: $(date)
Export ID: $TIMESTAMP
Source Database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME
Target Server: ${PROD_SERVER:-"Manual transfer required"}

FILES CREATED:
- Database export: production_migration_$TIMESTAMP.sql.gz ($(du -h "$EXPORT_DIR/database/production_migration_$TIMESTAMP.sql.gz" 2>/dev/null | cut -f1 || echo "Unknown size"))
- Content archive: production_content_$TIMESTAMP.tar.gz ($(du -h "$EXPORT_DIR/production_content_$TIMESTAMP.tar.gz" 2>/dev/null | cut -f1 || echo "Unknown size"))
- Statistics: $(ls "$EXPORT_DIR/stats/" | wc -l) files
- Configuration: $(ls "$EXPORT_DIR/config/" | wc -l) files

DATABASE STATISTICS:
$(cat "$EXPORT_DIR/stats/database_stats_pre_migration.txt" 2>/dev/null || echo "Statistics not available")

CONTENT STATISTICS:
$(cat "$EXPORT_DIR/stats/content_stats.txt" 2>/dev/null || echo "Content stats not available")

EXPORT DIRECTORY: $EXPORT_DIR
TOTAL EXPORT SIZE: $(du -sh "$EXPORT_DIR" | cut -f1)

NEXT STEPS:
1. Run validate-export.sh to verify export integrity
2. Transfer files to production server (if not already done)
3. Run import-to-production.sh on production server
4. Verify migration success

TRANSFER COMMANDS (if manual transfer needed):
scp -P $SSH_PORT $EXPORT_DIR/database/production_migration_$TIMESTAMP.sql.gz $PROD_USER@$PROD_SERVER:/home/deploy/
scp -P $SSH_PORT $EXPORT_DIR/production_content_$TIMESTAMP.tar.gz $PROD_USER@$PROD_SERVER:/home/deploy/

================================================================================
EOF
    
    print_success "Export summary generated: $summary_file"
    cat "$summary_file"
}

# Main execution
main() {
    print_header
    
    get_config
    check_prerequisites
    setup_export_directory
    test_database_connection
    generate_pre_migration_stats
    export_database
    export_content
    export_configuration
    validate_export
    transfer_to_production
    generate_export_summary
    
    print_success "Development data export completed successfully!"
    print_status "Export directory: $EXPORT_DIR"
    print_status "Next: Run validate-export.sh to verify export integrity"
}

# Run main function
main "$@" 