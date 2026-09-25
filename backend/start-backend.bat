@echo off
rem ShareNPlay backend launcher — port hardening (ignores broken PORT=0)
cd /d %~dp0
where npm >/dev/null 2>&1
if %errorlevel% neq 0 (
    echo npm not found. Install Node.js first.
    pause
    exit /b 1
)
set "PORT_OVERRIDE=5000"
echo Starting ShareNPlay backend on port 5000...
start "ShareNPlay Backend" cmd /k "cd /d %~dp0 && set PORT=%PORT_OVERRIDE% && npm start"
timeout /t 3 /nobreak >/dev/null
netstat -an | findstr ":5000" >/dev/null
if %errorlevel% == 0 (
    echo Backend is running on port 5000.
) else (
    echo Backend failed to start. Check the window.
)
