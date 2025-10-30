#!/bin/bash

# Personal Website - Production Migration Script
# This script automates the migration of database and content from development to production

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MIGRATION_DIR="migration_$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if required tools are available
check_requirements() {
    print_status "Checking requirements..."
    
    local missing_tools=()
    
    command -v pg_dump >/dev/null 2>&1 || missing_tools+=("pg_dump")
    command -v psql >/dev/null 2>&1 || missing_tools+=("psql")
    command -v tar >/dev/null 2>&1 || missing_tools+=("tar")
    command -v gzip >/dev/null 2>&1 || missing_tools+=("gzip")
    command -v scp >/dev/null 2>&1 || missing_tools+=("scp")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    print_success "All required tools are available"
}

# Function to get user input
get_migration_config() {
    echo ""
    echo "=========================================="
    echo "Personal Website Migration Configuration"
    echo "=========================================="
    echo ""
    
    # Development database configuration
    print_status "Development Database Configuration:"
    read -p "Database host (default: localhost): " DEV_DB_HOST
    DEV_DB_HOST=${DEV_DB_HOST:-localhost}
    
    read -p "Database port (default: 5436): " DEV_DB_PORT
    DEV_DB_PORT=${DEV_DB_PORT:-5436}
    
    read -p "Database user (default: postgres): " DEV_DB_USER
    DEV_DB_USER=${DEV_DB_USER:-postgres}
    
    read -p "Database name (default: personal_website): " DEV_DB_NAME
    DEV_DB_NAME=${DEV_DB_NAME:-personal_website}
    
    read -s -p "Database password: " DEV_DB_PASSWORD
    echo ""
    
    # Production server configuration
    print_status "Production Server Configuration:"
    read -p "Production server IP/hostname: " PROD_SERVER
    
    read -p "Production server user (default: deploy): " PROD_USER
    PROD_USER=${PROD_USER:-deploy}
    
    read -p "Production server SSH port (default: 22): " PROD_SSH_PORT
    PROD_SSH_PORT=${PROD_SSH_PORT:-22}
    
    # Confirmation
    echo ""
    echo "=========================================="
    echo "Migration Configuration Summary"
    echo "=========================================="
    echo "Source Database: ${DEV_DB_USER}@${DEV_DB_HOST}:${DEV_DB_PORT}/${DEV_DB_NAME}"
    echo "Target Server: ${PROD_USER}@${PROD_SERVER}:${PROD_SSH_PORT}"
    echo "Migration Directory: ${MIGRATION_DIR}"
    echo ""
    
    read -p "Proceed with migration? (y/N): " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        print_status "Migration cancelled by user"
        exit 0
    fi
}

# Function to create migration directory
setup_migration_directory() {
    print_status "Setting up migration directory..."
    
    mkdir -p "$MIGRATION_DIR"/{database,content,logs,stats}
    
    print_success "Migration directory created: $MIGRATION_DIR"
}

# Function to backup and export database
export_database() {
    print_status "Exporting database..."
    
    local db_file="$MIGRATION_DIR/database/production_migration_$TIMESTAMP.sql"
    
    # Test database connection first
    PGPASSWORD="$DEV_DB_PASSWORD" psql -h "$DEV_DB_HOST" -p "$DEV_DB_PORT" -U "$DEV_DB_USER" -d "$DEV_DB_NAME" -c "\q" 2>/dev/null || {
        print_error "Cannot connect to development database"
        exit 1
    }
    
    # Create pre-migration statistics
    print_status "Generating pre-migration database statistics..."
    PGPASSWORD="$DEV_DB_PASSWORD" psql -h "$DEV_DB_HOST" -p "$DEV_DB_PORT" -U "$DEV_DB_USER" -d "$DEV_DB_NAME" -c "
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
        SELECT 'newsletter_subscribers', COUNT(*) FROM newsletter_subscribers;
    " > "$MIGRATION_DIR/stats/database_stats_pre_migration.txt" 2>/dev/null || print_warning "Could not generate database statistics"
    
    # Create production-ready database export
    print_status "Creating database export (this may take a few minutes)..."
    PGPASSWORD="$DEV_DB_PASSWORD" pg_dump \
        -h "$DEV_DB_HOST" \
        -p "$DEV_DB_PORT" \
        -U "$DEV_DB_USER" \
        --verbose \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        --exclude-table-data=sessions \
        --exclude-table-data=verification_tokens \
        -d "$DEV_DB_NAME" > "$db_file" 2>"$MIGRATION_DIR/logs/pg_dump.log"
    
    if [ $? -eq 0 ]; then
        # Compress the export
        gzip "$db_file"
        local compressed_size=$(du -h "${db_file}.gz" | cut -f1)
        print_success "Database export completed: ${compressed_size}"
    else
        print_error "Database export failed. Check $MIGRATION_DIR/logs/pg_dump.log"
        exit 1
    fi
}

