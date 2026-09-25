@echo off
rem ============================================
rem  ShareNPlay — Start Everything
rem  One double-click: install deps, start both servers, open browser
rem ============================================
cd /d %~dp0

rem --- 1. Install dependencies if missing ---
cd /d %~dp0backend
if not exist node_modules (
    echo [1/4] Installing backend dependencies... (may take a minute)
    call npm install
    if %errorlevel% neq 0 ( echo Backend install FAILED! & pause & exit /b 1 )
) else ( echo [1/4] Backend dependencies already installed. )

cd /d %~dp0frontend
if not exist node_modules (
    echo [2/4] Installing frontend dependencies... (may take a minute)
    call npm install
    if %errorlevel% neq 0 ( echo Frontend install FAILED! & pause & exit /b 1 )
) else ( echo [2/4] Frontend dependencies already installed. )

cd /d %~dp0

rem --- 2. Kill anything on ports 5000 / 3002 (and any stuck node) ---
taskkill /f /im node.exe >/dev/null 2>&1
netstat -an | findstr ":5000" >/dev/null
if %errorlevel% == 0 for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000"') do ( taskkill /f /pid %%a >/dev/null 2>&1 )
netstat -an | findstr ":3002" >/dev/null
if %errorlevel% == 0 for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002"') do ( taskkill /f /pid %%a >/dev/null 2>&1 )
timeout /t 1 /nobreak >/dev/null

rem --- 3. Start backend on port 5000 (explicitly set PORT=5000 to avoid broken PORT=0) ---
cd /d %~dp0backend
echo [3/4] Starting backend on port 5000...
start "ShareNPlay Backend" cmd /k "set PORT=5000 && npm start"
timeout /t 3 /nobreak >/dev/null
netstat -an | findstr ":5000" >/dev/null
if %errorlevel% neq 0 ( echo Backend FAILED to start! & pause & exit /b 1 )
echo     -> http://localhost:5000/api/health

rem --- 4. Start frontend on port 3002 ---
cd /d %~dp0frontend
echo [4/4] Starting frontend on port 3002...
start "ShareNPlay Frontend" cmd /k "set PORT=3002 && set DANGEROUSLY_DISABLE_HOST_CHECK=true && npm start"
timeout /t 3 /nobreak >/dev/null
netstat -an | findstr ":3002" >/dev/null
if %errorlevel% neq 0 ( echo Frontend FAILED to start! & pause & exit /b 1 )
echo     -> http://localhost:3002

rem --- 5. Open browser ---
timeout /t 2 /nobreak >/dev/null
start "" http://localhost:3002

echo.
echo ============================================================
echo ShareNPlay is ready!
echo ============================================================
echo Backend  : http://localhost:5000/api/health
echo Frontend : http://localhost:3002
echo Games    : 12 total (incl. Stickman Fight, Car Racer, Bike Racer)
echo Theme    : Light glass + system dark/light mode
echo.
echo Close the two windows above to stop the services.
pause
