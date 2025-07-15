@echo off
setlocal enabledelayedexpansion

REM Complete System Backup for Personal Website (Windows)
REM This script creates a comprehensive backup of database, content, and configuration

REM Script configuration
set "SCRIPT_DIR=%~dp0"
set "BACKUP_DIR=C:\PersonalWebsite\Backups"
set "TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "RETENTION_DAYS=14"

REM Color codes for Windows
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

echo %BLUE%===========================================%NC%
echo %BLUE%Personal Website - Complete System Backup%NC%
echo %BLUE%===========================================%NC%
echo.

echo %BLUE%[INFO]%NC% Starting complete system backup...
echo %BLUE%[INFO]%NC% Backup ID: %TIMESTAMP%
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Docker is not running or not accessible
    echo Please ensure Docker Desktop is running and try again.
    pause
    exit /b 1
)

REM Check if development containers are running
docker-compose ps >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%[WARNING]%NC% Docker Compose not found in current directory
    echo Make sure you're running this from the project root directory
)

REM Setup backup environment
echo %BLUE%[INFO]%NC% Setting up backup environment...

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%BACKUP_DIR%\database" mkdir "%BACKUP_DIR%\database"
if not exist "%BACKUP_DIR%\content" mkdir "%BACKUP_DIR%\content"
if not exist "%BACKUP_DIR%\config" mkdir "%BACKUP_DIR%\config"
if not exist "%BACKUP_DIR%\logs" mkdir "%BACKUP_DIR%\logs"
if not exist "%BACKUP_DIR%\stats" mkdir "%BACKUP_DIR%\stats"

echo %GREEN%[SUCCESS]%NC% Backup environment ready

REM Get database configuration
echo %BLUE%[INFO]%NC% Database configuration needed for backup...

set /p "DB_HOST=Database host (default: localhost): "
if "%DB_HOST%"=="" set "DB_HOST=localhost"

set /p "DB_PORT=Database port (default: 5436): "
if "%DB_PORT%"=="" set "DB_PORT=5436"

set /p "DB_USER=Database user (default: postgres): "
if "%DB_USER%"=="" set "DB_USER=postgres"

set /p "DB_NAME=Database name (default: personal_website): "
if "%DB_NAME%"=="" set "DB_NAME=personal_website"

set /p "DB_PASSWORD=Database password: "

REM Test database connection
echo %BLUE%[INFO]%NC% Testing database connection...

set "PGPASSWORD=%DB_PASSWORD%"
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\q" >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Cannot connect to database
    echo Please check your database configuration and ensure it's running
    pause
    exit /b 1
)

echo %GREEN%[SUCCESS]%NC% Database connection successful

REM Backup database
echo %BLUE%[INFO]%NC% Backing up database...

set "DB_BACKUP_FILE=%BACKUP_DIR%\database\database_backup_%TIMESTAMP%.sql"

pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% --verbose --clean --if-exists %DB_NAME% > "%DB_BACKUP_FILE%" 2>nul

if errorlevel 1 (
    echo %RED%[ERROR]%NC% Database backup failed
    pause
    exit /b 1
)

REM Compress database backup using PowerShell
echo %BLUE%[INFO]%NC% Compressing database backup...
powershell -Command "Compress-Archive -Path '%DB_BACKUP_FILE%' -DestinationPath '%DB_BACKUP_FILE%.zip' -Force"
del "%DB_BACKUP_FILE%"

echo %GREEN%[SUCCESS]%NC% Database backup completed

REM Backup content and media files
echo %BLUE%[INFO]%NC% Backing up content and media files...

set "CONTENT_BACKUP_FILE=%BACKUP_DIR%\content\content_backup_%TIMESTAMP%.zip"

REM Create content backup including public directory
if exist "public" (
    powershell -Command "Compress-Archive -Path 'public\*' -DestinationPath '%CONTENT_BACKUP_FILE%' -Force"
    echo %GREEN%[SUCCESS]%NC% Content backup completed
) else (
    echo %YELLOW%[WARNING]%NC% Public directory not found, skipping content backup
)

