@echo off
echo ========================================
echo    Project Bulk Update Script
echo ========================================
echo.
echo This script will update ALL projects to:
echo - Status: draft
echo - Featured: false
echo.
echo WARNING: This will affect ALL projects in the database!
echo.
set /p confirm="Are you sure you want to continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Starting project update...
echo.

cd /d "%~dp0.."
node scripts/update-all-projects-to-draft.js

echo.
echo Script completed. Press any key to exit...
pause >nul






