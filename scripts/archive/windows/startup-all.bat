@echo off
title Personal Website - Docker Development Environment

echo ========================================
echo Personal Website Docker Development Environment
echo ========================================
echo.
echo Starting Docker Development Environment with PostgreSQL...
echo.

REM Check directory
if not exist "package.json" (
    echo ERROR: Not in project directory!
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Kill existing processes and close specific ports
echo [1/6] Cleaning up processes and ports...
taskkill /f /im node.exe >nul 2>&1

REM Close specific ports that will be used
call npx kill-port 3006 >nul 2>&1
call npx kill-port 5436 >nul 2>&1
call npx kill-port 6386 >nul 2>&1
call npx kill-port 8086 >nul 2>&1

REM Also clean up common dev ports that might conflict
call npx kill-port 3000 >nul 2>&1
call npx kill-port 3006 >nul 2>&1
call npx kill-port 5436 >nul 2>&1
call npx kill-port 6386 >nul 2>&1
call npx kill-port 8086 >nul 2>&1

REM Stop existing containers
echo [2/6] Stopping existing containers...
docker-compose down >nul 2>&1

REM Clean cache
echo [3/6] Cleaning cache...
if exist ".next" rmdir /S /Q .next >nul 2>&1

REM Setup environment
echo [4/6] Setting up environment...
if not exist ".env.local" (
    echo # Development Environment Configuration> .env.local
    echo DATABASE_URL=postgresql://postgres:password@localhost:5436/personal_website>> .env.local
    echo POSTGRES_DB=personal_website>> .env.local
    echo POSTGRES_USER=postgres>> .env.local
    echo POSTGRES_PASSWORD=password>> .env.local
    echo NEXTAUTH_SECRET=dev-secret-key-change-in-production>> .env.local
    echo NEXTAUTH_URL=http://localhost:3006>> .env.local
    echo SMTP_HOST=smtp.gmail.com>> .env.local
    echo SMTP_PORT=587>> .env.local
    echo SMTP_USER=your-email@gmail.com>> .env.local
    echo SMTP_PASS=your-app-password>> .env.local
    echo Environment file created.
) else (
    echo Environment file already exists.
)

REM Setup images
echo [5/6] Setting up images...
call npm run setup:images
if errorlevel 1 (
    echo Warning: Image setup failed, continuing...
)

REM Start Docker containers
echo [6/6] Starting Docker containers...
echo This may take a few minutes on first run...
docker-compose up -d --build

if errorlevel 1 (
    echo ERROR: Failed to start Docker containers!
    echo Please check Docker Desktop and try again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo DOCKER CONTAINERS STARTING
echo ========================================
echo.
echo Waiting for services to be ready...

REM Wait for PostgreSQL to be ready
echo Waiting for PostgreSQL database...
timeout /t 15 /nobreak >nul

REM Wait for application to be ready
echo Waiting for application to start...
timeout /t 20 /nobreak >nul

REM Check if services are running
docker-compose ps

echo.
echo ========================================
echo SERVICES STATUS
echo ========================================
echo.
echo Checking service availability...

REM Check if port 3006 is listening (Next.js App)
netstat -ano | findstr :3006 >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS! Application is running on port 3006
) else (
    echo Application may still be starting...
)

REM Check if port 5436 is listening (PostgreSQL)
netstat -ano | findstr :5436 >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS! PostgreSQL is running on port 5436
) else (
    echo PostgreSQL may still be starting...
)

REM Check if port 6386 is listening (Redis)
netstat -ano | findstr :6386 >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS! Redis is running on port 6386
) else (
    echo Redis may still be starting...
)

REM Check if port 8086 is listening (Adminer)
netstat -ano | findstr :8086 >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS! Database admin panel is running on port 8086
) else (
    echo Database admin panel may still be starting...
)

echo.
echo ========================================
echo DEVELOPMENT ENVIRONMENT IS READY!
echo ========================================
echo.
echo 🌐 Website: http://localhost:3006
echo 📊 Admin Panel: http://localhost:3006/admin
echo 🗄️  Database Admin: http://localhost:8086
echo.
echo 📝 Default Admin Login:
echo    Email: admin@example.com
echo    Password: admin12345
echo.
echo 🗄️  Database Access (Adminer):
echo    System: PostgreSQL
echo    Server: db
echo    Username: postgres
echo    Password: password
echo    Database: personal_website
echo.
echo 🐳 Docker Commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart: docker-compose restart
echo.

REM Open browser
echo Opening browser...
timeout /t 5 /nobreak >nul
start http://localhost:3006

echo.
echo ========================================
echo DEVELOPMENT TIPS
echo ========================================
echo.
echo 1. The application uses PostgreSQL (no mock data)
echo 2. All changes are hot-reloaded automatically
echo 3. Database data persists between container restarts
echo 4. Use Docker Desktop to manage containers
echo 5. Check container logs if you encounter issues
echo.
echo Port Configuration:
echo   - Next.js App: 3006
echo   - PostgreSQL: 5436
echo   - Redis: 6386
echo   - Adminer: 8086
echo.
echo This window will close in 10 seconds...
echo Use 'docker-compose down' to stop all services.
echo.

timeout /t 10 /nobreak >nul
exit /b 0 
