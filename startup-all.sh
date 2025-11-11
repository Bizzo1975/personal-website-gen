#!/bin/bash

# Don't use set -e - it causes issues with Docker commands that may fail gracefully
# set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo "========================================"
    echo "Personal Website - Docker Development Environment"
    echo "========================================"
    echo ""
}

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

print_header

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project directory!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# [1/7] Check Docker installation and service
print_status "[1/7] Checking Docker installation..."

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
    print_error "Docker is not installed!"
    echo "Please install Docker: sudo apt install -y docker.io"
    exit 1
fi

# Check if docker-compose is installed and working
# Prefer docker compose (v2) as it doesn't have Python 3.12 compatibility issues
COMPOSE_CMD=""

# First, try docker compose (v2) - preferred, no Python issues
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
    print_success "Using 'docker compose' (v2) - recommended"
# Fallback to docker-compose (v1) if v2 is not available
elif command -v docker-compose >/dev/null 2>&1; then
    # Test if docker-compose actually works (Python 3.12 compatibility issue)
    if docker-compose --version >/dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
        print_success "Using 'docker-compose' (v1)"
    else
        print_error "docker-compose is installed but broken (Python 3.12 distutils issue)"
        print_error ""
        print_error "SOLUTION: Fix docker-compose v1 with python3-setuptools:"
        echo "  sudo apt install -y python3-setuptools"
        echo ""
        print_error "After installing, run this script again."
        echo ""
        print_status "Attempting to use docker compose (v2) as fallback..."
        if docker compose version >/dev/null 2>&1; then
            COMPOSE_CMD="docker compose"
            print_success "Using 'docker compose' (v2) instead"
        else
            print_error "Neither docker-compose nor docker compose works!"
            print_error ""
            print_error "Please fix docker-compose:"
            echo "  sudo apt install -y python3-setuptools"
            print_error ""
            print_error "Note: docker-compose-plugin is only available if Docker was installed"
            print_error "from Docker's official repository, not Ubuntu's default repos."
            exit 1
        fi
    fi
else
    print_error "docker-compose is not installed!"
    echo ""
    print_error "Install docker-compose:"
    echo "  sudo apt install -y docker-compose python3-setuptools"
    exit 1
fi

# Check if running as root - if so, skip all sudo checks
DOCKER_CMD="docker"
NEED_SUDO=false

if [ "$EUID" -eq 0 ]; then
    # Running as root - no sudo needed
    print_success "Running as root - no sudo required"
    NEED_SUDO=false
    if [ "$COMPOSE_CMD" = "docker compose" ]; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
elif docker info >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
    # Not root, but Docker works without sudo
    print_success "Docker is accessible without sudo"
    NEED_SUDO=false
    if [ "$COMPOSE_CMD" = "docker compose" ]; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
else
    # Not root and Docker requires sudo
    # Check if Docker service is running
    if systemctl is-active --quiet docker 2>/dev/null || sudo systemctl is-active --quiet docker 2>/dev/null; then
        # Check if user is in docker group
        if groups | grep -q docker; then
            print_warning "User is in docker group but commands still require sudo"
            print_warning "You need to activate the group: newgrp docker"
            print_warning "OR run this script as root: sudo ./startup-all.sh"
            print_status "For now, script will use sudo (you'll be prompted)"
            NEED_SUDO=true
        else
            print_error "User is NOT in docker group - sudo will be required!"
            print_error ""
            print_error "To fix this permanently (no sudo needed), run:"
            echo "  sudo usermod -aG docker $USER"
            echo "  newgrp docker"
            echo ""
            print_error "OR run this script as root: sudo ./startup-all.sh"
            print_status "For now, script will use sudo (you'll be prompted for password)"
            NEED_SUDO=true
        fi
    else
        print_error "Docker service does not appear to be running!"
        echo "Please start Docker: sudo systemctl start docker"
        echo "Or enable it: sudo systemctl enable --now docker"
        echo "Or run this script as root: sudo ./startup-all.sh"
        exit 1
    fi
    
    # Set command prefix if sudo is needed
    if [ "$NEED_SUDO" = true ]; then
        DOCKER_CMD="sudo docker"
        if [ "$COMPOSE_CMD" = "docker compose" ]; then
            COMPOSE_CMD="sudo docker compose"
        else
            COMPOSE_CMD="sudo docker-compose"
        fi
        print_warning "Using sudo for Docker commands (you'll be prompted for password)"
    fi
