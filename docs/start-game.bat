@echo off
echo.
echo ========================================
echo    DEV TYCOON - Starting Game Services
echo ========================================
echo.

echo [1/3] Starting Backend Server...
start "Dev Tycoon - Backend API" cmd /k "cd /d D:\dev-tycoon\backend && php artisan serve"
timeout /t 2 /nobreak >nul

echo [2/3] Starting Game Scheduler...
start "Dev Tycoon - Scheduler" cmd /k "cd /d D:\dev-tycoon\backend && php artisan schedule:work"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend...
start "Dev Tycoon - Frontend" cmd /k "cd /d D:\dev-tycoon\frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo    All services started successfully!
echo ========================================
echo.
echo Backend:   http://localhost:8000
echo Frontend:  http://localhost:3000
echo Scheduler: Running in background
echo.
echo Press any key to close this window...
pause >nul

