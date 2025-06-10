@echo off
setlocal enabledelayedexpansion

echo =====================================================
echo   Simple Windows Startup Script - Debugging
echo =====================================================

echo Step 1: Checking Node.js...
node --version
if errorlevel 1 (
    echo [ERROR] Node.js not found
    pause
    exit /b 1
)
echo [OK] Node.js check complete

echo Step 2: Checking npm...
npm --version
if errorlevel 1 (
    echo [ERROR] npm not found
    pause
    exit /b 1
)
echo [OK] npm check complete

echo Step 3: Checking package.json...
if exist package.json (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json not found
    pause
    exit /b 1
)

echo Step 4: Creating basic .env.local...
if not exist .env.local (
    echo FRONTEND_PORT=3007 > .env.local
    echo MOCK_DATA=true >> .env.local
    echo NODE_ENV=development >> .env.local
    echo [OK] Basic .env.local created
) else (
    echo [OK] .env.local already exists
)

echo Step 5: Installing dependencies (minimal)...
echo This may take several minutes...
npm ci --silent
if errorlevel 1 (
    echo [ERROR] npm ci failed, trying npm install...
    npm install --silent
    if errorlevel 1 (
        echo [ERROR] npm install also failed
        pause
        exit /b 1
    )
)
echo [OK] Dependencies installed

echo Step 6: Clearing cache...
if exist .next (
    rmdir /s /q .next >nul 2>&1
)
echo [OK] Cache cleared

echo.
echo =====================================================
echo   Setup Complete - Choose Development Mode
echo =====================================================
echo [1] Start with mock data (recommended for testing)
echo [2] Exit
echo.
set /p choice="Choose option (1-2): "

if "%choice%"=="1" (
    echo.
    echo Starting development server...
    echo Frontend: http://localhost:3007
    echo.
    npm run dev:mock:windows
) else (
    echo Setup complete. To start manually, run: npm run dev:mock:windows
    pause
)

echo.
pause 