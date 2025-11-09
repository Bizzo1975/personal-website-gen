@echo off
:: Quick Backup Wrapper - provides easy access to backup functions from root directory

set SCRIPT_DIR=%~dp0
set BACKUP_DIR=%SCRIPT_DIR%backups

if "%1"=="" (
    echo.
    echo Personal Website - Quick Backup Wrapper
    echo ==========================================
    echo.
    echo Available commands:
    echo   backup-quick.bat immediate    - Create immediate backup
    echo   backup-quick.bat automated    - Run automated backup
    echo   backup-quick.bat list         - List available backups
    echo   backup-quick.bat restore      - Restore from backup
    echo   backup-quick.bat status       - Check backup status
    echo   backup-quick.bat help         - Show this help
    echo.
    echo All backup files are located in: %BACKUP_DIR%
    echo.
    pause
    exit /b 1
)

if "%1"=="immediate" (
    echo Running optimized backup...
    cd /d "%BACKUP_DIR%"
    call backup-optimized.bat
) else if "%1"=="automated" (
    echo Running automated backup...
    cd /d "%BACKUP_DIR%"
    call backup-automated.bat
) else if "%1"=="list" (
    echo Listing available backups...
    cd /d "%BACKUP_DIR%"
    call restore-backup.bat
) else if "%1"=="restore" (
    if "%2"=="" (
        echo Listing available backups for restore...
        cd /d "%BACKUP_DIR%"
        call restore-backup.bat
    ) else (
        echo Restoring from backup %2...
        cd /d "%BACKUP_DIR%"
        call restore-backup.bat %2
    )
) else if "%1"=="status" (
    echo Checking backup status...
    cd /d "%BACKUP_DIR%"
    if exist backup_summary.txt (
        type backup_summary.txt
    ) else (
        echo No backup summary found. Run a backup first.
    )
) else if "%1"=="help" (
    echo.
    echo Personal Website - Quick Backup Wrapper
    echo ==========================================
    echo.
    echo This wrapper provides easy access to backup functions from the root directory.
    echo All backup scripts and data are located in: %BACKUP_DIR%
    echo.
    echo Commands:
    echo   immediate  - Create immediate backup of all components
    echo   automated  - Run automated backup with retention management
    echo   list       - List all available backups
    echo   restore    - Restore from backup (optionally specify timestamp)
    echo   status     - Show current backup status
    echo   help       - Show this help message
    echo.
    echo Examples:
    echo   backup-quick.bat immediate
    echo   backup-quick.bat list
    echo   backup-quick.bat restore 20250715_135719
    echo   backup-quick.bat status
    echo.
    echo Documentation: %BACKUP_DIR%\BACKUP_SYSTEM_GUIDE.md
    echo.
) else (
    echo Unknown command: %1
    echo Run "backup-quick.bat help" for available commands
    exit /b 1
)

echo.
echo Backup operation completed.
echo For more options, see: %BACKUP_DIR%\BACKUP_SYSTEM_GUIDE.md 