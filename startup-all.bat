@echo off
setlocal enabledelayedexpansion

REM Personal Website Startup Script (Windows)
REM This script handles all initialization and startup tasks

echo =====================================================
echo   Personal Website Startup Script (Windows)
echo =====================================================

REM Check prerequisites
echo Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js v18 or higher from https://nodejs.org/
    pause
    exit /b 1
)
echo [SUCCESS] Node.js is available

REM Check npm
call npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)
echo [SUCCESS] Prerequisites check passed

REM Read port from environment file
set FRONTEND_PORT=3006
if exist .env.local (
    for /f "tokens=2 delims==" %%a in ('findstr "FRONTEND_PORT" .env.local') do set FRONTEND_PORT=%%a
)

REM Check if port is free
echo.
echo Checking if port %FRONTEND_PORT% is free...
netstat -an | findstr ":%FRONTEND_PORT%" >nul
if not errorlevel 1 (
    echo [ERROR] Port %FRONTEND_PORT% is already in use
    echo Please stop any services using this port or change FRONTEND_PORT in .env.local
    echo.
    echo Current processes using port %FRONTEND_PORT%:
    netstat -ano | findstr ":%FRONTEND_PORT%"
    pause
    exit /b 1
)
echo [SUCCESS] Port %FRONTEND_PORT% is available

REM Setup environment
echo.
echo Setting up environment...
if not exist .env.local (
    echo Creating .env.local file from template...
    copy env.example .env.local >nul
    echo [SUCCESS] .env.local created from template
) else (
    echo [SUCCESS] .env.local already exists
)

REM Install dependencies
echo.
echo Installing dependencies...
if exist package-lock.json (
    call npm ci --loglevel=error
) else (
    call npm install --loglevel=error
)

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully

REM Clear cache
echo.
echo Clearing Next.js cache...
if exist .next rmdir /s /q .next >nul 2>&1
echo [SUCCESS] Cache cleared

REM Setup placeholder images
echo.
echo Setting up placeholder images...
if exist scripts\setup\ensure-placeholder-images.js (
    node scripts\setup\ensure-placeholder-images.js >nul 2>&1
    echo [SUCCESS] Placeholder images setup complete
) else (
    echo [WARNING] Placeholder image script not found, skipping...
)

REM Download real images if available
echo.
echo Downloading real images if configured...
if exist scripts\setup\download-real-images.js (
    node scripts\setup\download-real-images.js >nul 2>&1
    echo [SUCCESS] Real image setup completed
) else (
    echo [INFO] Real image download script not found, using placeholders
)

REM Test database connection
echo.
echo Testing database connection...
if exist testing\test-db-connection.js (
    node testing\test-db-connection.js >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] Database connection failed - will use mock data mode
    ) else (
        echo [SUCCESS] Database connection successful
    )
) else (
    echo [INFO] Database test script not found, will use mock data mode
)

REM Create admin user if script exists
echo.
echo Setting up admin user...
if exist scripts\setup\init-admin.js (
    node scripts\setup\init-admin.js >nul 2>&1
    echo [SUCCESS] Admin user setup complete
) else (
    echo [INFO] Admin setup script not found, skipping...
)

REM Initialize default pages
echo.
echo Setting up default pages...
if exist scripts\setup\init-pages.js (
    node scripts\setup\init-pages.js >nul 2>&1
    echo [SUCCESS] Default pages setup complete
) else (
    echo [INFO] Page setup script not found, skipping...
)

echo.
echo =====================================================
echo   Starting Development Server
echo =====================================================
echo   Frontend:     http://localhost:%FRONTEND_PORT%
echo   Admin Panel:  http://localhost:%FRONTEND_PORT%/admin
echo   
echo   Default Login: admin@example.com / admin12345
echo   
echo   Press Ctrl+C to stop the server
echo =====================================================
echo.

REM Start the development server with Windows-specific script
call npm run dev:mock:windows 