# 🚀 Cloud Deployment: Step-by-Step Guide

## Overview
We'll deploy:
- **Frontend** → Vercel (Free tier)
- **Backend** → Railway (Free tier)

## 📋 Prerequisites Checklist

- [ ] GitHub account
- [ ] Vercel account (sign up at vercel.com)
- [ ] Railway account (sign up at railway.app)
- [ ] Your code pushed to GitHub

---

## 🎯 **STEP 1: Push Code to GitHub**

### 1.1 Initialize Git (if not already done)
```bash
cd api_roueltte-main
git init
git add .
git commit -m "Initial commit - Gyon application ready for deployment"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com
2. Click "New repository"
3. Name it: `gyon-app`
4. Make it **Public** (required for free Vercel)
5. Click "Create repository"

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/gyon-app.git
git branch -M main
git push -u origin main
```

---

## 🚂 **STEP 2: Deploy Backend to Railway**

### 2.1 Sign Up for Railway
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub

### 2.2 Deploy Backend
1. Click "Deploy from GitHub repo"
2. Select your `gyon-app` repository
3. Railway will auto-detect it's a Node.js app
4. Click "Deploy"

### 2.3 Configure Environment Variables
1. Go to your project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add these variables:

```
NODE_ENV=production
PORT=3002
CORS_ORIGIN=https://gyon-YOUR_USERNAME.vercel.app
OLLAMA_URL=disabled
OLLAMA_MODEL=llama3
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
JWT_SECRET=your-super-secret-jwt-key-12345
SESSION_SECRET=your-super-secret-session-key-67890
```

### 2.4 Get Your Backend URL
1. In Railway dashboard, go to "Settings"
2. Copy the "Public Domain" URL
3. It will look like: `https://gyon-backend-production.up.railway.app`
4. **Save this URL** - you'll need it for Vercel!

---

## 🔺 **STEP 3: Deploy Frontend to Vercel**

### 3.1 Sign Up for Vercel
1. Go to https://vercel.com
2. Click "Sign up"
3. Sign up with GitHub

### 3.2 Import Project
1. Click "New Project"
2. Import your `gyon-app` repository
3. Vercel will auto-detect it's a Vite app

### 3.3 Configure Build Settings
**Framework Preset**: Vite
**Root Directory**: `frontend`
**Build Command**: `npm run build`
**Output Directory**: `dist`
**Install Command**: `npm install`

### 3.4 Add Environment Variables
In Vercel project settings, add:
```
VITE_APP_NAME=Gyon
VITE_APP_VERSION=1.0.0
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_CODE_EDITOR=true
VITE_ENABLE_PROJECT_SHARING=true
VITE_ENABLE_BRAINSTORM=true
```

### 3.5 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Get your frontend URL (e.g., `https://gyon-YOUR_USERNAME.vercel.app`)

---

## 🔗 **STEP 4: Connect Frontend and Backend**

### 4.1 Update Railway CORS
1. Go back to Railway
2. Update the `CORS_ORIGIN` variable with your actual Vercel URL:
   ```
   CORS_ORIGIN=https://gyon-YOUR_USERNAME.vercel.app
   ```

### 4.2 Update Vercel Rewrites
1. In your local code, update `vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://YOUR_ACTUAL_RAILWAY_URL/api/$1"
       }
     ]
   }
   ```
2. Commit and push changes
3. Vercel will auto-redeploy

---

## ✅ **STEP 5: Test Your Deployment**

### 5.1 Test Frontend
1. Visit your Vercel URL
2. Check if the landing page loads
3. Try the "Start Building" button

### 5.2 Test Backend Connection
1. Open browser dev tools (F12)
2. Try generating a project
3. Check Network tab for API calls

### 5.3 Test Full Flow
1. Generate a random project
2. Check if turtle/rabbit animation works
3. Try downloading a project
4. Test the code editor

---

## 🎉 **STEP 6: You're Live!**

Your Gyon application is now deployed and accessible worldwide!

**URLs:**
- **Frontend**: https://gyon-YOUR_USERNAME.vercel.app
- **Backend**: https://YOUR_RAILWAY_URL.railway.app

---

## 🔧 **Troubleshooting**

### Common Issues:

1. **CORS Errors**
   - Make sure Railway `CORS_ORIGIN` matches your Vercel URL exactly

2. **Build Failures**
   - Check build logs in Vercel/Railway dashboards
   - Ensure all dependencies are in package.json

3. **API Not Working**
   - Verify the rewrite URL in vercel.json
   - Check Railway logs for backend errors

4. **AI Features Not Working**
   - This is expected on free tiers (Ollama requires dedicated server)
   - The app will work without AI features

### Getting Help:
- Check deployment logs in both platforms
- Use browser dev tools to debug
- Check the GitHub repository for issues

---

## 💡 **Next Steps**

1. **Custom Domain**: Add your own domain in Vercel settings
2. **Analytics**: Add Google Analytics or similar
3. **Monitoring**: Set up error tracking with Sentry
4. **AI Features**: Deploy Ollama on a dedicated server if needed
5. **Database**: Add PostgreSQL for user data (Railway provides free DB)

---

**🎊 Congratulations! Your Gyon app is now live on the internet! 🎊**