@echo off
REM DishCraft Full-Stack Vercel Deployment Script (Windows)

echo 🚀 Starting DishCraft Full-Stack Deployment to Vercel...

REM Check if we're in the project root
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

REM Install dependencies
echo 📦 Installing dependencies...
npm run install:all

REM Build the frontend
echo 🔨 Building the frontend...
cd frontend
npm run build
cd ..

if errorlevel 1 (
    echo ❌ Frontend build failed!
    pause
    exit /b 1
) else (
    echo ✅ Frontend build successful!
)

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod

echo 🎉 Deployment complete!
echo 📋 Don't forget to:
echo    1. Set environment variables in Vercel dashboard:
echo       - MONGO_URI: Your MongoDB connection string
echo       - JWT_SECRET: Your JWT secret key
echo       - Any other backend environment variables
echo    2. Test your application at the provided URL
echo    3. Check that both frontend and API endpoints work

pause 