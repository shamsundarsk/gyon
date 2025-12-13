@echo off
echo ========================================
echo    GYON - Local Production Deployment
echo ========================================

echo.
echo [1/6] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend dependency installation failed
    pause
    exit /b 1
)

echo.
echo [2/6] Building Backend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    pause
    exit /b 1
)

echo.
echo [3/6] Installing Frontend Dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependency installation failed
    pause
    exit /b 1
)

echo.
echo [4/6] Building Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)

echo.
echo [5/6] Setting up Environment...
cd ..
if not exist "backend\.env" (
    echo Creating backend .env file...
    echo PORT=3002> backend\.env
    echo NODE_ENV=production>> backend\.env
    echo CORS_ORIGIN=http://localhost:4173>> backend\.env
    echo OLLAMA_URL=http://localhost:11434>> backend\.env
    echo OLLAMA_MODEL=llama3>> backend\.env
)

echo.
echo [6/6] Starting Production Servers...
echo.
echo ✅ Build Complete! 
echo.
echo 📋 Next Steps:
echo    1. Start Backend: cd backend && npm start
echo    2. Start Frontend: cd frontend && npm run preview
echo    3. Visit: http://localhost:4173
echo.
echo 🔧 Optional: Install Ollama for AI features
echo    Download from: https://ollama.ai
echo    Run: ollama pull llama3
echo.
pause