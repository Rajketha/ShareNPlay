@echo off
rem Temporary: test backend directly with PORT=5000 env var
cd /d %~dp0backend
set PORT=5000
node server.js
