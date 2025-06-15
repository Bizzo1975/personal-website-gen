#!/bin/bash

echo "========================================"
echo "Personal Website Development Environment"
echo "========================================"
echo ""
echo "Starting FULL SEEDED Development Environment..."
echo "NO USER INTERACTION REQUIRED"
echo ""

# [1/7] Stop any existing processes and clean ports
echo "[1/7] Cleaning up existing processes and ports..."
pkill -f "node.*next" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

# Kill processes on common development ports
npx kill-port 3000 3001 3002 3003 3004 3005 3006 8000 8080 5000 5432 5433 5434 5435 >/dev/null 2>&1 || true

# Stop and remove any Docker containers
echo "Cleaning up Docker containers..."
if command -v docker &> /dev/null; then
    docker stop $(docker ps -aq) >/dev/null 2>&1 || true
    docker rm $(docker ps -aq) >/dev/null 2>&1 || true
fi

# Clean build cache
echo "Cleaning build cache..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

sleep 2

# [2/7] Check project directory
echo "[2/7] Verifying project structure..."
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found. Please run this script from the project root directory."
    read -p "Press any key to continue..."
    exit 1
fi

# [3/7] Install/Update dependencies
echo "[3/7] Installing/updating dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies for the first time..."
    npm install
else
    echo "Updating dependencies..."
    npm update
fi

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    read -p "Press any key to continue..."
    exit 1
fi

# [4/7] Setup environment
echo "[4/7] Setting up environment configuration..."
if [ ! -f ".env.local" ]; then
    if [ -f "env.example" ]; then
        echo "Creating .env.local from template..."
        cp env.example .env.local
    else
        echo "Creating basic .env.local..."
        cat > .env.local << EOF
NEXTAUTH_SECRET=dev-secret-key-12345
NEXTAUTH_URL=http://localhost:3006
MOCK_DATA=true
FRONTEND_PORT=3006
EOF
    fi
fi

# [5/7] Setup all assets and images
echo "[5/7] Setting up placeholder images and assets..."
npm run setup:all
if [ $? -ne 0 ]; then
    echo "Warning: Some assets failed to setup, continuing..."
    npm run setup:images
fi

# [6/7] Seed database with full data
echo "[6/7] Seeding development database with full data..."
npm run seed:complete
if [ $? -ne 0 ]; then
    echo "Warning: Database seeding had issues, but continuing with mock data..."
fi

# [7/7] Start development server
echo "[7/7] Starting FULLY SEEDED development server..."
echo ""
echo "========================================"
echo "DEVELOPMENT SERVER STARTING"
echo "========================================"
echo ""
echo "🚀 FULL SEEDED DEVELOPMENT ENVIRONMENT"
echo ""
echo "The application will be available at:"
echo "🌐 http://localhost:3006"
echo ""
echo "Admin panel:"
echo "🔐 http://localhost:3006/admin"
echo "👤 Default admin: admin@example.com / admin12345"
echo ""
echo "Features enabled:"
echo "✅ Mock data with full content"
echo "✅ Newsletter system with sample data"
echo "✅ Blog posts and projects"
echo "✅ Contact forms and user management"
echo "✅ All admin features functional"
echo ""
echo "========================================"
echo "🎯 READY FOR DEVELOPMENT & TESTING"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the fully seeded development environment
npm run dev:seeded

echo ""
echo "========================================"
echo "Development environment stopped."
echo "========================================"
echo ""
read -p "Press any key to continue..." 