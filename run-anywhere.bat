@echo off
title ShareNPlay - One Click Run
color 0A

echo.
echo  =============================================
echo   🎮  ShareNPlay - One Click Launcher
echo  =============================================
echo.

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  ❌ Docker is NOT installed!
    echo.
    echo  Install Docker Desktop (free):
    echo  https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo  ✅ Docker found.
echo  📦 Pulling latest ShareNPlay image...
echo.

REM Pull latest image from Docker Hub
docker pull rajketha/sharenplay:latest

REM Stop old container if running
docker rm -f sharenplay-app >nul 2>&1

REM Start fresh container
docker run -d ^
  --name sharenplay-app ^
  -p 5000:5000 ^
  -v sharenplay-uploads:/app/backend/uploads ^
  --restart unless-stopped ^
  rajketha/sharenplay:latest

if %errorlevel% neq 0 (
    color 0C
    echo  ❌ Failed to start ShareNPlay!
    pause
    exit /b 1
)

echo.
echo  ⏳ Starting up (8 seconds)...
timeout /t 8 /nobreak >nul

REM Detect local Wi-Fi IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127\." ^| findstr /v "172\."') do (
    set "LOCAL_IP=%%a"
    goto :found_ip
)
:found_ip
set "LOCAL_IP=%LOCAL_IP: =%"

echo.
echo  =============================================
echo   ✅  ShareNPlay is LIVE!
echo  =============================================
echo.
echo   🌐 Your link (share this on same WiFi):
echo      http://%LOCAL_IP%:5000
echo.
echo   💻 Localhost:
echo      http://localhost:5000
echo.
echo   🛑 To stop: docker rm -f sharenplay-app
echo  =============================================
echo.

start http://%LOCAL_IP%:5000
pause