REM Create content inventory
if exist "public" (
    dir "public" /s /b > "%BACKUP_DIR%\stats\content_inventory_%TIMESTAMP%.txt" 2>nul
)

REM Backup configuration files
echo %BLUE%[INFO]%NC% Backing up configuration files...

set "CONFIG_BACKUP_FILE=%BACKUP_DIR%\config\config_backup_%TIMESTAMP%.zip"

REM Create temporary directory for config files
set "TEMP_CONFIG_DIR=%TEMP%\config_backup_%TIMESTAMP%"
mkdir "%TEMP_CONFIG_DIR%"

REM Copy existing config files
if exist ".env.local" copy ".env.local" "%TEMP_CONFIG_DIR%\" >nul 2>&1
if exist "docker-compose.yml" copy "docker-compose.yml" "%TEMP_CONFIG_DIR%\" >nul 2>&1
if exist "docker-compose.prod.yml" copy "docker-compose.prod.yml" "%TEMP_CONFIG_DIR%\" >nul 2>&1
if exist "package.json" copy "package.json" "%TEMP_CONFIG_DIR%\" >nul 2>&1
if exist "package-lock.json" copy "package-lock.json" "%TEMP_CONFIG_DIR%\" >nul 2>&1
if exist "next.config.js" copy "next.config.js" "%TEMP_CONFIG_DIR%\" >nul 2>&1
if exist "tailwind.config.js" copy "tailwind.config.js" "%TEMP_CONFIG_DIR%\" >nul 2>&1
if exist "Dockerfile" copy "Dockerfile" "%TEMP_CONFIG_DIR%\" >nul 2>&1

REM Create backup archive
powershell -Command "Compress-Archive -Path '%TEMP_CONFIG_DIR%\*' -DestinationPath '%CONFIG_BACKUP_FILE%' -Force"

REM Cleanup temporary directory
rmdir /s /q "%TEMP_CONFIG_DIR%"

echo %GREEN%[SUCCESS]%NC% Configuration backup completed

REM Generate database statistics
echo %BLUE%[INFO]%NC% Generating database statistics...

set "STATS_FILE=%BACKUP_DIR%\stats\db_stats_%TIMESTAMP%.txt"

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 'users' as table_name, COUNT(*) as record_count FROM users UNION ALL SELECT 'posts', COUNT(*) FROM posts UNION ALL SELECT 'projects', COUNT(*) FROM projects UNION ALL SELECT 'pages', COUNT(*) FROM pages UNION ALL SELECT 'media_files', COUNT(*) FROM media_files UNION ALL SELECT 'newsletter_subscribers', COUNT(*) FROM newsletter_subscribers ORDER BY table_name;" > "%STATS_FILE%" 2>nul

echo %GREEN%[SUCCESS]%NC% Database statistics generated

REM Backup application logs (if using Docker)
echo %BLUE%[INFO]%NC% Backing up application logs...

set "LOGS_BACKUP_FILE=%BACKUP_DIR%\logs\app_logs_%TIMESTAMP%.txt"

docker-compose logs --tail=1000 app > "%LOGS_BACKUP_FILE%" 2>nul || echo %YELLOW%[WARNING]%NC% Could not backup application logs

echo %GREEN%[SUCCESS]%NC% Application logs backed up

REM Create backup manifest
echo %BLUE%[INFO]%NC% Creating backup manifest...

set "MANIFEST_FILE=%BACKUP_DIR%\backup_manifest_%TIMESTAMP%.txt"

(
echo ================================================================================
echo BACKUP MANIFEST
echo ================================================================================
echo.
echo Backup Date: %date% %time%
echo Backup ID: %TIMESTAMP%
echo Server: %COMPUTERNAME%
echo.
echo BACKUP COMPONENTS:
) > "%MANIFEST_FILE%"

