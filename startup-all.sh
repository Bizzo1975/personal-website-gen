#!/bin/bash

echo "========================================"
echo "Personal Website - Docker Development Environment"
echo "========================================"
echo ""
echo "Starting Docker Development Environment with PostgreSQL..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: Not in project directory!"
    echo "Please run this script from the project root directory."
    read -p "Press any key to exit..."
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    read -p "Press any key to exit..."
    exit 1
fi

# [1/6] Cleaning up processes
echo "[1/6] Cleaning up processes..."
pkill -f "node.*next" 2>/dev/null || true
npx kill-port 3006 >/dev/null 2>&1 || true

# [2/6] Stop existing containers
echo "[2/6] Stopping existing containers..."
docker-compose down >/dev/null 2>&1 || true

# [3/6] Clean cache
echo "[3/6] Cleaning cache..."
rm -rf .next >/dev/null 2>&1 || true

# [4/6] Setup environment
echo "[4/6] Setting up environment..."
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# Development Environment Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5436/personal_website
POSTGRES_DB=personal_website
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3006
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF
    echo "Environment file created."
else
    echo "Environment file already exists."
fi

# [5/6] Setup images
echo "[5/6] Setting up images..."
npm run setup:images >/dev/null 2>&1 || echo "Warning: Image setup failed, continuing..."

# [6/6] Start Docker containers
echo "[6/6] Starting Docker containers..."
echo "This may take a few minutes on first run..."
docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start Docker containers!"
    echo "Please check Docker status and try again."
    read -p "Press any key to exit..."
    exit 1
fi

echo ""
echo "========================================"
echo "DOCKER CONTAINERS STARTING"
echo "========================================"
echo ""
echo "Waiting for services to be ready..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL database..."
sleep 15

# Wait for application to be ready
echo "Waiting for application to start..."
sleep 20

# Check if services are running
docker-compose ps

echo ""
echo "========================================"
echo "SERVICES STATUS"
echo "========================================"
echo ""
echo "Checking service availability..."

# Check if port 3006 is listening
if netstat -tuln 2>/dev/null | grep :3006 >/dev/null; then
    echo "SUCCESS! Application is running on port 3006"
else
    echo "Application may still be starting..."
fi

# Check if port 5436 is listening
if netstat -tuln 2>/dev/null | grep :5436 >/dev/null; then
    echo "SUCCESS! PostgreSQL is running on port 5436"
else
    echo "PostgreSQL may still be starting..."
fi

# Check if port 8086 is listening (Adminer)
if netstat -tuln 2>/dev/null | grep :8086 >/dev/null; then
    echo "SUCCESS! Database admin panel is running on port 8086"
else
    echo "Database admin panel may still be starting..."
fi

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
echo "   Password: password"
echo "   Database: personal_website"
echo ""
echo "🐳 Docker Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart: docker-compose restart"
echo ""

# Open browser
echo "Opening browser..."
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
echo "Use 'docker-compose down' to stop all services."
echo ""

read -p "Press any key to continue..." 
