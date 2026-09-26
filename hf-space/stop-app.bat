@echo off
echo Stopping ShareNPlay services...
echo.

echo Stopping processes on port 5000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000"') do (
    taskkill /f /pid %%a >nul 2>&1
    echo Backend process %%a stopped.
)

echo Stopping processes on port 3002 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002"') do (
    taskkill /f /pid %%a >nul 2>&1
    echo Frontend process %%a stopped.
)

echo.
echo All ShareNPlay services stopped.
echo Press any key to close...
pause >nul



