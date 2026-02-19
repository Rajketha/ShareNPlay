@echo off
title ShareNPlay - Docker Launcher
color 0A

echo.
echo  =============================================
echo   🎮  ShareNPlay - Docker Launcher
echo  =============================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  ❌ Docker is NOT installed or not running!
    echo.
    echo  Please install Docker Desktop from:
    echo  https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo  ✅ Docker found. Starting ShareNPlay...
echo.

REM Build and start the container
docker compose up --build -d

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  ❌ Failed to start ShareNPlay with Docker!
    echo  Check the error above and make sure Docker Desktop is running.
    echo.
    pause
    exit /b 1
)

echo.
echo  ⏳ Waiting for app to start (10 seconds)...
timeout /t 10 /nobreak >nul

REM ---------------------------------------------------------------
REM Detect the CORRECT network IP via a helper PowerShell script
REM Uses the adapter with a default gateway — always picks the right one
REM ---------------------------------------------------------------
for /f "delims=" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0get-ip.ps1"') do set "LOCAL_IP=%%i"

REM Fallback to localhost if detection fails
if not defined LOCAL_IP set "LOCAL_IP=localhost"

echo.
echo  =============================================
echo   ✅  ShareNPlay is running!
echo  =============================================
echo.
echo   🌐 Share this link (any device, same WiFi):
echo      http://%LOCAL_IP%:5000
echo.
echo   💻 Local access:
echo      http://localhost:5000
echo.
echo   🛑 To stop: run docker compose down
echo  =============================================
echo.

REM Open the correct network link in browser
start http://%LOCAL_IP%:5000

pause
