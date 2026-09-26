@echo off
rem ShareNPlay backend-only launcher (port hardening: ignores broken PORT=0)
cd /d %~dp0backend
where npm >/dev/null 2>&1
if %errorlevel% neq 0 (
    echo npm not found. Install Node.js first.
    pause
    exit /b 1
)
echo Starting backend (port 5000)...
start "ShareNPlay Backend" cmd /k "set PORT=5000 && npm start"
timeout /t 3 /nobreak >/dev/null
netstat -an | findstr ":5000" >/dev/null
if %errorlevel% == 0 (
    echo Backend running on http://localhost:5000
) else (
    echo Backend failed to start. Check the window.
)
pause
