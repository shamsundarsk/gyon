@echo off
echo ========================================
echo    GYON - Cloud Deployment Preparation
echo ========================================

echo.
echo [1/4] Testing Frontend Build...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependencies failed
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo ✅ Frontend build successful!

echo.
echo [2/4] Testing Backend Build...
cd ../backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend dependencies failed
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    pause
    exit /b 1
)
echo ✅ Backend build successful!

echo.
echo [3/4] Checking Git Status...
cd ..
git status
echo.

echo [4/4] Deployment Checklist:
echo.
echo ✅ Frontend builds successfully
echo ✅ Backend builds successfully
echo.
echo 📋 Next Steps:
echo    1. Push code to GitHub: git add . && git commit -m "Ready for deployment" && git push
echo    2. Deploy backend to Railway (follow CLOUD_DEPLOYMENT_STEPS.md)
echo    3. Deploy frontend to Vercel
echo    4. Connect them together
echo.
echo 📖 Full guide: CLOUD_DEPLOYMENT_STEPS.md
echo.
pause