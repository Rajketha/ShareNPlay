@echo off
REM === Kill any running Node.js servers ===
echo Stopping any running Node.js servers...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✓ Node.js processes stopped
) else (
    echo No Node.js processes found
)
echo.

REM === Set up paths ===
set NODE_EXE=%~dp0portable-node\node.exe
set NPM_CLI=%~dp0portable-node\node_modules\npm\bin\npm-cli.js

REM === Check for portable Node.js ===
if not exist "%NODE_EXE%" (
    echo ERROR: Portable Node.js not found in portable-node
    pause
    exit /b 1
)
if not exist "%NPM_CLI%" (
    echo ERROR: npm-cli.js not found in portable-node
    pause
    exit /b 1
)

REM === Install backend dependencies ===
echo.
echo Installing backend dependencies...
cd backend
"%NODE_EXE%" "%NPM_CLI%" install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed in backend!
    pause
    exit /b 1
)
cd ..
echo Backend dependencies installed.
pause

REM === Install frontend dependencies ===
echo.
echo Installing frontend dependencies...
cd frontend
"%NODE_EXE%" "%NPM_CLI%" install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed in frontend!
    pause
    exit /b 1
)
cd ..
echo Frontend dependencies installed.
pause

REM === Start backend and frontend servers ===
echo.
echo Starting backend and frontend servers in new windows...
start "ShareNPlay Backend" cmd /k "cd backend && ..\portable-node\node.exe ..\portable-node\node_modules\npm\bin\npm-cli.js start"
timeout /t 3 /nobreak >nul
start "ShareNPlay Frontend" cmd /k "cd frontend && ..\portable-node\node.exe ..\portable-node\node_modules\npm\bin\npm-cli.js start"

echo.
echo All done! Both backend and frontend should now be running.
pause 