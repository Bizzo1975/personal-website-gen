@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Theme Development Environment - Full Startup
echo ========================================
echo.

:: Set title for the command window
title Theme Development Environment - Dynamic Theme System

:: Check if we're in the correct directory
if not exist "package.json" (
    echo ERROR: package.json not found in current directory
                echo Please run this script from the theme-dev-isolated directory
    pause
    exit /b 1
)

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found: 
node --version

echo.
echo ========================================
echo Stopping Existing Processes
echo ========================================
echo.

:: Kill any existing Node.js processes
echo Stopping existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Stopped existing Node.js processes
) else (
    echo No existing Node.js processes found
)

:: Kill processes on our ports
echo Checking for processes on ports 3000, 3006, and 5436...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 2^>nul') do (
    echo Killing process on port 3000 (PID: %%a)
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3006 2^>nul') do (
    echo Killing process on port 3006 (PID: %%a)
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5436 2^>nul') do (
    echo Killing process on port 5436 (PID: %%a)
    taskkill /f /pid %%a >nul 2>&1
)

:: Stop any Docker containers from main project
echo Stopping Docker containers from main project...
cd ..
docker-compose down >nul 2>&1
            cd theme-dev-isolated

:: Wait for ports to be freed
echo Waiting for ports to be freed...
timeout /t 10 /nobreak >nul

:: Verify ports are free
echo Verifying ports are free...
netstat -ano | findstr ":3000\|:3006\|:5436" >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Some ports may still be in use
    timeout /t 5 /nobreak >nul
) else (
    echo All ports are now free
)

echo.
echo ========================================
echo Installing Dependencies
echo ========================================
echo.

:: Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --no-audit --no-fund --silent
    if %errorlevel% neq 0 (
        echo WARNING: First install attempt failed, trying with legacy peer deps...
        npm install --no-audit --no-fund --legacy-peer-deps --silent
        if %errorlevel% neq 0 (
            echo ERROR: Failed to install dependencies
            echo This might be due to network issues or corrupted npm cache
            echo Try running: npm cache clean --force
            pause
            exit /b 1
        )
    )
    echo Dependencies installed successfully.
) else (
    echo Dependencies already installed.
)

echo.
echo ========================================
echo Creating Required Directories
echo ========================================
echo.

if not exist "logs" mkdir logs
if not exist "assets\generated" mkdir assets\generated
if not exist "assets\cache" mkdir assets\cache
if not exist "temp" mkdir temp

echo Directories created successfully.

echo.
echo ========================================
echo Environment Configuration
echo ========================================
echo.

:: Check for .env.local file
if not exist ".env.local" (
    echo Creating .env.local file with placeholder API keys...
    echo # Theme Development Environment Configuration > .env.local
    echo # AI Asset Generation API Keys >> .env.local
    echo # Replace these with your actual API keys >> .env.local
    echo. >> .env.local
    echo # OpenAI API Key (for DALL-E 3 image generation) >> .env.local
    echo NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here >> .env.local
    echo. >> .env.local
    echo # Stability AI API Key (for Stable Diffusion image generation) >> .env.local
    echo NEXT_PUBLIC_STABILITY_API_KEY=your_stability_api_key_here >> .env.local
    echo. >> .env.local
    echo # Development Settings >> .env.local
    echo NODE_ENV=development >> .env.local
    echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> .env.local
    echo Environment file created. Please update with your actual API keys.
) else (
    echo Environment file already exists.
)

echo.
echo ========================================
echo Running Pre-flight Checks
echo ========================================
echo.

:: Check TypeScript compilation
echo Checking TypeScript compilation...
call npm run type-check
if %errorlevel% neq 0 (
    echo ✗ TypeScript compilation failed
    echo Please fix TypeScript errors before continuing
    pause
    exit /b 1
)
echo ✓ TypeScript compilation successful

