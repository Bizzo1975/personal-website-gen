@echo off
echo =====================================================
echo   Debug Windows Startup Script
echo =====================================================

echo Testing basic commands...

echo Checking Node.js...
node --version
echo Node.js check done

echo Checking npm...
call npm --version
echo npm check done

echo Checking package.json...
if exist package.json (
    echo package.json found
) else (
    echo package.json NOT found
)

echo Creating .env.local...
if not exist .env.local (
    echo FRONTEND_PORT=3007 > .env.local
    echo MOCK_DATA=true >> .env.local
    echo [OK] .env.local created
) else (
    echo [OK] .env.local exists
)

echo All checks complete!
echo To install dependencies manually, run: npm install
echo To start development, run: npm run dev:mock:windows

pause 