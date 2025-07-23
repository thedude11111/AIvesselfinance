# 🚂 Railway Deployment Guide - AI Vessel Finance

## 🎯 **Quick Start (15 minutes to live app)**

### Step 1: Push to GitHub (if not already there)
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Prepare for Railway deployment"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR-USERNAME/AIvesselfinance.git
git push -u origin main
```

### Step 2: Deploy to Railway
1. **Go to [railway.app](https://railway.app)**
2. **Sign up** with GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your `AIvesselfinance` repository**

### Step 3: Configure Services
Railway will detect both services automatically:

#### Backend Service
- **Service Name**: `ai-vessel-backend`
- **Root Directory**: `/backend` (Railway auto-detects)
- **Build Command**: `npm ci` (auto-detected)
- **Start Command**: `npm start` (auto-detected)

#### Frontend Service  
- **Service Name**: `ai-vessel-frontend`
- **Root Directory**: `/frontend` (Railway auto-detects)
- **Build Command**: `npm ci && npm run build` (auto-detected)
- **Static Files**: `dist` folder (auto-detected)

### Step 4: Add Environment Variables

#### Backend Variables (in Railway dashboard)
```env
NODE_ENV=production
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_AI_API_KEY=your-gemini-api-key
```

#### Frontend Variables (in Railway dashboard)
```env
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### Step 5: Connect Services
1. **Get your backend URL** from Railway dashboard (e.g., `https://ai-vessel-backend-production.up.railway.app`)
2. **Add to frontend variables**:
   ```env
   REACT_APP_API_URL=https://your-backend-url.up.railway.app/api
   ```
3. **Get your frontend URL** and **add to backend variables**:
   ```env
   CORS_ORIGIN=https://your-frontend-url.up.railway.app
   ```

## 📋 **Detailed Setup Instructions**

### Railway Project Structure
```
Your Railway Project
├── ai-vessel-backend (Node.js Service)
│   ├── Source: /backend
│   ├── Port: Auto-assigned by Railway
│   └── Health Check: /health
└── ai-vessel-frontend (Static Site)
    ├── Source: /frontend  
    ├── Build: npm run build
    └── Static Files: /dist
```

### Environment Variable Setup

#### Where to Add Variables
1. **Railway Dashboard** → **Your Project** → **Service** → **Variables**
2. **Add each variable individually**
3. **Railway will restart services automatically**

#### Backend Environment Variables
| Variable | Example Value | Required |
|----------|--------------|----------|
| `NODE_ENV` | `production` | ✅ |
| `FIREBASE_PROJECT_ID` | `your-project-123` | ✅ |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | ✅ |
| `FIREBASE_CLIENT_EMAIL` | `service@project.iam.gserviceaccount.com` | ✅ |
| `GOOGLE_AI_API_KEY` | `AIza...` | ✅ |
| `CORS_ORIGIN` | `https://frontend-url.up.railway.app` | ✅ |

#### Frontend Environment Variables  
| Variable | Example Value | Required |
|----------|--------------|----------|
| `REACT_APP_API_URL` | `https://backend-url.up.railway.app/api` | ✅ |
| `REACT_APP_FIREBASE_API_KEY` | `AIza...` | ✅ |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | `project.firebaseapp.com` | ✅ |
| `REACT_APP_FIREBASE_PROJECT_ID` | `your-project-123` | ✅ |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | `project.appspot.com` | ✅ |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | ✅ |
| `REACT_APP_FIREBASE_APP_ID` | `1:123:web:abc123` | ✅ |

### Firebase Configuration Required

#### 1. Enable Firestore Database
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. **Firestore Database** → **Create database**
4. **Start in test mode** → **Choose location**

#### 2. Enable Authentication
1. **Authentication** → **Get started**
2. **Sign-in method** → **Google** → **Enable**
3. **Add authorized domain**: `your-frontend-url.up.railway.app`

#### 3. Get Configuration Values
1. **Project Settings** → **General** → **Your apps**
2. **Web app** → **Config** → Copy all values

