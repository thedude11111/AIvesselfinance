# 🚂 Railway Deployment Guide

## Why Railway for AI Vessel Finance?

- ✅ **Git-based deployment** - connect GitHub and auto-deploy
- ✅ **No Docker needed** - handles containerization automatically
- ✅ **Built-in databases** - PostgreSQL, Redis available
- ✅ **Environment variables** - easy management in dashboard
- ✅ **Custom domains** - free SSL certificates

## 🚀 Quick Setup

### Step 1: Connect GitHub
1. Sign up at [railway.app](https://railway.app)
2. Connect your GitHub account
3. Select your repository

### Step 2: Deploy Services
Railway will detect your services automatically:
- **Backend**: Node.js service (auto-detected from package.json)
- **Frontend**: Static site (auto-detected from Vite build)

### Step 3: Configure Environment Variables
Add in Railway dashboard:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY` 
- `FIREBASE_CLIENT_EMAIL`
- `GOOGLE_AI_API_KEY`
- `NODE_ENV=production`

### Step 4: Set Up Database (Optional)
```bash
# Add PostgreSQL if you want to migrate from Firestore
railway add postgresql
```

## 💰 Pricing

### Railway Pricing
- **Starter**: $5/month per service
- **Pro**: $20/month with more resources

### Your App Cost
- **Backend service**: $5/month
- **Frontend service**: $5/month  
- **Total**: $10/month

## 🎯 Benefits

1. **Simplest deployment** - just connect GitHub
2. **Auto-scaling** - handles traffic automatically
3. **No cold starts** - always warm instances
4. **Built-in monitoring** - logs and metrics included
5. **Easy rollbacks** - deploy any git commit

## 📋 Deployment Steps

1. Push code to GitHub
2. Connect Railway to your repo
3. Add environment variables
4. Railway automatically builds and deploys
5. Get production URLs instantly

**Deployment time: 5-10 minutes**