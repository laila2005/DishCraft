# DishCraft Frontend

A React-based frontend for the DishCraft recipe platform, designed to work with a Node.js backend deployed on Render.

## 🚀 Quick Deployment to Vercel

### Prerequisites
- Your backend is deployed on Render at: `https://dishcraft-backend-3tk2.onrender.com`
- You have a Vercel account

### Option 1: Automated Deployment (Recommended)

#### For Windows Users:
```bash
cd frontend
deploy.bat
```

#### For Mac/Linux Users:
```bash
cd frontend
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Set Environment Variables:**
   In your Vercel dashboard, add:
   - **Name**: `REACT_APP_BACKEND_URL`
   - **Value**: `https://dishcraft-backend-3tk2.onrender.com`

3. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

### Option 3: Vercel Dashboard Deployment

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set the root directory to `frontend`
5. Add the environment variable: `REACT_APP_BACKEND_URL=https://dishcraft-backend-3tk2.onrender.com`
6. Deploy

## 🔧 Configuration Files

- `vercel.json` - Vercel configuration for routing and CORS
- `package.json` - Dependencies and build scripts
- Environment variables handled through Vercel dashboard

## 🌐 Backend Integration

The frontend communicates with your Render backend using the `REACT_APP_BACKEND_URL` environment variable. Make sure your backend has proper CORS configuration:

```javascript
app.use(cors({
  origin: ['https://your-vercel-domain.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts (Auth, Alert)
│   ├── App.js         # Main app component
│   └── index.js       # Entry point
├── public/            # Static assets
├── vercel.json        # Vercel configuration
├── package.json       # Dependencies
└── deploy.sh          # Deployment script
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🔍 Troubleshooting

### CORS Issues
- Ensure your backend CORS settings include your Vercel domain
- Check that `REACT_APP_BACKEND_URL` is set correctly

### Build Errors
- Verify all dependencies are installed
- Check for syntax errors in the code
- Ensure environment variables are configured

### API Connection Issues
- Verify the backend URL is correct
- Check that your Render backend is running
- Ensure proper authentication tokens are being sent

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify environment variables in Vercel dashboard
3. Test API endpoints directly
4. Check backend logs on Render

## 🎯 Features

- User authentication and registration
- Recipe discovery and creation
- Chef dashboard for recipe management
- User profiles and saved recipes
- Contact form and about page
- Responsive design for all devices
