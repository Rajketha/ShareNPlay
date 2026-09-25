@echo off
rem ShareNPlay install + restart launcher
cd /d %~dp0

rem 1) Install all dependencies (backend + frontend)
cd /d %~dp0backend
echo Installing backend dependencies... (may take a minute)
call npm install
if %errorlevel% neq 0 ( echo Backend install FAILED! & pause & exit /b 1 )

cd /d %~dp0frontend
echo Installing frontend dependencies... (may take a minute)
call npm install
if %errorlevel% neq 0 ( echo Frontend install FAILED! & pause & exit /b 1 )

cd /d %~dp0
echo Dependencies installed. Restarting services...

rem 2) Kill anything on 5000 / 3002
taskkill /f /im node.exe >/dev/null 2>&1
netstat -an | findstr ":5000" >/dev/null
if %errorlevel% == 0 for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000"') do ( taskkill /f /pid %%a >/dev/null 2>&1 )
netstat -an | findstr ":3002" >/dev/null
if %errorlevel% == 0 for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002"') do ( taskkill /f /pid %%a >/dev/null 2>&1 )
timeout /t 1 /nobreak >/dev/null

rem 3) Start backend on port 5000
cd /d %~dp0backend
echo Starting backend (port 5000)...
start "ShareNPlay Backend" cmd /k "set PORT=5000 && npm start"
timeout /t 3 /nobreak >/dev/null
netstat -an | findstr ":5000" >/dev/null
if %errorlevel% neq 0 ( echo Backend FAILED! & pause & exit /b 1 )

rem 4) Start frontend on port 3002
cd /d %~dp0frontend
echo Starting frontend (port 3002)...
start "ShareNPlay Frontend" cmd /k "set PORT=3002 && set DANGEROUSLY_DISABLE_HOST_CHECK=true && npm start"
timeout /t 3 /nobreak >/dev/null
netstat -an | findstr ":3002" >/dev/null
if %errorlevel% neq 0 ( echo Frontend FAILED! & pause & exit /b 1 )

rem 5) Open browser
timeout /t 2 /nobreak >/dev/null
start "" http://localhost:3002

echo.
echo ShareNPlay is ready!
echo Backend : http://localhost:5000/api/health
echo Frontend: http://localhost:3002
echo.
pause