fi

print_success "Docker check completed - proceeding with container startup"

# Note: We don't use a wrapper function for docker-compose anymore
# Instead, we call docker-compose directly and let it fail gracefully
# This prevents issues with function parameter handling that could crash Docker

# [2/7] Clean up processes and containers
print_status "[2/7] Cleaning up processes and containers..."

# Kill any running Node processes
pkill -f "node.*next" 2>/dev/null || true

# Kill any hanging npx processes (from previous failed kill-port attempts)
pkill -f "npx.*kill-port" 2>/dev/null || true

# Kill ports using native tools (faster than npx kill-port)
print_status "Freeing up ports..."
for port in 3006 5436 6386 8086; do
    # Use lsof or fuser to find and kill processes on ports (much faster)
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    elif command -v fuser >/dev/null 2>&1; then
        fuser -k $port/tcp 2>/dev/null || true
    else
        # Fallback to npx kill-port with timeout (only if other tools not available)
        timeout 3 npx kill-port $port >/dev/null 2>&1 || true
    fi
done

# Stop existing containers (safely - don't force if they don't exist)
print_status "Stopping existing containers..."
# Use timeout to prevent hanging
if timeout 10 $COMPOSE_CMD ps >/dev/null 2>&1; then
    # Containers exist, stop them gracefully with timeout
    timeout 30 $COMPOSE_CMD down >/dev/null 2>&1 || true
    # If down fails, try force removal of app container specifically
    # Check if app container exists and force remove it to avoid permission issues
    if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "personal-website-gen_app_1"; then
        print_status "Force removing app container due to permission issues..."
        docker rm -f personal-website-gen_app_1 2>/dev/null || true
    fi
else
    print_status "No existing containers to stop"
fi

# Clean cache
print_status "Cleaning build cache..."
rm -rf .next >/dev/null 2>&1 || true

# Only clear Docker build cache if explicitly needed (not every run)
# This was causing issues - Docker cache allows skipping unnecessary stages
# Uncomment the lines below ONLY if you're experiencing cache corruption issues
# print_status "Clearing Docker build cache..."
# if [ "$EUID" -eq 0 ]; then
#     docker builder prune -f >/dev/null 2>&1 || true
# else
#     $DOCKER_CMD builder prune -f >/dev/null 2>&1 || true
# fi

# [3/7] Setup environment
print_status "[3/7] Setting up environment configuration..."

# Fix password mismatch - docker-compose.yml uses admin123, not password
if [ ! -f ".env.local" ]; then
    print_status "Creating .env.local file..."
    cat > .env.local << 'EOF'
# Development Environment Configuration
DATABASE_URL=postgresql://postgres:admin123@localhost:5436/personal_website
POSTGRES_DB=personal_website
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin123
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3006
NEXTAUTH_URL_INTERNAL=http://localhost:3006
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
REDIS_URL=redis://localhost:6386
EOF
    print_success "Environment file created"
else
    print_status "Environment file already exists"
    # Update password if it's wrong
    if grep -q "POSTGRES_PASSWORD=password" .env.local 2>/dev/null; then
        print_warning "Updating database password to match docker-compose.yml..."
        sed -i 's/POSTGRES_PASSWORD=password/POSTGRES_PASSWORD=admin123/g' .env.local
        sed -i 's/postgres:password@/postgres:admin123@/g' .env.local
    fi
fi

# [4/7] Setup images
print_status "[4/7] Setting up placeholder images..."
npm run setup:images >/dev/null 2>&1 || print_warning "Image setup had issues, continuing..."

