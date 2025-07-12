# Vercel Deployment Guide for DishCraft Frontend

## Prerequisites
- Your backend is already deployed on Render at: `https://dishcraft-backend-3tk2.onrender.com`
- You have a Vercel account

## Deployment Steps

### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 2. Environment Variables Setup
In your Vercel dashboard, add the following environment variable:
- **Name**: `REACT_APP_BACKEND_URL`
- **Value**: `https://dishcraft-backend-3tk2.onrender.com`

### 3. Deploy to Vercel

#### Option A: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set the root directory to `frontend`
5. Add the environment variable mentioned above
6. Deploy

#### Option B: Using Vercel CLI
```bash
cd frontend
vercel
```

### 4. Build Configuration
The project is already configured with:
- `vercel.json` for routing and CORS headers
- Proper build scripts in `package.json`
- Environment variable usage in the code

### 5. Verify Deployment
After deployment, your app should:
- Load the homepage correctly
- Allow user registration/login
- Connect to your Render backend
- Handle all API calls properly

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your backend (on Render) has proper CORS configuration allowing requests from your Vercel domain.

### Environment Variables
Make sure `REACT_APP_BACKEND_URL` is set correctly in your Vercel environment variables.

### Build Errors
If build fails, check:
1. All dependencies are in `package.json`
2. No syntax errors in the code
3. Environment variables are properly configured

## Backend Configuration
Ensure your Render backend has CORS configured to allow requests from your Vercel domain:
```javascript
app.use(cors({
  origin: ['https://your-vercel-domain.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
``` 