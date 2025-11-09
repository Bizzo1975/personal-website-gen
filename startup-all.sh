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
else
    print_status "No existing containers to stop"
fi

# Clean cache
print_status "Cleaning build cache..."
rm -rf .next >/dev/null 2>&1 || true

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

if $COMPOSE_CMD up -d --build 2>&1; then
    print_success "Containers started successfully"
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
BACKUP_DIR="./backups/database"
if [ -d "$BACKUP_DIR" ]; then
    # Find the most recent backup file (compatible with all find versions)
    LATEST_BACKUP=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f 2>/dev/null | xargs ls -t 2>/dev/null | head -1)
    
    # Alternative method if xargs fails
    if [ -z "$LATEST_BACKUP" ]; then
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1)
    fi
    
    if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP" ]; then
        print_status "Found backup: $(basename "$LATEST_BACKUP")"
        print_status "Restoring database backup..."
        
        # Check if database exists, create if not
        if ! ($COMPOSE_CMD exec -T db psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'personal_website'" 2>/dev/null | grep -q 1); then
            print_status "Creating database..."
            $COMPOSE_CMD exec -T db psql -U postgres -c "CREATE DATABASE personal_website;" >/dev/null 2>&1 || true
        fi
        
        # Restore the backup
        print_status "Restoring backup (this may take a moment)..."
        if gunzip -c "$LATEST_BACKUP" | $COMPOSE_CMD exec -T db psql -U postgres -d personal_website >/dev/null 2>&1; then
            print_success "Database backup restored successfully"
        else
            print_warning "Database backup restoration had issues, but continuing..."
            print_status "Database will use schema from init.sql"
        fi
    else
        print_status "No database backup found"
        # Ensure database is initialized from init.sql
        print_status "Ensuring database is initialized from schema..."
        
        # Check if database has tables (indicates it's been initialized)
        TABLE_COUNT=$($COMPOSE_CMD exec -T db psql -U postgres -d personal_website -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")
        
        if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
            print_status "Database appears empty, checking if init.sql needs to be run..."
            # init.sql should run automatically on first container start via docker-entrypoint-initdb.d
            # But if the volume already existed, we need to run it manually
            if [ -f "./init.sql" ]; then
                print_status "Running init.sql to initialize database schema..."
                if $COMPOSE_CMD exec -T db psql -U postgres -d personal_website -f /docker-entrypoint-initdb.d/01-init.sql >/dev/null 2>&1; then
                    print_success "Database schema initialized from init.sql"
                else
                    # Try running init.sql from host
                    print_status "Trying to run init.sql from host..."
                    if $COMPOSE_CMD exec -T db psql -U postgres -d personal_website < ./init.sql >/dev/null 2>&1; then
                        print_success "Database schema initialized from init.sql"
                    else
                        print_warning "Could not run init.sql automatically"
                        print_warning "Database may need manual initialization"
                    fi
                fi
            else
                print_warning "init.sql not found - database may not be properly initialized"
            fi
        else
            print_success "Database already initialized ($TABLE_COUNT tables found)"
        fi
    fi
else
    print_status "No backups directory found"
    # Ensure database is initialized from init.sql
    print_status "Ensuring database is initialized from schema..."
    
    # Check if database has tables
    TABLE_COUNT=$($COMPOSE_CMD exec -T db psql -U postgres -d personal_website -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")
    
    if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
        print_status "Database appears empty, initializing from init.sql..."
        if [ -f "./init.sql" ]; then
            if $COMPOSE_CMD exec -T db psql -U postgres -d personal_website < ./init.sql >/dev/null 2>&1; then
                print_success "Database schema initialized from init.sql"
            else
                print_warning "Could not run init.sql - database may need manual initialization"
            fi
        fi
    else
        print_success "Database already initialized ($TABLE_COUNT tables found)"
    fi
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
