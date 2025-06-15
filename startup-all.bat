@echo off
title Personal Website - Development Environment

echo ========================================
echo Personal Website Development Environment
echo ========================================
echo.
echo Starting FULL SEEDED Development Environment...
echo.

REM Check directory
if not exist "package.json" (
    echo ERROR: Not in project directory!
    pause
    exit /b 1
)

REM Kill existing processes
echo [1/5] Cleaning up processes...
taskkill /f /im node.exe >nul 2>&1
call npx kill-port 3006 >nul 2>&1

REM Clean cache
echo [2/5] Cleaning cache...
if exist ".next" rmdir /S /Q .next >nul 2>&1

REM Setup environment
echo [3/5] Setting up environment...
if not exist ".env.local" (
    echo NEXTAUTH_SECRET=dev-secret-key-12345> .env.local
    echo NEXTAUTH_URL=http://localhost:3006>> .env.local
    echo MOCK_DATA=true>> .env.local
    echo FRONTEND_PORT=3006>> .env.local
    echo Environment file created.
)

REM Setup images
echo [4/5] Setting up images...
call npm run setup:images
if errorlevel 1 (
    echo Warning: Image setup failed, continuing...
)

REM Seed database
echo [5/5] Seeding database...
call npm run seed:full
if errorlevel 1 (
    echo Warning: Database seeding failed, continuing with mock data...
)

echo.
echo ========================================
echo STARTING DEVELOPMENT SERVER
echo ========================================
echo.
echo Server will be available at: http://localhost:3006
echo Admin panel: http://localhost:3006/admin
echo Login: admin@example.com / admin12345
echo.
echo Starting server in new window...

REM Start server in new window that stays open
start "Dev Server - http://localhost:3006" cmd /k "echo Starting Personal Website Development Server... & echo. & npm run dev:mock"

REM Wait and verify
echo Waiting for server to start...
timeout /t 10 /nobreak >nul

netstat -ano | findstr :3006 >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Server is running on port 3006
    echo Opening browser...
    start http://localhost:3006
    echo.
    echo ========================================
    echo DEVELOPMENT ENVIRONMENT IS READY!
    echo ========================================
    echo.
    echo Website: http://localhost:3006
    echo Admin: http://localhost:3006/admin
    echo Login: admin@example.com / admin12345
    echo.
    echo Server window: "Dev Server - http://localhost:3006"
    echo Use Ctrl+C in server window to stop.
) else (
    echo.
    echo Server may still be starting...
    echo Check "Dev Server" window for status.
    echo If there are issues, try running: npm run dev:mock
)

echo.
echo This startup window will close in 5 seconds...
timeout /t 5 /nobreak >nul

exit /b 0 