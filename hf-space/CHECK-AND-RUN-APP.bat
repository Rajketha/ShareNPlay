@echo off
REM === Check for portable Node.js and npm ===
if not exist "portable-node\node.exe" (
    echo [ERROR] Portable Node.js not found! Please download/extract it to portable-node\.
    pause
    exit /b 1
)
if not exist "portable-node\npm.cmd" (
    echo [ERROR] Portable npm not found! Please check your portable-node\ folder.
    pause
    exit /b 1
)

REM === Check for backend and frontend folders ===
if not exist "backend" (
    echo [ERROR] 'backend' folder not found!
    pause
    exit /b 1
)
if not exist "frontend" (
    echo [ERROR] 'frontend' folder not found!
    pause
    exit /b 1
)

REM === Install backend dependencies ===
echo Installing backend dependencies...
cd backend
..\portable-node\npm.cmd install

REM Check for 'qrcode' and 'ws' in backend
..\portable-node\npm.cmd list qrcode >nul 2>&1
if errorlevel 1 (
    echo Installing 'qrcode' in backend...
    ..\portable-node\npm.cmd install qrcode
)
..\portable-node\npm.cmd list ws >nul 2>&1
if errorlevel 1 (
    echo Installing 'ws' in backend...
    ..\portable-node\npm.cmd install ws
)
cd ..

REM === Install frontend dependencies ===
echo Installing frontend dependencies...
cd frontend
..\portable-node\npm.cmd install

REM Check for 'qrcode' and 'ws' in frontend
..\portable-node\npm.cmd list qrcode >nul 2>&1
if errorlevel 1 (
    echo Installing 'qrcode' in frontend...
    ..\portable-node\npm.cmd install qrcode
)
..\portable-node\npm.cmd list ws >nul 2>&1
if errorlevel 1 (
    echo Installing 'ws' in frontend...
    ..\portable-node\npm.cmd install ws
)
cd ..

echo.
echo [INFO] All dependencies are installed.

REM === Kill any running servers ===
echo Killing any running servers...
if exist kill-servers.bat call kill-servers.bat

REM === Start backend and frontend ===
echo Starting backend and frontend servers...
if exist start-both.bat (
    call start-both.bat
) else (
    echo [ERROR] start-both.bat not found! Please start servers manually.
)
echo.
echo [SUCCESS] Application setup complete. Both backend and frontend should now be running.
pause 