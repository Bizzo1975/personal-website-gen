@echo off
setlocal enabledelayedexpansion

REM Personal Website - Complete Deployment Orchestrator (Windows)
REM This script orchestrates the full deployment process from development to production

REM Script configuration
set "SCRIPT_DIR=%~dp0"
set "LOG_DIR=%SCRIPT_DIR%logs"
set "TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "LOG_FILE=%LOG_DIR%\deployment_%TIMESTAMP%.log"

REM Create logs directory
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Color codes for Windows
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "PURPLE=[95m"
set "NC=[0m"

echo %BLUE%╔═══════════════════════════════════════════════════════════════╗%NC%
echo %BLUE%║                    PERSONAL WEBSITE                            ║%NC%
echo %BLUE%║                 COMPLETE DEPLOYMENT                            ║%NC%
echo %BLUE%║                                                               ║%NC%
echo %BLUE%║  This script will deploy your website to production          ║%NC%
echo %BLUE%║  Target: willworkforlunch.com (Digital Ocean + CloudFlare)   ║%NC%
echo %BLUE%╚═══════════════════════════════════════════════════════════════╝%NC%
echo.

echo %BLUE%[INFO]%NC% Starting deployment process...
echo %BLUE%[INFO]%NC% Log file: %LOG_FILE%
echo %BLUE%[INFO]%NC% Timestamp: %TIMESTAMP%
echo.

REM Check prerequisites
echo %BLUE%[INFO]%NC% Checking prerequisites...

REM Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Docker is not installed or not in PATH
    echo Please install Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo %RED%[ERROR]%NC% Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "docker-compose.yml" (
    echo %RED%[ERROR]%NC% docker-compose.yml not found. Please run from project root.
    pause
    exit /b 1
)

echo %GREEN%[SUCCESS]%NC% All prerequisites met!
echo.

REM Get deployment configuration
echo ========================================
echo Production Server Configuration
echo ========================================

set /p "PROD_SERVER=Production server IP/hostname: "
if "%PROD_SERVER%"=="" (
    echo %RED%[ERROR]%NC% Server IP is required
    pause
    exit /b 1
)

set /p "PROD_USER=SSH user (default: deploy): "
if "%PROD_USER%"=="" set "PROD_USER=deploy"

set /p "SSH_PORT=SSH port (default: 22): "
if "%SSH_PORT%"=="" set "SSH_PORT=22"

echo.
echo ========================================
echo Development Database Configuration
echo ========================================

set /p "DEV_DB_HOST=Dev database host (default: localhost): "
if "%DEV_DB_HOST%"=="" set "DEV_DB_HOST=localhost"

set /p "DEV_DB_PORT=Dev database port (default: 5436): "
if "%DEV_DB_PORT%"=="" set "DEV_DB_PORT=5436"

set /p "DEV_DB_USER=Dev database user (default: postgres): "
if "%DEV_DB_USER%"=="" set "DEV_DB_USER=postgres"

set /p "DEV_DB_NAME=Dev database name (default: personal_website): "
if "%DEV_DB_NAME%"=="" set "DEV_DB_NAME=personal_website"

set /p "DEV_DB_PASSWORD=Dev database password: "

echo.
echo ========================================
echo Domain Configuration  
echo ========================================

set /p "DOMAIN_NAME=Domain name (default: willworkforlunch.com): "
if "%DOMAIN_NAME%"=="" set "DOMAIN_NAME=willworkforlunch.com"

