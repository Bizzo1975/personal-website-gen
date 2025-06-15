#!/bin/bash

echo "========================================"
echo "Personal Website Development Environment"
echo "========================================"
echo

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$1/6]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Stop any existing processes
print_status "1" "Stopping existing processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
sleep 2

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
print_status "2" "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_success "Dependencies already installed."
fi

# Check for environment file
print_status "3" "Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    if [ -f "env.example" ]; then
        echo "Creating .env.local from env.example..."
        cp env.example .env.local
    else
        print_warning "No .env.local file found. You may need to create one."
    fi
else
    print_success "Environment file found."
fi

# Setup placeholder images
print_status "4" "Setting up placeholder images..."
npm run setup:images
if [ $? -ne 0 ]; then
    print_warning "Failed to setup images, continuing anyway..."
fi

# Run a quick build test to ensure everything compiles
print_status "5" "Running build test..."
echo "Testing build compilation..."
npm run build
if [ $? -ne 0 ]; then
    echo
    echo "========================================"
    print_error "BUILD FAILED!"
    echo "========================================"
    echo "The project has compilation errors."
    echo "Please fix the errors before starting development."
    echo
    exit 1
else
    print_success "Build test passed successfully!"
fi

# Present startup options
print_status "6" "Starting development environment..."
echo
echo "========================================"
echo "Development Environment Options"
echo "========================================"
echo
echo "Choose your development mode:"
echo
echo "1. Standard Development (with database)"
echo "2. Mock Data Development (no database required)"
echo "3. Development + Testing Suite"
echo "4. Docker Development Environment"
echo "5. Exit"
echo

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo
        echo "Starting Standard Development Mode..."
        echo
        echo "The application will be available at:"
        echo "http://localhost:3006"
        echo
        echo "Admin panel: http://localhost:3006/admin"
        echo "Default admin: admin@example.com / admin12345"
        echo
        echo "Press Ctrl+C to stop the server"
        echo
        npm run dev
        ;;
    2)
        echo
        echo "Starting Mock Data Development Mode..."
        echo
        echo "The application will be available at:"
        echo "http://localhost:3006"
        echo
        echo "Admin panel: http://localhost:3006/admin"
        echo "Default admin: admin@example.com / admin12345"
        echo
        echo "Note: Using mock data (no database required)"
        echo
        echo "Press Ctrl+C to stop the server"
        echo
        npm run dev:mock
        ;;
    3)
        echo
        echo "Starting Development + Testing Environment..."
        echo
        echo "This will start:"
        echo "- Development server on http://localhost:3006"
        echo "- Jest tests in watch mode"
        echo "- Cypress E2E testing ready"
        echo
        echo "Opening multiple terminal sessions..."
        echo

        # Start development server in background
        echo "Starting development server..."
        npm run dev:mock &
        DEV_PID=$!

        # Wait a moment for server to start
        sleep 5

        # Start Jest in watch mode in a new terminal
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "npm run test:watch; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -e "npm run test:watch" &
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && npm run test:watch"'
        else
            echo "Starting Jest tests in background..."
            npm run test:watch &
            TEST_PID=$!
        fi

        # Ask about Cypress
        echo
        read -p "Do you want to open Cypress E2E tests? (y/n): " cypress_choice
        if [[ $cypress_choice =~ ^[Yy]$ ]]; then
            if command -v gnome-terminal &> /dev/null; then
                gnome-terminal -- bash -c "npm run cypress; exec bash"
            elif command -v xterm &> /dev/null; then
                xterm -e "npm run cypress" &
            elif [[ "$OSTYPE" == "darwin"* ]]; then
                osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && npm run cypress"'
            else
                npm run cypress &
                CYPRESS_PID=$!
            fi
        fi

        echo
        echo "========================================"
        echo "Development + Testing Environment Started"
        echo "========================================"
        echo
        echo "Services running:"
        echo "- Dev Server: http://localhost:3006 (PID: $DEV_PID)"
        echo "- Jest Tests: Running in watch mode"
        if [[ $cypress_choice =~ ^[Yy]$ ]]; then
            echo "- Cypress E2E: Available for testing"
        fi
        echo
        echo "Press Ctrl+C to stop all services."
        echo

        # Wait for the development server
        wait $DEV_PID
        ;;
    4)
        echo
        echo "Starting Docker Development Environment..."
        echo
        echo "This will build and start the application in Docker containers."
        echo "The application will be available at:"
        echo "http://localhost:3006"
        echo
        echo "Press Ctrl+C to stop the containers"
        echo
        npm run dev:docker
        ;;
    5)
        echo
        echo "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice. Please select 1-5."
        exit 1
        ;;
esac

echo
echo "Development environment stopped." 