## 🚀 **Deployment Process**

### Automatic Deployment
- **Every git push** triggers automatic deployment
- **Build logs** visible in Railway dashboard
- **Zero downtime** deployments
- **Automatic rollback** on build failures

### Manual Deployment
```bash
# Push changes to trigger deployment
git add .
git commit -m "Update app"
git push origin main
```

### Deployment Timeline
1. **Code push**: 0 seconds
2. **Build start**: ~30 seconds
3. **Backend deploy**: ~2-3 minutes
4. **Frontend deploy**: ~1-2 minutes
5. **Live app**: ~5 minutes total

## 💰 **Railway Pricing**

### Starter Plan ($5/month per service)
- **2 services needed**: Backend + Frontend
- **Total cost**: $10/month
- **Includes**:
  - Always-on services (no cold starts)
  - Custom domains
  - Automatic SSL
  - 500GB bandwidth
  - Build minutes included

### Usage-Based Pricing
- **$0.000463 per GB-hour** for memory
- **$0.000463 per vCPU-hour** for CPU
- **$0.10 per GB** for bandwidth

### Estimated Monthly Cost
- **Light usage**: $10-15/month
- **Moderate usage**: $15-25/month
- **Heavy usage**: $25-50/month

## 🔧 **Railway Features You Get**

### Automatic Features
- ✅ **HTTPS/SSL** - Automatic certificates
- ✅ **Custom domains** - Connect your domain
- ✅ **Environment variables** - Secure credential management
- ✅ **Build logs** - Real-time deployment logs
- ✅ **Metrics** - CPU, memory, network monitoring
- ✅ **Health checks** - Automatic service monitoring

### Developer Experience
- ✅ **GitHub integration** - Auto-deploy on push
- ✅ **Preview deployments** - Test before production
- ✅ **Rollback** - Deploy any previous version
- ✅ **CLI tools** - Railway CLI for advanced usage
- ✅ **Database add-ons** - PostgreSQL, Redis available

## 🎯 **Testing Your Deployment**

### Health Checks
- **Backend**: `https://your-backend-url.up.railway.app/health`
- **Frontend**: `https://your-frontend-url.up.railway.app`

### Functionality Tests
1. **Sign in** with Google account
2. **Send AI message**: "I want a 10-year-old container vessel for $25M"
3. **Check parameters** populate correctly
4. **Add financing**: "20% down, 10-year loan"
5. **Run analysis** and view results

## 🚨 **Troubleshooting**

### Common Issues

#### Build Failures
- **Check build logs** in Railway dashboard
- **Verify package.json** scripts are correct
- **Check environment variables** are set

#### API Connection Issues
- **Verify CORS_ORIGIN** matches frontend URL exactly
- **Check REACT_APP_API_URL** points to backend
- **Ensure both services are deployed**

#### Firebase Errors
- **Verify all Firebase variables** are set correctly
- **Check Firestore** is enabled
- **Confirm Authentication** is configured

### Debug Commands
```bash
# Check Railway CLI
npm install -g @railway/cli
railway login
railway status

# View logs
railway logs
```

## 🎉 **Success Checklist**

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Both services deployed successfully  
- [ ] Environment variables configured
- [ ] Firebase/Firestore enabled
- [ ] CORS configured between services
- [ ] Health checks passing
- [ ] App functionality tested
- [ ] Custom domain configured (optional)

## 📞 **Support**

### Railway Resources
- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord**: Railway community support
- **GitHub**: Railway examples and templates

### Your App URLs (after deployment)
- **Frontend**: `https://your-frontend-name.up.railway.app`
- **Backend**: `https://your-backend-name.up.railway.app`
- **API Health**: `https://your-backend-name.up.railway.app/health`

---

## 🚀 **Ready to Deploy?**

**Estimated time**: 15-30 minutes for first deployment

**Next steps**:
1. Push code to GitHub
2. Sign up at railway.app
3. Connect your repository
4. Add environment variables
5. Watch your app go live!

**Your app will be accessible worldwide with automatic HTTPS and no server management required!**