@echo off
setlocal enabledelayedexpansion

REM Check for non-interactive mode parameter
if "%1"=="--auto" goto auto_mode
if "%1"=="--mock" goto auto_mode

echo ========================================
echo Personal Website Development Environment
echo ========================================
echo.

REM Stop any existing processes
echo [1/6] Stopping existing processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
timeout /t 2 /nobreak >nul

REM Check if we're in the correct directory
if not exist "package.json" (
    echo Error: package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
echo [2/6] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if !errorlevel! neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

REM Check for environment file
echo [3/6] Checking environment configuration...
if not exist ".env.local" (
    if exist "env.example" (
        echo Creating .env.local from env.example...
        copy env.example .env.local >nul
        echo Environment file created from template.
    ) else (
        echo Warning: No .env.local file found. You may need to create one.
    )
) else (
    echo Environment file found.
)

REM Setup placeholder images
echo [4/6] Setting up placeholder images...
call npm run setup:images
if !errorlevel! neq 0 (
    echo Warning: Failed to setup images, continuing anyway...
)

REM Run a quick build test to ensure everything compiles
echo [5/6] Running build test...
echo Testing build compilation...
echo This may take a moment...
call npm run build
if !errorlevel! neq 0 (
    echo.
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    echo The project has compilation errors.
    echo Please fix the errors before starting development.
    echo.
    echo Would you like to continue anyway with mock development? (y/n)
    set /p continue_choice="Enter choice: "
    if /i "!continue_choice!"=="y" (
        echo Continuing with mock development mode...
        goto mock_dev_direct
    ) else (
        pause
        exit /b 1
    )
) else (
    echo Build test passed successfully!
)

REM Present startup options
echo [6/6] Starting development environment...
echo.
echo ========================================
echo Development Environment Options
echo ========================================
echo.
echo Choose your development mode:
echo.
echo 1. Standard Development (with database)
echo 2. Mock Data Development (no database required) [RECOMMENDED]
echo 3. Development + Testing Suite
echo 4. Docker Development Environment
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "!choice!"=="1" goto standard_dev
if "!choice!"=="2" goto mock_dev
if "!choice!"=="3" goto testing_dev
if "!choice!"=="4" goto docker_dev
if "!choice!"=="5" goto exit
echo Invalid choice. Defaulting to Mock Data Development...
goto mock_dev

:auto_mode
echo ========================================
echo Personal Website Development Environment
echo ========================================
echo.
echo Running in automatic mode - Mock Data Development
echo.

REM Stop any existing processes
echo [1/4] Stopping existing processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
timeout /t 2 /nobreak >nul

REM Setup placeholder images
echo [2/4] Setting up placeholder images...
call npm run setup:images
if !errorlevel! neq 0 (
    echo Warning: Failed to setup images, continuing anyway...
)

REM Quick build test
echo [3/4] Quick build verification...
call npm run build >nul 2>&1
if !errorlevel! neq 0 (
    echo Warning: Build test failed, but continuing with development mode...
)

echo [4/4] Starting Mock Data Development Mode...
goto mock_dev_direct

:standard_dev
echo.
echo Starting Standard Development Mode...
echo.
echo The application will be available at:
echo http://localhost:3006
echo.
echo Admin panel: http://localhost:3006/admin
echo Default admin: admin@example.com / admin12345
echo.
echo Press Ctrl+C to stop the server
echo.
call npm run dev
goto end

:mock_dev_direct
:mock_dev
echo.
echo Starting Mock Data Development Mode...
echo.
echo ========================================
echo DEVELOPMENT SERVER STARTING
echo ========================================
echo.
echo The application will be available at:
echo http://localhost:3006
echo.
echo Admin panel: http://localhost:3006/admin
echo Default admin: admin@example.com / admin12345
echo.
echo Note: Using mock data (no database required)
echo.
echo ========================================
echo READY FOR UI/UX TESTING
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.
call npm run dev:mock
goto end

:testing_dev
echo.
echo Starting Development + Testing Environment...
echo.
echo This will start:
echo - Development server on http://localhost:3006
echo - Jest tests in watch mode
echo - Cypress E2E testing ready
echo.
echo Opening multiple terminal windows...
echo.

REM Start development server in background
start "Dev Server" cmd /k "npm run dev:mock"

REM Wait a moment for server to start
timeout /t 5 /nobreak >nul

REM Start Jest in watch mode
start "Jest Tests" cmd /k "npm run test:watch"

REM Start Cypress (optional)
echo.
set /p cypress_choice="Do you want to open Cypress E2E tests? (y/n): "
if /i "!cypress_choice!"=="y" (
    start "Cypress E2E" cmd /k "npm run cypress"
)

echo.
echo ========================================
echo Development + Testing Environment Started
echo ========================================
echo.
echo Services running:
echo - Dev Server: http://localhost:3006
echo - Jest Tests: Running in watch mode
if /i "!cypress_choice!"=="y" echo - Cypress E2E: Available for testing
echo.
echo Close individual terminal windows to stop services.
echo.
pause
goto end

:docker_dev
echo.
echo Starting Docker Development Environment...
echo.
echo This will build and start the application in Docker containers.
echo The application will be available at:
echo http://localhost:3006
echo.
echo Press Ctrl+C to stop the containers
echo.
call npm run dev:docker
goto end

:exit
echo.
echo Exiting...
goto end

:end
echo.
echo Development environment stopped.
pause 