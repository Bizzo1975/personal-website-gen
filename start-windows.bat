@echo off
setlocal enabledelayedexpansion

echo =====================================================
echo   Personal Website - Windows Setup Script
echo   Enhanced with Database Seeding
echo =====================================================

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if not "%errorlevel%"=="0" (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check npm
echo Checking npm...
call npm --version >nul 2>&1
if not "%errorlevel%"=="0" (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)
echo [OK] npm found

echo.
echo =====================================================
echo   Setting up environment...
echo =====================================================

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo Creating .env.local with Windows configuration...
    if exist env.example (
        copy env.example .env.local >nul 2>&1
        echo [OK] Environment file created from template
    ) else (
        echo [WARNING] env.example not found, creating basic .env.local
        echo FRONTEND_PORT=3007 > .env.local
        echo MOCK_DATA=true >> .env.local
        echo NODE_ENV=development >> .env.local
        echo [OK] Basic environment file created
    )
) else (
    echo [OK] Environment file already exists
)

echo.
echo =====================================================
echo   Installing dependencies...
echo =====================================================

echo Installing npm packages... (this may take a few minutes)
echo Please wait...

REM Check if package.json exists
if not exist package.json (
    echo [ERROR] package.json not found!
    pause
    exit /b 1
)

REM Run npm install
echo Running: npm install
call npm install --loglevel=error
if not "%errorlevel%"=="0" (
    echo [ERROR] Failed to install dependencies
    echo Please check your internet connection and try again
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully

echo.
echo =====================================================
echo   Setting up images and content...
echo =====================================================

REM Setup placeholder images
if exist scripts\setup\ensure-placeholder-images.js (
    echo Setting up placeholder images...
    node scripts\setup\ensure-placeholder-images.js >nul 2>&1
    echo [OK] Placeholder images setup
) else (
    echo [INFO] Placeholder image script not found, skipping
)

REM Download real images if available
if exist scripts\setup\download-real-images.js (
    echo Downloading real images (if configured)...
    node scripts\setup\download-real-images.js >nul 2>&1
    echo [INFO] Real image download completed
) else (
    echo [INFO] Real image download script not found, skipping
)

echo.
echo =====================================================
echo   Database initialization...
echo =====================================================

REM Initialize admin user
if exist scripts\setup\init-admin.js (
    echo Creating admin user...
    node scripts\setup\init-admin.js >nul 2>&1
    echo [OK] Admin user setup completed
) else (
    echo [INFO] Admin setup script not found, skipping
)

REM Initialize default pages
if exist scripts\setup\init-pages.js (
    echo Creating default pages...
    node scripts\setup\init-pages.js >nul 2>&1
    echo [OK] Default pages setup completed
) else (
    echo [INFO] Page setup script not found, skipping
)

echo.
echo =====================================================
echo   Clearing cache...
echo =====================================================

if exist .next (
    echo Removing .next directory...
    rmdir /s /q .next >nul 2>&1
)
echo [OK] Cache cleared

echo.
echo =====================================================
echo   Setup complete!
echo =====================================================
echo.
echo Available commands:
echo   npm run dev:windows          - Start development (Windows native)
echo   npm run dev:mock:windows     - Start with mock data (Windows)
echo   npm run dev:docker           - Start with Docker (Recommended)
echo   npm run dev                  - Start development (Cross-platform)
echo.
echo URLs:
echo   Frontend: http://localhost:3007
echo   Admin:    http://localhost:3007/admin
echo.
echo Login Credentials:
echo   Email:    admin@example.com
echo   Password: admin12345
echo.
echo Docker ports (if using Docker):
echo   Database: localhost:5437 (PostgreSQL)
echo   pgAdmin:  http://localhost:8080
echo.
echo Sample Content Available:
echo   - Blog posts and projects (if database connected)
echo   - Profile information and settings
echo   - Default pages (Home, About, Contact)
echo   - Mock data for development
echo.
echo For complete database seeding, use: startup-all.bat --force-seed
echo.

REM Ask user which development mode to use
echo Choose development mode:
echo [1] Windows Native (npm run dev:mock:windows)
echo [2] Docker (npm run dev:docker) - Recommended for full features
echo [3] Cross-platform (npm run dev:mock)
echo [4] Exit (setup only)
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Starting Windows native development server...
    echo Login: admin@example.com / admin12345
    echo Admin: http://localhost:3007/admin
    echo.
    call npm run dev:mock:windows
) else if "%choice%"=="2" (
    echo.
    echo Starting Docker development environment...
    echo This includes PostgreSQL database and pgAdmin
    echo Login: admin@example.com / admin12345
    echo Admin: http://localhost:3007/admin
    echo.
    call npm run dev:docker
) else if "%choice%"=="3" (
    echo.
    echo Starting cross-platform development server...
    echo Login: admin@example.com / admin12345
    echo Admin: http://localhost:3007/admin
    echo.
    call npm run dev:mock
) else (
    echo.
    echo Setup completed. You can start development manually using one of the commands above.
    echo.
    echo For a fully seeded database with sample content, run:
    echo   startup-all.bat --force-seed
    echo.
)

echo.
echo Press any key to exit...
pause >nul 