set /p "ADMIN_EMAIL=Admin email: "
if "%ADMIN_EMAIL%"=="" (
    echo %RED%[ERROR]%NC% Admin email is required
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment Options
echo ========================================
echo 1. Fresh installation (new server setup)
echo 2. Application update (server already configured)
echo 3. Data migration only
echo 4. Complete reinstall (destroy existing data)
echo.

set /p "DEPLOYMENT_TYPE=Select deployment type (1-4): "

if "%DEPLOYMENT_TYPE%"=="1" set "DEPLOYMENT_MODE=fresh"
if "%DEPLOYMENT_TYPE%"=="2" set "DEPLOYMENT_MODE=update"
if "%DEPLOYMENT_TYPE%"=="3" set "DEPLOYMENT_MODE=migration"
if "%DEPLOYMENT_TYPE%"=="4" set "DEPLOYMENT_MODE=reinstall"

if "%DEPLOYMENT_MODE%"=="" (
    echo %RED%[ERROR]%NC% Invalid selection
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment Summary
echo ========================================
echo Target Server: %PROD_USER%@%PROD_SERVER%:%SSH_PORT%
echo Domain: %DOMAIN_NAME%
echo Admin Email: %ADMIN_EMAIL%
echo Deployment Mode: %DEPLOYMENT_MODE%
echo Source Database: %DEV_DB_USER%@%DEV_DB_HOST%:%DEV_DB_PORT%/%DEV_DB_NAME%
echo.

set /p "CONFIRM=Proceed with deployment? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo %BLUE%[INFO]%NC% Deployment cancelled by user
    pause
    exit /b 0
)

REM Create environment file for sub-scripts
echo # Auto-generated deployment configuration > "%SCRIPT_DIR%\deployment-config.env"
echo PROD_SERVER=%PROD_SERVER% >> "%SCRIPT_DIR%\deployment-config.env"
echo PROD_USER=%PROD_USER% >> "%SCRIPT_DIR%\deployment-config.env"
echo SSH_PORT=%SSH_PORT% >> "%SCRIPT_DIR%\deployment-config.env"
echo DEV_DB_HOST=%DEV_DB_HOST% >> "%SCRIPT_DIR%\deployment-config.env"
echo DEV_DB_PORT=%DEV_DB_PORT% >> "%SCRIPT_DIR%\deployment-config.env"
echo DEV_DB_USER=%DEV_DB_USER% >> "%SCRIPT_DIR%\deployment-config.env"
echo DEV_DB_NAME=%DEV_DB_NAME% >> "%SCRIPT_DIR%\deployment-config.env"
echo DEV_DB_PASSWORD=%DEV_DB_PASSWORD% >> "%SCRIPT_DIR%\deployment-config.env"
echo DOMAIN_NAME=%DOMAIN_NAME% >> "%SCRIPT_DIR%\deployment-config.env"
echo ADMIN_EMAIL=%ADMIN_EMAIL% >> "%SCRIPT_DIR%\deployment-config.env"
echo DEPLOYMENT_MODE=%DEPLOYMENT_MODE% >> "%SCRIPT_DIR%\deployment-config.env"
echo TIMESTAMP=%TIMESTAMP% >> "%SCRIPT_DIR%\deployment-config.env"
echo LOG_FILE=%LOG_FILE% >> "%SCRIPT_DIR%\deployment-config.env"

REM Test connectivity
echo %BLUE%[INFO]%NC% Testing connectivity...

REM Test SSH connection (basic test)
ssh -p %SSH_PORT% -o ConnectTimeout=10 -o BatchMode=yes %PROD_USER%@%PROD_SERVER% "echo Connection successful" >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Cannot connect to production server
    echo Please ensure SSH key authentication is configured
    pause
    exit /b 1
)

echo %GREEN%[SUCCESS]%NC% Production server connectivity verified!

REM Execute deployment based on mode
if "%DEPLOYMENT_MODE%"=="fresh" goto FRESH_DEPLOYMENT
if "%DEPLOYMENT_MODE%"=="update" goto UPDATE_DEPLOYMENT  
if "%DEPLOYMENT_MODE%"=="migration" goto MIGRATION_ONLY
if "%DEPLOYMENT_MODE%"=="reinstall" goto REINSTALL_DEPLOYMENT

:FRESH_DEPLOYMENT
echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 1: Server Setup ^& Security%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

echo %BLUE%[INFO]%NC% Setting up production server...
call "%SCRIPT_DIR%\03-server-setup\initial-server-setup.bat"
if errorlevel 1 goto ERROR_HANDLER

call "%SCRIPT_DIR%\03-server-setup\install-dependencies.bat"
if errorlevel 1 goto ERROR_HANDLER

call "%SCRIPT_DIR%\03-server-setup\configure-security.bat"
if errorlevel 1 goto ERROR_HANDLER

echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 2: Data Migration%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

call "%SCRIPT_DIR%\02-migration\export-dev-data.bat"
if errorlevel 1 goto ERROR_HANDLER

call "%SCRIPT_DIR%\02-migration\validate-export.bat"
if errorlevel 1 goto ERROR_HANDLER

echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 3: Application Deployment%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

call "%SCRIPT_DIR%\04-deployment\deploy-application.bat"
if errorlevel 1 goto ERROR_HANDLER

call "%SCRIPT_DIR%\04-deployment\configure-nginx.bat"
if errorlevel 1 goto ERROR_HANDLER

echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 4: SSL ^& DNS Configuration%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

call "%SCRIPT_DIR%\03-server-setup\setup-ssl.bat"
if errorlevel 1 goto ERROR_HANDLER

echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 5: Data Import ^& Validation%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

call "%SCRIPT_DIR%\02-migration\import-to-production.bat"
if errorlevel 1 goto ERROR_HANDLER

echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 6: Backup ^& Monitoring Setup%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

call "%SCRIPT_DIR%\05-backup-restore\setup-automated-backups.bat"
if errorlevel 1 goto ERROR_HANDLER

call "%SCRIPT_DIR%\06-maintenance\health-check.bat"
if errorlevel 1 goto ERROR_HANDLER

goto DEPLOYMENT_COMPLETE