# [5/7] Start Docker containers
print_status "[5/7] Starting Docker containers..."
print_status "This may take a few minutes on first run (downloading images, building containers)..."

# Build and start containers
print_status "Building and starting containers (this may take a few minutes)..."
if [ "$NEED_SUDO" = true ] && [ "$EUID" -ne 0 ]; then
    print_status "Note: You may be prompted for sudo password"
fi

# Verify Docker is still running before attempting to start containers
if [ "$EUID" -eq 0 ]; then
    # Running as root - use systemctl directly
    if ! systemctl is-active --quiet docker 2>/dev/null; then
        print_error "Docker service stopped! Please restart it: systemctl start docker"
        exit 1
    fi
else
    # Not root - try without sudo first, then with sudo
    if ! systemctl is-active --quiet docker 2>/dev/null && ! sudo systemctl is-active --quiet docker 2>/dev/null; then
        print_error "Docker service stopped! Please restart it: sudo systemctl start docker"
        exit 1
    fi
fi

# Try to start containers - show output for debugging
print_status "Starting containers..."
print_status "Using: $COMPOSE_CMD"

# Build and start containers
# Only enable BuildKit if buildx is available, otherwise use legacy builder
if docker buildx version >/dev/null 2>&1; then
    export DOCKER_BUILDKIT=1
    print_status "Using BuildKit (buildx available)"
else
    unset DOCKER_BUILDKIT
    print_status "Using legacy Docker builder (buildx not available)"
fi

# Build without --no-cache to use cache and avoid building unnecessary stages
# The development target doesn't need the builder stage, so Docker will skip it
if $COMPOSE_CMD build app 2>&1; then
    # Check for stuck container with permission issues
    CONTAINER_ID=$(docker ps -a --filter "name=personal-website-gen_app_1" --format "{{.ID}}" 2>/dev/null | head -1)
    if [ -n "$CONTAINER_ID" ]; then
        # Find the containerd-shim process for this container
        SHIM_PID=$(ps aux | grep "containerd-shim.*$CONTAINER_ID" | grep -v grep | awk '{print $2}' | head -1)
        if [ -n "$SHIM_PID" ]; then
            # Check if we can kill it (if owned by root, we can't)
            if kill -0 "$SHIM_PID" 2>/dev/null; then
                # Process exists, try to kill it
                kill -9 "$SHIM_PID" 2>/dev/null || {
                    print_error "Cannot remove stuck container due to permission issues!"
                    print_error "The container process (PID: $SHIM_PID) is owned by root."
                    print_error ""
                    print_error "Docker appears to be in a corrupted state. Please run:"
                    echo "  sudo ./force-cleanup-containers.sh"
                    echo ""
                    print_error "OR restart Docker service (will kill all containers):"
                    echo "  sudo systemctl restart docker"
                    echo ""
                    print_error "Then run this script again: ./startup-all.sh"
                    exit 1
                }
                sleep 2
            fi
        fi
        # Try to remove the container
        docker rm -f "$CONTAINER_ID" 2>&1 || true
    fi
    # Use docker-compose down to clean up
    $COMPOSE_CMD down --remove-orphans 2>&1 || true
    sleep 2
    # Now start containers fresh
    print_status "Starting containers..."
    if $COMPOSE_CMD up -d 2>&1; then
        print_success "Containers started successfully"
    else
        print_error "Failed to start containers after build"
        exit 1
    fi
else
    print_error "Failed to start Docker containers!"
    print_error "Check the error messages above for details."
    
    # Check if Docker service is still running
    if [ "$EUID" -eq 0 ]; then
        # Running as root
        if ! systemctl is-active --quiet docker 2>/dev/null; then
            print_error "Docker service has stopped! This may indicate a crash."
            print_error "Please restart Docker: systemctl restart docker"
            print_error "Then check Docker logs: journalctl -u docker -n 50"
        else
            print_status "Docker service is still running"
            print_status "Trying to view container logs..."
            $COMPOSE_CMD logs --tail=50 2>&1 || true
        fi
    else
        # Not root
        if ! systemctl is-active --quiet docker 2>/dev/null && ! sudo systemctl is-active --quiet docker 2>/dev/null; then
            print_error "Docker service has stopped! This may indicate a crash."
            print_error "Please restart Docker: sudo systemctl restart docker"
            print_error "Then check Docker logs: sudo journalctl -u docker -n 50"
        else
            print_status "Docker service is still running"
            print_status "Trying to view container logs..."
            $COMPOSE_CMD logs --tail=50 2>&1 || true
        fi
    fi
    exit 1
