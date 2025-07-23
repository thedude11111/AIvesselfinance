# 🎨 Render Deployment Guide

## Why Render for AI Vessel Finance?

- ✅ **Free tier available** - great for testing and demos
- ✅ **Auto-deploy from GitHub** - seamless CI/CD
- ✅ **Built-in SSL** - free HTTPS certificates
- ✅ **Multiple regions** - deploy closer to users
- ✅ **PostgreSQL included** - managed database option

## 🚀 Quick Setup

### Step 1: Create Render Account
1. Sign up at [render.com](https://render.com)
2. Connect your GitHub account

### Step 2: Create Services
Create two services:

#### Backend (Web Service)
- **Repository**: Your GitHub repo
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### Frontend (Static Site) 
- **Repository**: Your GitHub repo
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### Step 3: Environment Variables
Add to backend service:
- `NODE_ENV=production`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL` 
- `GOOGLE_AI_API_KEY`

### Step 4: Configure Frontend
Update frontend `.env.production`:
```env
REACT_APP_API_URL=https://your-backend-name.onrender.com/api
```

## 💰 Pricing

### Render Pricing
- **Free tier**: 
  - Web services sleep after 15min inactivity
  - 750 hours/month usage
  - Perfect for demos and testing

- **Starter ($7/month)**:
  - Always-on services
  - Custom domains
  - No sleep timer

### Your App Cost
- **Free**: $0 (with sleep limitation)
- **Production**: $14/month (2 starter services)

## 🎯 Benefits

1. **Free tier** - test without paying
2. **Simple setup** - GitHub integration
3. **Automatic HTTPS** - SSL certificates included
4. **Easy scaling** - upgrade when needed
5. **Built-in monitoring** - logs and metrics

## ⚠️ Considerations

- **Cold starts** on free tier (15min sleep)
- **Limited customization** compared to AWS/GCP
- **Fewer regions** than major cloud providers

## 📋 Perfect For

- **MVP testing** - validate your idea first
- **Demos** - show to investors/users
- **Small scale** - personal or small business use
- **Budget-conscious** - predictable pricing