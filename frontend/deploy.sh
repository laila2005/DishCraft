#!/bin/bash

# DishCraft Frontend Deployment Script for Vercel

echo "🚀 Starting DishCraft Frontend Deployment to Vercel..."

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if .env file exists, if not create one
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    echo "REACT_APP_BACKEND_URL=https://dishcraft-backend-3tk2.onrender.com" > .env
    echo "✅ Created .env file with backend URL"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo "📋 Don't forget to:"
echo "   1. Set REACT_APP_BACKEND_URL environment variable in Vercel dashboard"
echo "   2. Update your backend CORS settings to allow your Vercel domain"
echo "   3. Test all functionality after deployment" 