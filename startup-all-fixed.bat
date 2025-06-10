@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Personal Website Development Startup
echo ========================================
echo.

:: Parse command line arguments
set "FORCE_SEED="
set "NO_SEED="
set "SETUP_ONLY="
set "DOCKER_MODE="

:parse_args
if "%~1"=="" goto :args_done
if "%~1"=="--force-seed" set "FORCE_SEED=1"
if "%~1"=="--no-seed" set "NO_SEED=1"
if "%~1"=="--setup-only" set "SETUP_ONLY=1"
if "%~1"=="--docker" set "DOCKER_MODE=1"
shift
goto :parse_args
:args_done

:: Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 goto :node_error

:: Check if npm is installed
echo Checking npm installation...
call npm --version >nul 2>&1
if errorlevel 1 goto :npm_error

:: Install dependencies if needed
if not exist "node_modules" goto :install_deps
echo Dependencies already installed.
goto :deps_done

:install_deps
echo Installing dependencies...
call npm install
if errorlevel 1 goto :install_error

:deps_done
:: Setup images
echo Setting up placeholder images...
call npm run setup:images
if errorlevel 1 echo Warning: Image setup failed, continuing...

:: Handle seeding based on arguments
if defined NO_SEED goto :skip_seed
if defined FORCE_SEED goto :force_seed

:: Default seeding (admin + pages only)
echo Setting up admin user and pages...
call npm run seed:admin
if errorlevel 1 echo Warning: Admin setup failed, continuing...

call npm run seed:pages  
if errorlevel 1 echo Warning: Page setup failed, continuing...
goto :seed_done

:force_seed
echo Performing full database seeding...
call npm run seed:complete
if errorlevel 1 echo Warning: Full seeding failed, continuing...
goto :seed_done

:skip_seed
echo Skipping database seeding...

:seed_done
if defined SETUP_ONLY goto :setup_complete

:: Start development server
echo.
echo ========================================
echo Starting Development Server
echo ========================================
echo.
echo Server will be available at: http://localhost:3007
echo Admin panel: http://localhost:3007/admin
echo.
echo Login credentials:
echo Email: admin@example.com
echo Password: admin12345
echo.

if defined DOCKER_MODE goto :start_docker

:: Start regular development server
echo Starting Next.js development server...
call npm run dev:mock
goto :end

:start_docker
echo Starting Docker development environment...
call npm run dev:docker
goto :end

:setup_complete
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the development server, run:
echo   npm run dev:mock
echo.
echo Server will be available at: http://localhost:3007
echo Admin panel: http://localhost:3007/admin
echo.
goto :end

:node_error
echo Error: Node.js is not installed or not in PATH
echo Please install Node.js from https://nodejs.org/
goto :end

:npm_error
echo Error: npm is not available
echo Please ensure npm is installed with Node.js
goto :end

:install_error
echo Error: Failed to install dependencies
echo Please check your internet connection and try again
goto :end

:end
echo.
pause 