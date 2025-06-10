@echo off

echo =====================================================
echo   Quick Start - Personal Website Development
echo =====================================================

if not exist .env.local (
    echo Creating basic .env.local...
    echo FRONTEND_PORT=3007 > .env.local
    echo MOCK_DATA=true >> .env.local
    echo NODE_ENV=development >> .env.local
)

if not exist node_modules (
    echo Installing dependencies...
    npm install
)

if exist .next (
    rmdir /s /q .next >nul 2>&1
)

echo.
echo Starting development server...
echo Frontend: http://localhost:3007
echo Admin: http://localhost:3007/admin
echo Login: admin@example.com / admin12345
echo.

npm run dev:mock:windows 