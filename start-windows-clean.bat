@echo off

echo =====================================================
echo   Personal Website - Windows Startup
echo =====================================================

echo Checking Node.js...
node --version
if errorlevel 1 (
    echo Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo Checking npm...
npm --version
if errorlevel 1 (
    echo npm not found.
    pause
    exit /b 1
)

echo Creating .env.local if needed...
if not exist .env.local (
    echo FRONTEND_PORT=3007 > .env.local
    echo MOCK_DATA=true >> .env.local
    echo NODE_ENV=development >> .env.local
)

echo Installing dependencies...
npm install

echo Setting up images and admin...
if exist scripts\setup\ensure-placeholder-images.js node scripts\setup\ensure-placeholder-images.js
if exist scripts\setup\init-admin.js node scripts\setup\init-admin.js
if exist scripts\setup\init-pages.js node scripts\setup\init-pages.js

echo Clearing cache...
if exist .next rmdir /s /q .next

echo.
echo Setup complete!
echo Frontend: http://localhost:3007
echo Admin: http://localhost:3007/admin
echo Login: admin@example.com / admin12345
echo.
echo Starting development server...
npm run dev:mock:windows 