REM List all backup files with sizes
if exist "%BACKUP_DIR%\database\database_backup_%TIMESTAMP%.sql.zip" (
    echo ✓ Database: database_backup_%TIMESTAMP%.sql.zip >> "%MANIFEST_FILE%"
)

if exist "%BACKUP_DIR%\content\content_backup_%TIMESTAMP%.zip" (
    echo ✓ Content: content_backup_%TIMESTAMP%.zip >> "%MANIFEST_FILE%"
)

if exist "%BACKUP_DIR%\config\config_backup_%TIMESTAMP%.zip" (
    echo ✓ Configuration: config_backup_%TIMESTAMP%.zip >> "%MANIFEST_FILE%"
)

if exist "%BACKUP_DIR%\logs\app_logs_%TIMESTAMP%.txt" (
    echo ✓ Application Logs: app_logs_%TIMESTAMP%.txt >> "%MANIFEST_FILE%"
)

(
echo.
echo DATABASE STATISTICS:
type "%BACKUP_DIR%\stats\db_stats_%TIMESTAMP%.txt" 2>nul
echo.
echo RESTORE INSTRUCTIONS:
echo 1. Stop application containers
echo 2. Restore database: psql -h localhost -p 5436 -U postgres personal_website ^< database_backup_%TIMESTAMP%.sql
echo 3. Restore content: Extract content_backup_%TIMESTAMP%.zip to public\ directory
echo 4. Restore config: Extract config_backup_%TIMESTAMP%.zip to project root
echo 5. Start application containers
echo.
echo BACKUP RETENTION:
echo This backup will be automatically deleted after %RETENTION_DAYS% days.
echo ================================================================================
) >> "%MANIFEST_FILE%"

echo %GREEN%[SUCCESS]%NC% Backup manifest created: %MANIFEST_FILE%

REM Cleanup old backups
echo %BLUE%[INFO]%NC% Cleaning up old backups (older than %RETENTION_DAYS% days)...

REM Use PowerShell to delete old files (Windows doesn't have a direct equivalent to find -mtime)
powershell -Command "Get-ChildItem '%BACKUP_DIR%' -Recurse -Name '*backup_*.zip' | Where-Object {(Get-Date) - (Get-Item $_).CreationTime -gt [TimeSpan]::FromDays(%RETENTION_DAYS%)} | Remove-Item -Force" 2>nul

echo %GREEN%[SUCCESS]%NC% Old backups cleaned up

REM Generate backup summary
echo %BLUE%[INFO]%NC% Generating backup summary...

set "SUMMARY_FILE=%BACKUP_DIR%\backup_summary.txt"

(
echo === LATEST BACKUP SUMMARY ===
echo Backup Date: %date% %time%
echo Backup ID: %TIMESTAMP%
echo Status: Completed Successfully
echo.
echo Backup Location: %BACKUP_DIR%
echo.
echo Recent Backups:
dir "%BACKUP_DIR%\backup_manifest_*.txt" /b /o-d 2>nul | head -5
echo.
echo Last Backup Verification: %date% %time%
echo === END SUMMARY ===
) > "%SUMMARY_FILE%"

echo %GREEN%[SUCCESS]%NC% Backup summary updated

REM Display completion message
echo.
echo %GREEN%[SUCCESS]%NC% Complete system backup finished successfully!
echo %BLUE%[INFO]%NC% Backup location: %BACKUP_DIR%
echo %BLUE%[INFO]%NC% Backup ID: %TIMESTAMP%

REM Show backup manifest summary
echo.
echo === BACKUP MANIFEST SUMMARY ===
type "%MANIFEST_FILE%" | findstr /i "BACKUP COMPONENTS:" -A 10

echo.
echo %BLUE%[INFO]%NC% To view full backup details: %MANIFEST_FILE%
echo %BLUE%[INFO]%NC% To restore from this backup, use the restore scripts with timestamp: %TIMESTAMP%

pause 