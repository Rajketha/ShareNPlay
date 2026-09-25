@echo off
echo ========================================
echo ShareNPlay - Complete Startup Script
echo ========================================
echo.

echo Step 1: Installing dependencies...
echo.

echo Installing backend dependencies...
cd /d %~dp0backend
if not exist node_modules (
    echo Installing backend packages...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Backend dependency installation failed!
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed.
)

echo.
echo Installing frontend dependencies...
cd /d %~dp0frontend
if not exist node_modules (
    echo Installing frontend packages...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Frontend dependency installation failed!
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed.
)

echo.
echo Step 2: Checking for running services...
echo.

echo Checking port 5000 (Backend)...
netstat -an | findstr ":5000" >nul
if %errorlevel% == 0 (
    echo WARNING: Backend already running on port 5000
    echo You may need to close existing backend processes.
) else (
    echo Port 5000 is available for backend.
)

echo Checking port 3002 (Frontend)...
netstat -an | findstr ":3002" >nul
if %errorlevel% == 0 (
    echo WARNING: Frontend already running on port 3002
    echo You may need to close existing frontend processes.
) else (
    echo Port 3002 is available for frontend.
)

echo.
echo Step 3: Starting services...
echo.

echo Starting backend server...
start "ShareNPlay Backend" cmd /k "cd /d %~dp0backend && echo Starting backend on port 5000... && npm start"
timeout /t 5 /nobreak >nul

echo Starting frontend server...
start "ShareNPlay Frontend" cmd /k "cd /d %~dp0frontend && echo Starting frontend on port 3002... && npm start"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo ShareNPlay is now starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3002
echo.
echo The frontend should open automatically in your browser.
echo If not, manually navigate to: http://localhost:3002
echo.
echo Both services are running in separate windows.
echo Close those windows to stop the services.
echo.
echo Press any key to close this startup window...
pause >nul



