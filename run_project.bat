@echo off
title ShareNPlay Automator
echo 🚀 Starting ShareNPlay Setup...

 1. Install root dependencies
echo 📦 Installing root dependencies...
call npm install
if %errorlevel% neq 0 pause

 2. Install all sub-packages (Missing Nothing)
echo 📦 Installing Frontend and Backend packages...
call npm run installall
if %errorlevel% neq 0 pause

 3. Build the Production UI
echo 🏗️  Building Production UI with Toast Notifications...
call npm run buildall
if %errorlevel% neq 0 pause

 4. Start the Unified Server
echo 🔥 Launching Production Server on Port 5000...
npm start --prefix backend
pause