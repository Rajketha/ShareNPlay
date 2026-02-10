<<<<<<< HEAD
@echo off
echo Installing dependencies for backend...
cd backend
npm install
cd ..
echo.
echo Installing dependencies for frontend...
cd frontend
npm install
cd ..
echo.
echo Killing all running servers...
call kill-servers.bat
echo.
echo Restarting backend and frontend servers...
call start-both.bat
echo.
echo All done! Both backend and frontend should now be running and connected.
=======
@echo off
echo Installing dependencies for backend...
cd backend
npm install
cd ..
echo.
echo Installing dependencies for frontend...
cd frontend
npm install
cd ..
echo.
echo Killing all running servers...
call kill-servers.bat
echo.
echo Restarting backend and frontend servers...
call start-both.bat
echo.
echo All done! Both backend and frontend should now be running and connected.
>>>>>>> 51a304f (Upload all project files and scripts for portable setup)
pause 