@echo off
REM DishCraft Frontend Deployment Script for Vercel (Windows)

echo 🚀 Starting DishCraft Frontend Deployment to Vercel...

REM Check if we're in the frontend directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the frontend directory
    pause
    exit /b 1
)

REM Check if vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

REM Check if .env file exists, if not create one
if not exist ".env" (
    echo 📝 Creating .env file...
    echo REACT_APP_BACKEND_URL=https://dishcraft-backend-3tk2.onrender.com > .env
    echo ✅ Created .env file with backend URL
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the project
echo 🔨 Building the project...
npm run build

if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
) else (
    echo ✅ Build successful!
)

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod

echo 🎉 Deployment complete!
echo 📋 Don't forget to:
echo    1. Set REACT_APP_BACKEND_URL environment variable in Vercel dashboard
echo    2. Update your backend CORS settings to allow your Vercel domain
echo    3. Test all functionality after deployment

pause 