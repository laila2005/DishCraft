# 🚀 DishCraft Vercel Deployment Guide

## Overview
This guide will help you deploy your DishCraft frontend to Vercel while keeping your backend on Render. The setup ensures seamless communication between the frontend and backend.

## 📋 Prerequisites
- ✅ Backend deployed on Render at: `https://dishcraft-backend-3tk2.onrender.com`
- ✅ Vercel account (free tier available)
- ✅ GitHub repository with your code

## 🔧 What's Been Configured

### 1. Frontend Configuration Files
- ✅ `vercel.json` - Vercel routing and CORS configuration
- ✅ Updated `package.json` with proper build scripts
- ✅ Environment variable usage throughout the codebase
- ✅ Updated `index.html` with proper title and description

### 2. Deployment Scripts
- ✅ `deploy.sh` (Mac/Linux)
- ✅ `deploy.bat` (Windows)
- ✅ `DEPLOYMENT.md` with detailed instructions

## 🚀 Quick Start Deployment

### Option 1: Automated Script (Recommended)

#### Windows:
```bash
cd frontend
deploy.bat
```

#### Mac/Linux:
```bash
cd frontend
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Steps

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variable:**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add environment variable:
     - **Name**: `REACT_APP_BACKEND_URL`
     - **Value**: `https://dishcraft-backend-3tk2.onrender.com`

### Option 3: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `frontend`
5. Add environment variable: `REACT_APP_BACKEND_URL=https://dishcraft-backend-3tk2.onrender.com`
6. Deploy

## 🔍 Post-Deployment Checklist

### 1. Environment Variables
- [ ] `REACT_APP_BACKEND_URL` is set to your Render backend URL
- [ ] Variable is available in production environment

### 2. Backend CORS Configuration
Update your Render backend to allow requests from your Vercel domain:

```javascript
// In your backend server.js or app.js
const cors = require('cors');

app.use(cors({
  origin: [
    'https://dish-craft-a6mh.vercel.app',  // Your Vercel domain
    'http://localhost:3000'  // For local development
  ],
  credentials: true
}));
```

**✅ Already Updated:** Your backend CORS configuration has been updated to include your Vercel domain.

### 3. Functionality Testing
Test these features after deployment:
- [ ] User registration and login
- [ ] Recipe browsing and search
- [ ] Chef dashboard (if you have chef accounts)
- [ ] Recipe saving and rating
- [ ] Contact form
- [ ] Profile management

## 🛠️ Troubleshooting

### Common Issues

#### 1. CORS Errors
**Symptoms:** Browser console shows CORS errors
**Solution:** Update backend CORS settings to include your Vercel domain

#### 2. API Connection Failed
**Symptoms:** Frontend can't connect to backend
**Solution:** 
- Verify `REACT_APP_BACKEND_URL` is set correctly
- Check that your Render backend is running
- Test API endpoints directly

#### 3. Build Errors
**Symptoms:** Vercel build fails
**Solution:**
- Check for syntax errors in the code
- Verify all dependencies are in `package.json`
- Check Vercel build logs for specific errors

#### 4. Environment Variables Not Working
**Symptoms:** App uses localhost instead of production backend
**Solution:**
- Verify environment variable is set in Vercel dashboard
- Check variable name spelling (must start with `REACT_APP_`)
- Redeploy after adding environment variables

### Debug Steps

1. **Check Browser Console:**
   - Open developer tools
   - Look for errors in Console tab
   - Check Network tab for failed requests

2. **Verify Environment Variables:**
   ```javascript
   // Add this temporarily to check
   console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);
   ```

3. **Test API Endpoints:**
   - Use Postman or curl to test backend directly
   - Verify backend is responding correctly

4. **Check Vercel Logs:**
   - Go to Vercel dashboard
   - Check deployment logs for errors
   - Verify build process completed successfully

## 📞 Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **React Deployment Guide:** https://create-react-app.dev/docs/deployment/
- **CORS Configuration:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Frontend loads without errors
- ✅ User can register/login
- ✅ Recipes load from backend
- ✅ All API calls work properly
- ✅ No CORS errors in console
- ✅ Responsive design works on all devices

## 🔄 Updates and Maintenance

### Updating the Frontend
1. Make changes to your code
2. Commit and push to GitHub
3. Vercel will automatically redeploy (if connected to GitHub)
4. Or manually redeploy using `vercel --prod`

### Updating Environment Variables
1. Go to Vercel dashboard
2. Navigate to project settings
3. Update environment variables
4. Redeploy the project

---

**Need Help?** Check the troubleshooting section above or refer to the detailed documentation in `frontend/DEPLOYMENT.md` 