:: Check if all required files exist
echo Checking required files...
if not exist "app\layout.tsx" (
    echo ✗ Missing app\layout.tsx
    pause
    exit /b 1
)
if not exist "app\page.tsx" (
    echo ✗ Missing app\page.tsx
    pause
    exit /b 1
)
if not exist "components\shared\ThemeProvider.tsx" (
    echo ✗ Missing ThemeProvider component
    pause
    exit /b 1
)
if not exist "config\themes\index.ts" (
    echo ✗ Missing theme configuration
    pause
    exit /b 1
)
echo ✓ All required files present

echo.
echo ========================================
echo Starting Theme Development Environment
echo ========================================
echo.

echo Services that will be started:
echo   - Theme Development Server: http://localhost:3000
echo   - AI Asset Generation: Ready for use
echo   - Theme Components: Available for testing
echo.

echo Starting theme development server...
echo.

:: Start the development server in background
echo Starting Theme Development Server...
start /b "Theme Dev Server" cmd /c "cd /d %CD% && npm run dev > logs\theme-dev.log 2>&1"

:: Wait for server to start
echo Waiting for Theme Development Server to be ready...
timeout /t 15 /nobreak >nul

:: Check if server is running
echo Checking Theme Development Server status...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Theme Development Server is running on port 3000
) else (
    echo ✗ Theme Development Server failed to start
    echo Check logs\theme-dev.log for details
    pause
    exit /b 1
)

:: Test server connectivity
echo Testing server connectivity...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 10; if ($response.StatusCode -eq 200) { Write-Host '✓ Server is responding'; exit 0 } else { Write-Host '✗ Server returned status: ' + $response.StatusCode; exit 1 } } catch { Write-Host '✗ Server test failed: ' + $_.Exception.Message; exit 1 }"
if %errorlevel% equ 0 (
    echo ✓ Server connectivity test passed
) else (
    echo ✗ Server connectivity test failed
    echo Checking server logs...
    type logs\theme-dev.log
    pause
    exit /b 1
)

echo.
echo ========================================
echo Running Component Tests
echo ========================================
echo.

:: Test theme switching functionality
echo Testing theme switching functionality...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing; if ($response.Content -match 'ThemeSwitcher' -or $response.Content -match 'theme-') { Write-Host '✓ Theme components detected'; exit 0 } else { Write-Host '✗ Theme components not found'; exit 1 } } catch { Write-Host '✗ Component test failed: ' + $_.Exception.Message; exit 1 }"
if %errorlevel% equ 0 (
    echo ✓ Theme components are working
) else (
    echo ✗ Theme component test failed
)

:: Test AI Asset Generator (if API keys are configured)
echo Testing AI Asset Generator...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing; if ($response.Content -match 'AI Asset Generator' -or $response.Content -match 'AIAssetGenerator') { Write-Host '✓ AI Asset Generator detected'; exit 0 } else { Write-Host '✗ AI Asset Generator not found'; exit 1 } } catch { Write-Host '✗ AI Generator test failed: ' + $_.Exception.Message; exit 1 }"
if %errorlevel% equ 0 (
    echo ✓ AI Asset Generator is available
) else (
    echo ✗ AI Asset Generator test failed
)

echo.
echo ========================================
echo Environment Started Successfully!
echo ========================================
echo.
echo Services are now running:
echo   - Theme Development Server: http://localhost:3000
echo   - AI Asset Generation: Available (configure API keys in .env.local)
echo   - Theme Components: Ready for testing
echo.
echo Available Features:
echo   1. Theme Switching: Default, Comic Book, Star Trek
echo   2. AI Asset Generation: Generate theme-specific images
echo   3. Component Testing: Test all theme components
echo   4. Asset Management: Store and manage generated assets
echo.
echo To access the theme development environment:
echo   1. Open http://localhost:3000 in your browser
echo   2. Use the theme switcher in the top-right corner
echo   3. Click "Show AI Generator" to test AI asset generation
echo.
echo To configure AI Asset Generation:
echo   1. Edit .env.local file
echo   2. Add your OpenAI API key for DALL-E 3
echo   3. Add your Stability AI API key for Stable Diffusion
echo.
echo To stop all services, run:
echo   taskkill /f /im node.exe
echo.
echo To view server logs, check the logs folder.
echo.
echo Press any key to exit this startup script (server will continue running)...
pause
