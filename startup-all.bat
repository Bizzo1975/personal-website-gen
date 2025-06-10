@echo off
setlocal enabledelayedexpansion

REM Personal Website Startup Script (Windows) - Enhanced with Full Seeding
REM This script handles all initialization and startup tasks for the personal website project

echo =====================================================
echo   Personal Website Startup Script (Windows)
echo   Enhanced with Full Database Seeding
echo =====================================================

REM Parse command line arguments
set SKIP_TESTS=false
set PROD_MODE=false
set SETUP_ONLY=false
set SEED_DATABASE=true
set FORCE_SEED=false

:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
if "%~1"=="--no-tests" set SKIP_TESTS=true
if "%~1"=="--prod" set PROD_MODE=true
if "%~1"=="--setup-only" set SETUP_ONLY=true
if "%~1"=="--no-seed" set SEED_DATABASE=false
if "%~1"=="--force-seed" set FORCE_SEED=true
shift
goto parse_args
:end_parse

REM Check prerequisites
echo Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if not "%errorlevel%"=="0" (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js v18 or higher from https://nodejs.org/
    pause
    exit /b 1
)
echo [SUCCESS] Node.js is available

REM Check npm
call npm --version >nul 2>&1
if not "%errorlevel%"=="0" (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)

echo [SUCCESS] Prerequisites check passed

REM Setup environment
echo.
echo Setting up environment...

if not exist .env.local (
    echo Creating .env.local file with new port configuration...
    
    REM Generate a simple secret (Windows compatible)
    set NEXTAUTH_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%
    
    (
        echo # Port Configuration
        echo FRONTEND_PORT=3007
        echo BACKEND_PORT=4007
        echo DATABASE_PORT=5437
        echo.
        echo # Base URLs
        echo FRONTEND_URL=http://localhost:3007
        echo BACKEND_URL=http://localhost:4007
        echo API_URL=http://localhost:3007/api
        echo.
        echo # MongoDB Configuration
        echo MONGODB_URI=mongodb+srv://webuidb:Skyler01@cluster0.7us70qf.mongodb.net/?retryWrites=true^&w=majority
        echo DB_NAME=personal_website
        echo.
        echo # NextAuth Configuration
        echo NEXTAUTH_SECRET=!NEXTAUTH_SECRET!
        echo NEXTAUTH_URL=http://localhost:3007
        echo NEXTAUTH_URL_INTERNAL=http://localhost:3007
        echo.
        echo # Development flags
        echo NODE_ENV=development
        echo MOCK_DATA=true
        echo DATABASE_TYPE=mongodb
        echo.
        echo # Windows & Docker specific settings
        echo NEXT_WEBPACK_USEPOLLING=1
        echo WATCHPACK_POLLING=true
        echo.
        echo # Upload Configuration
        echo UPLOAD_DIR=./public/uploads
        echo MAX_FILE_SIZE=5242880
    ) > .env.local
    
    echo [SUCCESS] .env.local created successfully with port 3007 configuration
) else (
    echo [INFO] .env.local already exists
    echo [INFO] Please verify it contains the new port configuration:
    echo         FRONTEND_PORT=3007
    echo         NEXTAUTH_URL=http://localhost:3007
)

REM Install dependencies
echo.
echo Installing dependencies...

if exist package-lock.json (
    call npm ci --loglevel=error
) else (
    call npm install --loglevel=error
)

