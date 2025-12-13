@echo off
echo Starting API Roulette Servers...

REM Kill any existing processes on port 3002
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
    if not "%%a"=="0" (
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Start backend server
echo Starting backend server on port 3002...
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
echo Starting frontend server on port 5173...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Servers starting...
echo Backend: http://localhost:3002
echo Frontend: http://localhost:5173
echo.
pause