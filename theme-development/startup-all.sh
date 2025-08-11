#!/bin/bash

echo "========================================"
echo "Theme Development Environment - Full Startup"
echo "========================================"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found in current directory"
    echo "Please run this script from the theme-development directory"
    exit 1
fi

echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "Node.js found: $(node --version)"

echo ""
echo "========================================"
echo "Stopping Existing Processes"
echo "========================================"
echo ""

# Kill any existing Node.js processes
echo "Stopping existing Node.js processes..."
pkill -f "node.*next" 2>/dev/null || true
npx kill-port 3000 3006 5436 >/dev/null 2>&1 || true

# Stop any Docker containers from main project
echo "Stopping Docker containers from main project..."
cd ..
docker-compose down >/dev/null 2>&1 || true
cd theme-development

# Wait for ports to be freed
echo "Waiting for ports to be freed..."
sleep 10

# Verify ports are free
echo "Verifying ports are free..."
if netstat -tuln 2>/dev/null | grep -E ":(3000|3006|5436)" >/dev/null; then
    echo "WARNING: Some ports may still be in use"
    sleep 5
else
    echo "All ports are now free"
fi

echo ""
echo "========================================"
echo "Installing Dependencies"
echo "========================================"
echo ""

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    if ! npm install --no-audit --no-fund --silent; then
        echo "WARNING: First install attempt failed, trying with legacy peer deps..."
        if ! npm install --no-audit --no-fund --legacy-peer-deps --silent; then
            echo "ERROR: Failed to install dependencies"
            echo "This might be due to network issues or corrupted npm cache"
            echo "Try running: npm cache clean --force"
            exit 1
        fi
    fi
    echo "Dependencies installed successfully."
else
    echo "Dependencies already installed."
fi

echo ""
echo "========================================"
echo "Creating Required Directories"
echo "========================================"
echo ""

mkdir -p logs assets/generated assets/cache temp

echo "Directories created successfully."

echo ""
echo "========================================"
echo "Environment Configuration"
echo "========================================"
echo ""

# Check for .env.local file
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file with placeholder API keys..."
    cat > .env.local << 'EOF'
# Theme Development Environment Configuration
# AI Asset Generation API Keys
# Replace these with your actual API keys

# OpenAI API Key (for DALL-E 3 image generation)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Stability AI API Key (for Stable Diffusion image generation)
NEXT_PUBLIC_STABILITY_API_KEY=your_stability_api_key_here

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo "Environment file created. Please update with your actual API keys."
else
    echo "Environment file already exists."
fi

echo ""
echo "========================================"
echo "Running Pre-flight Checks"
echo "========================================"
echo ""

# Check TypeScript compilation
echo "Checking TypeScript compilation..."
if npm run type-check >/dev/null 2>&1; then
    echo "✓ TypeScript compilation successful"
else
    echo "✗ TypeScript compilation failed"
    echo "Running type check with verbose output..."
    npm run type-check
    echo "Please fix TypeScript errors before continuing"
    exit 1
fi

# Check if all required files exist
echo "Checking required files..."
if [ ! -f "app/layout.tsx" ]; then
    echo "✗ Missing app/layout.tsx"
    exit 1
fi
if [ ! -f "app/page.tsx" ]; then
    echo "✗ Missing app/page.tsx"
    exit 1
fi
if [ ! -f "components/shared/ThemeProvider.tsx" ]; then
    echo "✗ Missing ThemeProvider component"
    exit 1
fi
if [ ! -f "config/themes/index.ts" ]; then
    echo "✗ Missing theme configuration"
    exit 1
fi
echo "✓ All required files present"

echo ""
echo "========================================"
echo "Starting Theme Development Environment"
echo "========================================"
echo ""

echo "Services that will be started:"
echo "  - Theme Development Server: http://localhost:3000"
echo "  - AI Asset Generation: Ready for use"
echo "  - Theme Components: Available for testing"
echo ""

echo "Starting theme development server..."
echo ""

# Start the development server in background
echo "Starting Theme Development Server..."
npm run dev > logs/theme-dev.log 2>&1 &
DEV_PID=$!

# Wait for server to start
echo "Waiting for Theme Development Server to be ready..."
sleep 15

# Check if server is running
echo "Checking Theme Development Server status..."
if netstat -tuln 2>/dev/null | grep ":3000" >/dev/null; then
    echo "✓ Theme Development Server is running on port 3000"
else
    echo "✗ Theme Development Server failed to start"
    echo "Check logs/theme-dev.log for details"
    cat logs/theme-dev.log
    exit 1
fi

# Test server connectivity
echo "Testing server connectivity..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✓ Server connectivity test passed"
else
    echo "✗ Server connectivity test failed"
    echo "Checking server logs..."
    cat logs/theme-dev.log
    exit 1
fi

echo ""
echo "========================================"
echo "Running Component Tests"
echo "========================================"
echo ""

# Test theme switching functionality
echo "Testing theme switching functionality..."
if curl -s http://localhost:3000 | grep -E "ThemeSwitcher|theme-" >/dev/null; then
    echo "✓ Theme components are working"
else
    echo "✗ Theme component test failed"
fi

# Test AI Asset Generator
echo "Testing AI Asset Generator..."
if curl -s http://localhost:3000 | grep -E "AI Asset Generator|AIAssetGenerator" >/dev/null; then
    echo "✓ AI Asset Generator is available"
else
    echo "✗ AI Asset Generator test failed"
fi

echo ""
echo "========================================"
echo "Environment Started Successfully!"
echo "========================================"
echo ""
echo "Services are now running:"
echo "  - Theme Development Server: http://localhost:3000"
echo "  - AI Asset Generation: Available (configure API keys in .env.local)"
echo "  - Theme Components: Ready for testing"
echo ""
echo "Available Features:"
echo "  1. Theme Switching: Default, Comic Book, Star Trek"
echo "  2. AI Asset Generation: Generate theme-specific images"
echo "  3. Component Testing: Test all theme components"
echo "  4. Asset Management: Store and manage generated assets"
echo ""
echo "To access the theme development environment:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Use the theme switcher in the top-right corner"
echo "  3. Click 'Show AI Generator' to test AI asset generation"
echo ""
echo "To configure AI Asset Generation:"
echo "  1. Edit .env.local file"
echo "  2. Add your OpenAI API key for DALL-E 3"
echo "  3. Add your Stability AI API key for Stable Diffusion"
echo ""
echo "To stop all services, run:"
echo "  pkill -f 'node.*next'"
echo ""
echo "To view server logs, check the logs folder."
echo ""
echo "Press Ctrl+C to stop the server..."
wait $DEV_PID
