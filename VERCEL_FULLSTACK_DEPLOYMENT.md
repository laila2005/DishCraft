# 🚀 DishCraft Full-Stack Vercel Deployment Guide

## Overview
This guide will help you deploy your entire DishCraft application (both frontend and backend) on Vercel as a full-stack application.

## 🎯 Benefits of Full-Stack Vercel Deployment

- ✅ **Single Domain**: Both frontend and backend on the same domain
- ✅ **No CORS Issues**: No need to configure CORS between different domains
- ✅ **Simplified Deployment**: One deployment for the entire application
- ✅ **Better Performance**: Reduced latency between frontend and backend
- ✅ **Cost Effective**: Single hosting solution

## 📁 Project Structure for Vercel

```
DishCraft/
├── api/
│   └── index.js              # Vercel serverless function (backend)
├── frontend/                 # React frontend
├── backend/                  # Original backend (for reference)
├── vercel.json              # Vercel configuration
├── package.json             # Root dependencies
└── .env                     # Environment variables
```

## 🔧 Configuration Files

### 1. Root `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

### 2. API Routes (`api/index.js`)
- Serverless function that handles all backend logic
- Connects to MongoDB
- Handles all API endpoints

### 3. Frontend Configuration
- Updated to use relative URLs for API calls
- No need for separate backend URL in production

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository
```bash
# Make sure all changes are committed
git add .
git commit -m "Configure full-stack Vercel deployment"
git push
```

### Step 2: Deploy to Vercel

#### Option A: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. **Important**: Set the root directory to the project root (not frontend)
5. Add environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - Any other environment variables from your backend

#### Option B: Vercel CLI
```bash
# From the project root
vercel --prod
```

### Step 3: Set Environment Variables
In your Vercel dashboard, add these environment variables:

**Required:**
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key

**Optional (if you use them):**
- `EMAIL_USER`: Email service username
- `EMAIL_PASS`: Email service password
- `RESEND_API_KEY`: Resend API key for emails

### Step 4: Test Your Application
After deployment, test:
- [ ] Frontend loads correctly
- [ ] API endpoints work (`/api/health`)
- [ ] User registration and login
- [ ] Recipe functionality
- [ ] All features work as expected

## 🔍 Troubleshooting

### Common Issues

#### 1. Build Errors
**Solution**: Check that all dependencies are in the root `package.json`

#### 2. API Not Found
**Solution**: Ensure `api/index.js` exists and exports the Express app

#### 3. Database Connection Issues
**Solution**: Verify `MONGO_URI` is set correctly in Vercel environment variables

#### 4. CORS Errors
**Solution**: CORS should be configured in `api/index.js` for your domain

### Debug Steps
1. Check Vercel build logs
2. Test API endpoints directly
3. Verify environment variables
4. Check MongoDB connection

## 🌐 Your Application URLs

After deployment, your application will be available at:
- **Main App**: `https://your-vercel-domain.vercel.app`
- **API**: `https://your-vercel-domain.vercel.app/api`
- **Health Check**: `https://your-vercel-domain.vercel.app/api/health`

## 📊 Performance Considerations

### Vercel Limitations
- **Function Timeout**: 10 seconds (Hobby), 60 seconds (Pro)
- **Payload Size**: 4.5MB (Hobby), 50MB (Pro)
- **Cold Starts**: Serverless functions may have cold start delays

### Optimizations
- Use connection pooling for MongoDB
- Implement caching where possible
- Optimize image uploads
- Use CDN for static assets

## 🔄 Migration from Separate Deployments

If you're migrating from separate frontend/backend deployments:

1. **Update Frontend URLs**: Remove hardcoded backend URLs
2. **Test All Features**: Ensure everything works with the new setup
3. **Update Documentation**: Update any external links
4. **Monitor Performance**: Check for any performance changes

## 🎉 Success Indicators

Your full-stack deployment is successful when:
- ✅ Frontend loads without errors
- ✅ API endpoints respond correctly
- ✅ Database operations work
- ✅ User authentication functions
- ✅ All features work as expected
- ✅ No CORS errors in console

---

**Ready to deploy your full-stack application on Vercel!** 🚀 