# Function to backup content files
export_content() {
    print_status "Exporting content files..."
    
    # Create content directory structure
    mkdir -p "$MIGRATION_DIR/content"/{images,uploads,media}
    
    # Copy content files if they exist
    local files_found=0
    
    if [ -d "public/images" ]; then
        cp -r public/images/* "$MIGRATION_DIR/content/images/" 2>/dev/null && files_found=$((files_found + $(find "$MIGRATION_DIR/content/images" -type f | wc -l)))
    fi
    
    if [ -d "public/uploads" ]; then
        cp -r public/uploads/* "$MIGRATION_DIR/content/uploads/" 2>/dev/null && files_found=$((files_found + $(find "$MIGRATION_DIR/content/uploads" -type f | wc -l)))
    fi
    
    # Find additional media files
    find public -name "*.jpg" -o -name "*.png" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" 2>/dev/null | \
        while read -r file; do
            cp "$file" "$MIGRATION_DIR/content/media/" 2>/dev/null
        done
    
    # Create content archive
    tar -czf "$MIGRATION_DIR/production_content_$TIMESTAMP.tar.gz" -C "$MIGRATION_DIR" content/ 2>/dev/null
    
    # Generate content statistics
    echo "Total files: $files_found" > "$MIGRATION_DIR/stats/content_stats.txt"
    du -sh "$MIGRATION_DIR/content" >> "$MIGRATION_DIR/stats/content_stats.txt" 2>/dev/null
    
    print_success "Content export completed: $files_found files"
}

# Function to test production server connection
test_production_connection() {
    print_status "Testing production server connection..."
    
    ssh -p "$PROD_SSH_PORT" -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_SERVER" "echo 'Connection test successful'" 2>/dev/null || {
        print_error "Cannot connect to production server. Please check:"
        echo "  - Server IP/hostname: $PROD_SERVER"
        echo "  - SSH port: $PROD_SSH_PORT"
        echo "  - User: $PROD_USER"
        echo "  - SSH key authentication is set up"
        exit 1
    }
    
    print_success "Production server connection verified"
}

# Function to transfer files to production
transfer_to_production() {
    print_status "Transferring migration files to production server..."
    
    # Transfer database backup
    scp -P "$PROD_SSH_PORT" "$MIGRATION_DIR/database/production_migration_$TIMESTAMP.sql.gz" \
        "$PROD_USER@$PROD_SERVER:/home/deploy/" || {
        print_error "Failed to transfer database backup"
        exit 1
    }
    
    # Transfer content backup
    scp -P "$PROD_SSH_PORT" "$MIGRATION_DIR/production_content_$TIMESTAMP.tar.gz" \
        "$PROD_USER@$PROD_SERVER:/home/deploy/" || {
        print_error "Failed to transfer content backup"
        exit 1
    }
    
    # Transfer statistics files
    scp -P "$PROD_SSH_PORT" "$MIGRATION_DIR/stats/"* \
        "$PROD_USER@$PROD_SERVER:/home/deploy/" 2>/dev/null || print_warning "Could not transfer statistics files"
    
    print_success "Files transferred to production server"
}

# Function to generate migration instructions
generate_instructions() {
    local instructions_file="$MIGRATION_DIR/PRODUCTION_MIGRATION_INSTRUCTIONS.txt"
    
    cat > "$instructions_file" << EOF
================================================================================
PRODUCTION MIGRATION INSTRUCTIONS
================================================================================

Migration Timestamp: $TIMESTAMP
Generated: $(date)

Files transferred to production server ($PROD_SERVER):
- Database: production_migration_$TIMESTAMP.sql.gz
- Content: production_content_$TIMESTAMP.tar.gz
- Statistics: database_stats_pre_migration.txt, content_stats.txt

================================================================================
NEXT STEPS - RUN ON PRODUCTION SERVER
================================================================================

1. SSH into production server:
   ssh -p $PROD_SSH_PORT $PROD_USER@$PROD_SERVER

2. Navigate to application directory:
   cd /home/deploy/personal-website

3. Ensure Docker containers are running:
   docker compose -f docker-compose.prod.yml ps
   
   If not running, start them:
   docker compose -f docker-compose.prod.yml up -d

4. Import database:
   mkdir -p /home/deploy/migration
   cd /home/deploy/migration
   cp ../production_migration_$TIMESTAMP.sql.gz .
   gunzip production_migration_$TIMESTAMP.sql.gz
   
   docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db \\
     psql -U postgres -d personal_website < production_migration_$TIMESTAMP.sql

5. Import content:
   cd /home/deploy
   tar -xzf production_content_$TIMESTAMP.tar.gz
   mkdir -p /home/deploy/personal-website/public/{images,uploads}
   cp -r content/images/* /home/deploy/personal-website/public/images/ 2>/dev/null || true
   cp -r content/uploads/* /home/deploy/personal-website/public/uploads/ 2>/dev/null || true
   
   # Set permissions
   sudo chown -R deploy:deploy /home/deploy/personal-website/public/
   chmod -R 755 /home/deploy/personal-website/public/

6. Restart application:
   docker compose -f /home/deploy/personal-website/docker-compose.prod.yml restart app

7. Verify migration:
   # Test database
   docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec db \\
     psql -U postgres -d personal_website -c "SELECT COUNT(*) FROM users;"
   
   # Test website
   curl -I https://willworkforlunch.com
   
   # Test admin access
   curl -I https://willworkforlunch.com/admin

================================================================================
ROLLBACK PROCEDURE (if needed)
================================================================================

If the migration fails, you can rollback by:

1. Stop containers:
   docker compose -f /home/deploy/personal-website/docker-compose.prod.yml down

2. Remove volumes:
   docker volume rm personal-website_postgres_data personal-website_redis_data

3. Restart with fresh installation:
   docker compose -f /home/deploy/personal-website/docker-compose.prod.yml up -d --build

================================================================================
MIGRATION VALIDATION CHECKLIST
================================================================================

After completing the migration, verify:
- [ ] Website loads: https://willworkforlunch.com
- [ ] Admin panel accessible: https://willworkforlunch.com/admin
- [ ] Can login with existing admin credentials
- [ ] Posts and projects display correctly
- [ ] Images and media files load properly
- [ ] Contact forms work (if applicable)
- [ ] Newsletter functionality works (if applicable)

================================================================================
SUPPORT
================================================================================

If you encounter issues:
1. Check application logs: docker compose logs -f app
2. Check database connectivity: docker compose exec db psql -U postgres -c "\\l"
3. Verify file permissions: ls -la /home/deploy/personal-website/public/
4. Review the deployment plan: DEPLOYMENT_PLAN.md

Local migration files are preserved in: $MIGRATION_DIR
EOF

    print_success "Migration instructions generated: $instructions_file"
}

# Function to create migration summary
create_migration_summary() {
    local summary_file="$MIGRATION_DIR/MIGRATION_SUMMARY.txt"
    
    cat > "$summary_file" << EOF
================================================================================
MIGRATION SUMMARY
================================================================================

Migration Date: $(date)
Migration ID: $TIMESTAMP
Source Database: ${DEV_DB_USER}@${DEV_DB_HOST}:${DEV_DB_PORT}/${DEV_DB_NAME}
Target Server: ${PROD_USER}@${PROD_SERVER}

FILES CREATED:
- Database export: production_migration_$TIMESTAMP.sql.gz
- Content archive: production_content_$TIMESTAMP.tar.gz
- Pre-migration stats: $(cat "$MIGRATION_DIR/stats/database_stats_pre_migration.txt" 2>/dev/null | wc -l || echo "0") database records
- Content files: $(cat "$MIGRATION_DIR/stats/content_stats.txt" 2>/dev/null | head -1 | cut -d: -f2 || echo "unknown")

STATUS: Ready for production deployment

NEXT STEPS:
1. Follow instructions in: PRODUCTION_MIGRATION_INSTRUCTIONS.txt
2. Run migration commands on production server
3. Verify functionality after migration
4. Keep this directory as backup until migration is confirmed successful

BACKUP RETENTION:
Keep this migration directory for at least 30 days after successful deployment
as it contains the complete development environment backup.
EOF

    print_success "Migration summary created: $summary_file"
}

# Main migration function
main() {
    echo ""
    echo "=========================================="
    echo "Personal Website - Production Migration"
    echo "=========================================="
    echo ""
    
    check_requirements
    get_migration_config
    setup_migration_directory
    
    print_status "Starting migration process..."
    
    export_database
    export_content
    test_production_connection
    transfer_to_production
    generate_instructions
    create_migration_summary
    
    echo ""
    echo "=========================================="
    echo "MIGRATION PREPARATION COMPLETE!"
    echo "=========================================="
    echo ""
    print_success "All migration files have been prepared and transferred to production"
    print_status "Local migration directory: $MIGRATION_DIR"
    print_status "Next step: Follow instructions in $MIGRATION_DIR/PRODUCTION_MIGRATION_INSTRUCTIONS.txt"
    echo ""
    print_warning "IMPORTANT: Keep the $MIGRATION_DIR directory until migration is verified successful"
    echo ""
}

# Run main function
main "$@" 