:UPDATE_DEPLOYMENT
echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 1: Pre-Update Backup%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

call "%SCRIPT_DIR%\05-backup-restore\backup-full-system.bat"
if errorlevel 1 goto ERROR_HANDLER

echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 2: Application Update%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

call "%SCRIPT_DIR%\04-deployment\deploy-application.bat"
if errorlevel 1 goto ERROR_HANDLER

echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 3: Health Check%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

call "%SCRIPT_DIR%\06-maintenance\health-check.bat"
if errorlevel 1 goto ERROR_HANDLER

goto DEPLOYMENT_COMPLETE

:MIGRATION_ONLY
echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 1: Data Export%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

call "%SCRIPT_DIR%\02-migration\export-dev-data.bat"
if errorlevel 1 goto ERROR_HANDLER

call "%SCRIPT_DIR%\02-migration\validate-export.bat"
if errorlevel 1 goto ERROR_HANDLER

echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 2: Data Import%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

call "%SCRIPT_DIR%\02-migration\import-to-production.bat"
if errorlevel 1 goto ERROR_HANDLER

echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 3: Validation%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

call "%SCRIPT_DIR%\06-maintenance\health-check.bat"
if errorlevel 1 goto ERROR_HANDLER

goto DEPLOYMENT_COMPLETE

:REINSTALL_DEPLOYMENT
echo.
echo %RED%[WARNING]%NC% This will DESTROY all existing data on the production server!
set /p "DESTROY_CONFIRM=Type 'DESTROY' to confirm: "
if not "%DESTROY_CONFIRM%"=="DESTROY" (
    echo %RED%[ERROR]%NC% Reinstall cancelled
    pause
    exit /b 1
)

echo.
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo %PURPLE%  PHASE 1: Cleanup Existing Installation%NC%
echo %PURPLE%════════════════════════════════════════════════════════════════%NC%
echo.

ssh -p %SSH_PORT% %PROD_USER%@%PROD_SERVER% "docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml down -v || true; sudo rm -rf /home/deploy/personal-website; docker system prune -af"

REM Then run fresh deployment
goto FRESH_DEPLOYMENT

:DEPLOYMENT_COMPLETE
REM Generate deployment report
echo.
echo %GREEN%[SUCCESS]%NC% Generating deployment report...

set "REPORT_FILE=%LOG_DIR%\deployment_report_%TIMESTAMP%.txt"

(
echo ================================================================================
echo DEPLOYMENT REPORT
echo ================================================================================
echo.
echo Deployment Date: %date% %time%
echo Deployment ID: %TIMESTAMP%
echo Deployment Mode: %DEPLOYMENT_MODE%
echo Target Server: %PROD_USER%@%PROD_SERVER%
echo Domain: %DOMAIN_NAME%
echo.
echo DEPLOYMENT LOG: %LOG_FILE%
echo.
echo NEXT STEPS:
echo 1. Verify website functionality: https://%DOMAIN_NAME%
echo 2. Test admin access: https://%DOMAIN_NAME%/admin
echo 3. Check email functionality
echo 4. Monitor logs for 24-48 hours
echo 5. Update DNS if not already done
echo.
echo MONITORING:
echo - Application logs: ssh %PROD_USER%@%PROD_SERVER% 'docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml logs -f app'
echo - System health: ssh %PROD_USER%@%PROD_SERVER% '/home/deploy/personal-website/scripts/06-maintenance/health-check.sh'
echo - Backup status: ssh %PROD_USER%@%PROD_SERVER% 'ls -la /home/deploy/backups/'
echo.
echo SUPPORT:
echo - Deployment logs: %LOG_FILE%
echo - Server logs: /var/log/deployment/ ^(on server^)
echo - Rollback: Use backup-restore scripts if needed
echo.
echo ================================================================================
) > "%REPORT_FILE%"

echo %GREEN%[SUCCESS]%NC% Deployment report generated: %REPORT_FILE%
echo.
type "%REPORT_FILE%"

echo.
echo %GREEN%[SUCCESS]%NC% Deployment completed successfully!
echo %BLUE%[INFO]%NC% Website should be available at: https://%DOMAIN_NAME%
echo %BLUE%[INFO]%NC% Admin panel: https://%DOMAIN_NAME%/admin
echo.

REM Cleanup temporary files
if exist "%SCRIPT_DIR%\deployment-config.env" del "%SCRIPT_DIR%\deployment-config.env"

pause
exit /b 0

:ERROR_HANDLER
echo.
echo %RED%[ERROR]%NC% Deployment failed! Check log file: %LOG_FILE%
echo %RED%[ERROR]%NC% See individual script logs for more details.
echo.

REM Cleanup temporary files
if exist "%SCRIPT_DIR%\deployment-config.env" del "%SCRIPT_DIR%\deployment-config.env"

pause
exit /b 1 