if not "%errorlevel%"=="0" (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Dependencies installed successfully

REM Install cross-env if not present (for Windows compatibility)
echo.
echo Checking for cross-env dependency...
call npm list cross-env >nul 2>&1
if not "%errorlevel%"=="0" (
    echo Installing cross-env for Windows compatibility...
    call npm install --save-dev cross-env
    echo [SUCCESS] cross-env installed
) else (
    echo [SUCCESS] cross-env already installed
)

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
echo Downloading real images (if configured)...

if exist scripts\setup\download-real-images.js (
    node scripts\setup\download-real-images.js >nul 2>&1
    echo [SUCCESS] Real image setup completed
) else (
    echo [INFO] Real image download script not found, using placeholders
)

REM Clear cache
echo.
echo Clearing Next.js cache...

if exist .next (
    rmdir /s /q .next >nul 2>&1
)

echo [SUCCESS] Cache cleared

REM Database seeding and initialization
if "%SEED_DATABASE%"=="true" (
    echo.
    echo =====================================================
    echo   Database Initialization and Seeding
    echo =====================================================
    
    REM Test database connection first
    echo Testing database connection...
    
    if exist testing\test-db-connection.js (
        node testing\test-db-connection.js >nul 2>&1
        if not "%errorlevel%"=="0" (
            echo [WARNING] Database connection failed - will use mock data mode
            echo [INFO] Mock data mode includes sample content for development
            goto seeding_complete
        ) else (
            echo [SUCCESS] Database connection successful
            
            REM Initialize admin user
            echo.
            echo Creating admin user...
            if exist scripts\setup\init-admin.js (
                node scripts\setup\init-admin.js >nul 2>&1
                echo [SUCCESS] Admin user created/updated
            )
            
            REM Initialize default pages
            echo.
            echo Creating default pages...
            if exist scripts\setup\init-pages.js (
                node scripts\setup\init-pages.js >nul 2>&1
                echo [SUCCESS] Default pages created
            )
            
            REM Full database seeding (if forced or first time)
            if "%FORCE_SEED%"=="true" (
                echo.
                echo [INFO] Force seeding enabled - populating database with sample content...
                if exist scripts\setup\seed-full-database.js (
                    node scripts\setup\seed-full-database.js
                    if not "%errorlevel%"=="0" (
                        echo [WARNING] Database seeding had issues
                    ) else (
                        echo [SUCCESS] Database fully seeded with sample content
                        echo [INFO] Sample content includes:
                        echo         - Admin user (admin@example.com / admin12345)
                        echo         - Sample blog posts and projects
                        echo         - Default pages (Home, About, Contact)
                        echo         - Profile information
                    )
                ) else (
                    echo [WARNING] Seeding script not found
                )
            ) else (
                echo [INFO] Using existing database content
                echo [INFO] To force re-seeding, use --force-seed flag
            )
        )
    ) else (
        echo [WARNING] Database test script not found, assuming mock data mode
    )
    
    echo.
    echo [SUCCESS] Database initialization complete
    
    echo.
    echo =====================================================
    echo   Login Credentials for Development
    echo =====================================================
    echo   Admin Panel: http://localhost:3007/admin
    echo   Email:       admin@example.com
    echo   Password:    admin12345
    echo =====================================================
) else (
    echo [INFO] Database seeding skipped (--no-seed flag used)
)

REM Run tests if not skipped
if "%SKIP_TESTS%"=="false" (
    echo.
    echo Running quick health check tests...
    
    call npm run test:ci >nul 2>&1
    if not "%errorlevel%"=="0" (
        echo [WARNING] Some tests failed, but continuing startup
    ) else (
        echo [SUCCESS] Tests passed
    )
)

REM Start server unless setup-only mode
if "%SETUP_ONLY%"=="true" (
    goto setup_complete
)

if "%PROD_MODE%"=="true" (
    echo.
    echo Building for production...
    call npm run build
    if not "%errorlevel%"=="0" (
        echo [ERROR] Build failed
        pause
        exit /b 1
    )
    echo.
    echo Starting production server...
    call npm run start:windows
    goto :eof
)

echo.
echo =====================================================
echo   Starting Development Environment
echo =====================================================
echo   Frontend:     http://localhost:3007
echo   Admin Panel:  http://localhost:3007/admin
echo   
echo   Login:        admin@example.com / admin12345
echo   
echo   Press Ctrl+C to stop the server
echo =====================================================
echo.

REM Start the development server with Windows-specific script
call npm run dev:mock:windows
goto :eof

:setup_complete
echo.
echo =====================================================
echo   Setup Complete! Development Environment Ready
echo =====================================================
echo.
echo   Available development modes:
echo     npm run dev:mock:windows     (Native Windows)
echo     npm run dev:docker           (Docker - Recommended)
echo     npm run dev:mock             (Cross-platform)
echo.
echo   URLs:
echo     Frontend:     http://localhost:3007
echo     Admin Panel:  http://localhost:3007/admin
echo.
echo   Login Credentials:
echo     Email:        admin@example.com
echo     Password:     admin12345
echo.
echo   Docker Development (if using Docker):
echo     Database:     PostgreSQL on port 5437
echo     pgAdmin:      http://localhost:8080
echo.
echo   Sample Content Included:
echo     - Blog posts and projects
echo     - Profile information
echo     - Default pages (Home, About, Contact)
echo     - Admin user and access controls
echo.
echo =====================================================
pause
goto :eof

:show_help
echo.
echo Usage: startup-all.bat [options]
echo Options:
echo   --help, -h       Show this help message
echo   --no-tests       Skip running tests
echo   --prod           Start in production mode
echo   --setup-only     Only run setup tasks, don't start server
echo   --no-seed        Skip database seeding
echo   --force-seed     Force complete database re-seeding
echo.
echo Examples:
echo   startup-all.bat                    # Full startup with seeding on port 3007
echo   startup-all.bat --no-tests         # Skip tests
echo   startup-all.bat --setup-only       # Setup only with seeding
echo   startup-all.bat --force-seed       # Force complete re-seeding
echo   startup-all.bat --no-seed          # Skip all seeding
echo   startup-all.bat --prod             # Production mode
echo.
echo Port Configuration:
echo   Frontend: 3007 (changed from 3000)
echo   Backend: 4007 (reserved)
echo   Database: 5437 (PostgreSQL)
echo   pgAdmin: 8080 (Docker only)
echo.
echo Database Seeding:
echo   The script will automatically create:
echo   - Admin user (admin@example.com / admin12345)
echo   - Sample blog posts and projects
echo   - Default pages (Home, About, Contact)
echo   - Profile information and settings
echo   - Mock data for development (if no database connection)
echo.
pause
goto :eof 