fi

print_success "Docker containers started"

# [6/7] Wait for services and restore database
print_status "[6/7] Waiting for services to be ready..."

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL database to be ready..."
MAX_WAIT=60
WAIT_COUNT=0
DB_READY=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if $COMPOSE_CMD exec -T db pg_isready -U postgres >/dev/null 2>&1; then
        print_success "PostgreSQL is ready"
        DB_READY=true
        break
    fi
    WAIT_COUNT=$((WAIT_COUNT + 1))
    sleep 1
    echo -n "."
done
echo ""

if [ "$DB_READY" = false ]; then
    print_error "PostgreSQL failed to start within $MAX_WAIT seconds"
    print_status "Checking database container logs..."
    $COMPOSE_CMD logs db 2>&1 | tail -20 || true
    print_warning "Continuing anyway - database may still be initializing..."
fi

# Wait a bit more for database to fully initialize
sleep 5

# Check for database backup and restore it
print_status "Checking for database backup to restore..."

# Function to restore SQL file
restore_sql_file() {
    local sql_file=$1
    local backup_name=$2
    
    print_status "Found backup: $backup_name"
    print_status "Restoring database backup..."
    
    # Check if database exists, create if not
    if ! ($COMPOSE_CMD exec -T db psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'personal_website'" 2>/dev/null | grep -q 1); then
        print_status "Creating database..."
        $COMPOSE_CMD exec -T db psql -U postgres -c "CREATE DATABASE personal_website;" >/dev/null 2>&1 || true
    fi
    
    # Drop all existing tables to ensure clean restore
    print_status "Clearing existing database for clean restore..."
    $COMPOSE_CMD exec -T db psql -U postgres -d personal_website -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >/dev/null 2>&1 || true
    
    # Restore the backup (handle encoding issues - UTF-16 to UTF-8 conversion)
    print_status "Restoring backup (this may take a moment)..."
    # Convert UTF-16 to UTF-8 if needed, and clean BOM/invalid sequences
    CLEAN_SQL=$(mktemp)
    
    # Try UTF-16 conversion first (common for Windows backups)
    if iconv -f UTF-16LE -t UTF-8 "$sql_file" > "$CLEAN_SQL" 2>/dev/null; then
        print_status "Converted UTF-16LE backup to UTF-8"
    elif iconv -f UTF-16 -t UTF-8 "$sql_file" > "$CLEAN_SQL" 2>/dev/null; then
        print_status "Converted UTF-16 backup to UTF-8"
    else
        # Try to detect encoding with file command if available
        if command -v file >/dev/null 2>&1 && file "$sql_file" | grep -q "UTF-16"; then
            print_status "Detected UTF-16 encoding, converting..."
            iconv -f UTF-16LE -t UTF-8 "$sql_file" > "$CLEAN_SQL" 2>/dev/null || iconv -f UTF-16 -t UTF-8 "$sql_file" > "$CLEAN_SQL" 2>/dev/null || cp "$sql_file" "$CLEAN_SQL"
        else
            # Remove BOM and invalid UTF-8 sequences for UTF-8 files
            sed '1s/^\xEF\xBB\xBF//' "$sql_file" | sed 's/\xFF//g' | iconv -f UTF-8 -t UTF-8 -c > "$CLEAN_SQL" 2>/dev/null || sed '1s/^\xEF\xBB\xBF//' "$sql_file" | sed 's/\xFF//g' > "$CLEAN_SQL" 2>/dev/null || cp "$sql_file" "$CLEAN_SQL"
        fi
    fi
    
    if cat "$CLEAN_SQL" | $COMPOSE_CMD exec -T db psql -U postgres -d personal_website >/dev/null 2>&1; then
        rm -f "$CLEAN_SQL"
        print_success "Database backup restored successfully"
        
        # Verify data was restored
        TABLE_COUNT=$($COMPOSE_CMD exec -T db psql -U postgres -d personal_website -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")
        POSTS_COUNT=$($COMPOSE_CMD exec -T db psql -U postgres -d personal_website -tc "SELECT COUNT(*) FROM posts;" 2>/dev/null | xargs || echo "0")
        PROJECTS_COUNT=$($COMPOSE_CMD exec -T db psql -U postgres -d personal_website -tc "SELECT COUNT(*) FROM projects;" 2>/dev/null | xargs || echo "0")
        
        print_success "Database restored: $TABLE_COUNT tables, $POSTS_COUNT posts, $PROJECTS_COUNT projects"
        rm -f "$CLEAN_SQL"
        return 0
    else
        print_warning "Database backup restoration had issues"
        rm -f "$CLEAN_SQL"
        return 1
    fi
}

# Search for backup files in multiple locations
LATEST_BACKUP=""
BACKUP_FILE=""
TEMP_SQL=""

# Check /home/dev-admin for backup files
if [ -d "/home/dev-admin" ]; then
    # Look for .zip files first
    ZIP_BACKUP=$(ls -t /home/dev-admin/database_backup_complete_*.zip 2>/dev/null | head -1)
    if [ -n "$ZIP_BACKUP" ] && [ -f "$ZIP_BACKUP" ]; then
        print_status "Found ZIP backup: $(basename "$ZIP_BACKUP")"
        print_status "Extracting backup..."
        TEMP_DIR=$(mktemp -d)
        if unzip -q "$ZIP_BACKUP" -d "$TEMP_DIR" 2>/dev/null; then
            # Find SQL file in extracted directory
            SQL_FILE=$(find "$TEMP_DIR" -name "*.sql" -type f | head -1)
            if [ -n "$SQL_FILE" ] && [ -f "$SQL_FILE" ]; then
                BACKUP_FILE="$SQL_FILE"
                LATEST_BACKUP="$ZIP_BACKUP"
            fi
        fi
    fi
    
    # Also check for .sql.gz files
    if [ -z "$BACKUP_FILE" ]; then
        GZ_BACKUP=$(ls -t /home/dev-admin/*.sql.gz 2>/dev/null | head -1)
        if [ -n "$GZ_BACKUP" ] && [ -f "$GZ_BACKUP" ]; then
            print_status "Found GZ backup: $(basename "$GZ_BACKUP")"
            TEMP_SQL=$(mktemp)
            if gunzip -c "$GZ_BACKUP" > "$TEMP_SQL" 2>/dev/null; then
                BACKUP_FILE="$TEMP_SQL"
                LATEST_BACKUP="$GZ_BACKUP"
            fi
        fi
    fi
    
    # Also check for .sql files directly
    if [ -z "$BACKUP_FILE" ]; then
        SQL_BACKUP=$(ls -t /home/dev-admin/*.sql 2>/dev/null | head -1)
        if [ -n "$SQL_BACKUP" ] && [ -f "$SQL_BACKUP" ]; then
            BACKUP_FILE="$SQL_BACKUP"
            LATEST_BACKUP="$SQL_BACKUP"
        fi
    fi
fi

# Check local backups directory
if [ -z "$BACKUP_FILE" ] && [ -d "./backups/database" ]; then
    # Find the most recent backup file
    LATEST_BACKUP=$(find "./backups/database" -name "*.sql.gz" -type f 2>/dev/null | xargs ls -t 2>/dev/null | head -1)
    
    # Alternative method if xargs fails
    if [ -z "$LATEST_BACKUP" ]; then
        LATEST_BACKUP=$(ls -t "./backups/database"/*.sql.gz 2>/dev/null | head -1)
    fi
    
    if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP" ]; then
        TEMP_SQL=$(mktemp)
        if gunzip -c "$LATEST_BACKUP" > "$TEMP_SQL" 2>/dev/null; then
            BACKUP_FILE="$TEMP_SQL"
        fi
    fi
fi

# Restore backup if found
if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
    if restore_sql_file "$BACKUP_FILE" "$(basename "${LATEST_BACKUP:-backup}")"; then
        # Cleanup temp files
        [ -n "$TEMP_DIR" ] && rm -rf "$TEMP_DIR" 2>/dev/null
        [ -n "$TEMP_SQL" ] && rm -f "$TEMP_SQL" 2>/dev/null
    else
        print_warning "Backup restoration failed, initializing from schema..."
        # Cleanup temp files
        [ -n "$TEMP_DIR" ] && rm -rf "$TEMP_DIR" 2>/dev/null
        [ -n "$TEMP_SQL" ] && rm -f "$TEMP_SQL" 2>/dev/null
        # Fall through to schema initialization
    fi
else
    print_status "No database backup found, initializing from schema..."
fi

# If no backup was restored, ensure database is initialized from init.sql
TABLE_COUNT=$($COMPOSE_CMD exec -T db psql -U postgres -d personal_website -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")

if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
    print_status "Database appears empty, initializing from init.sql..."
    if [ -f "./config/init.sql" ]; then
        print_status "Running init.sql to initialize database schema..."
        if cat "./config/init.sql" | $COMPOSE_CMD exec -T db psql -U postgres -d personal_website >/dev/null 2>&1; then
            print_success "Database schema initialized from init.sql"
        else
            print_warning "Could not run init.sql automatically"
            print_warning "Database may need manual initialization"
        fi
    elif [ -f "./init.sql" ]; then
        print_status "Running init.sql to initialize database schema..."
        if cat "./init.sql" | $COMPOSE_CMD exec -T db psql -U postgres -d personal_website >/dev/null 2>&1; then
            print_success "Database schema initialized from init.sql"
        else
            print_warning "Could not run init.sql automatically"
        fi
    else
        print_warning "init.sql not found - database may not be properly initialized"
    fi
else
    print_success "Database already initialized ($TABLE_COUNT tables found)"
fi

# Check for content/media backup and restore it
print_status "Checking for content/media backup to restore..."
CONTENT_BACKUP=""
CONTENT_BACKUP_FOUND=false

# Check /home/dev-admin for content backups
if [ -d "/home/dev-admin" ]; then
    # Look for content backup files
    CONTENT_BACKUP=$(ls -t /home/dev-admin/content_backup_*.tar.gz 2>/dev/null | head -1)
    if [ -z "$CONTENT_BACKUP" ]; then
        CONTENT_BACKUP=$(ls -t /home/dev-admin/*content*.tar.gz 2>/dev/null | head -1)
    fi
    if [ -z "$CONTENT_BACKUP" ]; then
        CONTENT_BACKUP=$(ls -t /home/dev-admin/*media*.tar.gz 2>/dev/null | head -1)
    fi
    if [ -z "$CONTENT_BACKUP" ]; then
        CONTENT_BACKUP=$(ls -t /home/dev-admin/*uploads*.tar.gz 2>/dev/null | head -1)
    fi
fi

# Check local backups directory
if [ -z "$CONTENT_BACKUP" ] && [ -d "./backups/content" ]; then
    CONTENT_BACKUP=$(ls -t ./backups/content/content_backup_*.tar.gz 2>/dev/null | head -1)
fi

# Restore content backup if found
if [ -n "$CONTENT_BACKUP" ] && [ -f "$CONTENT_BACKUP" ]; then
    print_status "Found content backup: $(basename "$CONTENT_BACKUP")"
    print_status "Restoring media files and uploads..."
    
    # Ensure public directory exists
    mkdir -p public/uploads public/images
    
    # Extract content backup
    if tar -xzf "$CONTENT_BACKUP" -C . 2>/dev/null; then
        print_success "Content backup restored successfully"
        
        # Verify media files were restored
        UPLOAD_COUNT=$(find public/uploads -type f 2>/dev/null | wc -l || echo "0")
        IMAGE_COUNT=$(find public/images -type f 2>/dev/null | wc -l || echo "0")
        print_success "Media files restored: $UPLOAD_COUNT uploads, $IMAGE_COUNT images"
        CONTENT_BACKUP_FOUND=true
    else
        print_warning "Content backup restoration had issues"
    fi
else
    print_status "No content backup found"
    print_warning "Media files (images/uploads) are not restored"
    print_warning "If you have a content backup, place it in /home/dev-admin/ or ./backups/content/"
    
    # Create upload directories structure even without backup
    print_status "Creating upload directories structure..."
    mkdir -p public/uploads/{general,project,blog,profile,slideshow}
    mkdir -p public/images/{projects,profiles,slideshow}
    print_success "Upload directories created"
fi

# Wait for application to start
print_status "Waiting for application to start..."
sleep 10

# [7/7] Verify services
print_status "[7/7] Verifying services..."

# Check container status
echo ""
print_status "Container Status:"
$COMPOSE_CMD ps 2>&1 || print_warning "Could not get container status"

echo ""
echo "========================================"
echo "SERVICES STATUS"
echo "========================================"
echo ""

# Function to check if port is listening
check_port() {
    local port=$1
    local service=$2
    
    if command -v ss >/dev/null 2>&1; then
        if ss -tuln 2>/dev/null | grep -q ":$port "; then
            print_success "$service is running on port $port"
            return 0
        fi
    elif command -v netstat >/dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_success "$service is running on port $port"
            return 0
        fi
    fi
    
    print_warning "$service may still be starting on port $port"
    return 1
}

# Check if ports are listening
check_port 3006 "Application"
check_port 5436 "PostgreSQL"
check_port 6386 "Redis"
check_port 8086 "Database admin panel"

echo ""
echo "========================================"
echo "DEVELOPMENT ENVIRONMENT IS READY!"
echo "========================================"
echo ""
echo "🌐 Website: http://localhost:3006"
echo "📊 Admin Panel: http://localhost:3006/admin"
echo "🗄️  Database Admin: http://localhost:8086"
echo ""
echo "📝 Default Admin Login:"
echo "   Email: admin@example.com"
echo "   Password: admin12345"
echo ""
echo "🗄️  Database Access (Adminer):"
echo "   System: PostgreSQL"
echo "   Server: db"
echo "   Username: postgres"
echo "   Password: admin123"
echo "   Database: personal_website"
echo ""
echo "🐳 Docker Commands:"
echo "   View logs: $COMPOSE_CMD logs -f"
echo "   View app logs: $COMPOSE_CMD logs -f app"
echo "   View db logs: $COMPOSE_CMD logs -f db"
echo "   Stop services: $COMPOSE_CMD down"
echo "   Restart: $COMPOSE_CMD restart"
echo ""

# Check if application is responding
print_status "Testing application..."
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3006 | grep -q "200\|301\|302"; then
    print_success "Application is responding"
else
    print_warning "Application may still be starting, check logs: $COMPOSE_CMD logs app"
fi

# Open browser
echo ""
print_status "Opening browser..."
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3006 >/dev/null 2>&1 &
elif command -v open > /dev/null; then
    open http://localhost:3006 >/dev/null 2>&1 &
fi

echo ""
echo "========================================"
echo "DEVELOPMENT TIPS"
echo "========================================"
echo ""
echo "1. The application uses PostgreSQL (no mock data)"
echo "2. All changes are hot-reloaded automatically"
echo "3. Database data persists between container restarts"
echo "4. Use Docker to manage containers"
echo "5. Check container logs if you encounter issues"
echo ""
echo "To stop all services: $COMPOSE_CMD down"
echo ""

read -p "Press Enter to continue..." 
