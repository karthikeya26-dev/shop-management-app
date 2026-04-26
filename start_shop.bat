@echo off
title Cloud-Native Shop Manager Launcher
echo =======================================================
echo    Booting Cloud-Native Shop Management Platform
echo =======================================================
echo.

echo [1/2] Starting Python Flask Backend Server (Port 5000)...
start "Backend API Server" cmd /k "cd backend && pip install -r requirements.txt && python app.py"

echo [2/2] Starting React Vite Frontend Server (Port 5173/5174)...
start "Frontend React Server" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo =======================================================
echo    SUCCESS! Both servers are booting up.
echo    Two new black terminal windows have been opened.
echo    DO NOT close them while you want the app running!
echo =======================================================
echo.
pause
