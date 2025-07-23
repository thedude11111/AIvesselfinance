# 🚀 Deployment Scripts

This directory contains scripts to deploy your AI Vessel Finance app to Google Cloud.

## 📋 Prerequisites

1. **Google Cloud CLI** installed and configured
2. **Docker** installed (for local testing)
3. **Google Cloud Project** with billing enabled
4. **Firebase Project** set up with Firestore and Authentication

## 🎯 Quick Start

### Step 1: Create Google Cloud Project (when quota available)
```bash
# Update PROJECT_ID in setup-project.sh first
./setup-project.sh
```

### Step 2: Configure Environment Variables
1. Copy environment templates:
   ```bash
   cp ../backend/.env.production.template ../backend/.env.production
   cp ../frontend/.env.production.template ../frontend/.env.production
   ```

2. Fill in your actual values in both `.env.production` files

### Step 3: Deploy to Cloud Run
```bash
# Update PROJECT_ID in deploy-to-cloud-run.sh first
./deploy-to-cloud-run.sh
```

## 📁 Files Overview

### `setup-project.sh` / `setup-project.bat`
- Creates Google Cloud project
- Enables required APIs
- Sets up service accounts
- Provides setup instructions for Firebase

### `deploy-to-cloud-run.sh` / `deploy-to-cloud-run.bat`
- Deploys backend and frontend to Cloud Run
- Configures CORS automatically
- Provides deployment URLs

### Environment Templates
- `..backend/.env.production.template` - Backend environment variables
- `../frontend/.env.production.template` - Frontend environment variables

## 🔧 Configuration Required

### Backend Environment Variables
```env
NODE_ENV=production
PORT=8080
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_AI_API_KEY=your-gemini-api-key
CORS_ORIGIN=https://your-frontend-url.run.app
```

### Frontend Environment Variables
```env
REACT_APP_API_URL=https://your-backend-url.run.app/api
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

## 🛠️ Manual Steps Required

1. **Enable Billing** in Google Cloud Console
2. **Set up Firestore Database** in Firebase Console
3. **Enable Google Authentication** in Firebase Console
4. **Get Firebase Web Config** from Firebase Console settings
5. **Get Service Account Key** for backend authentication

## 💰 Cost Estimation

### Cloud Run Pricing (Pay-per-use)
- **CPU**: $0.000024 per vCPU-second
- **Memory**: $0.0000025 per GB-second
- **Requests**: $0.40 per million requests

### Estimated Monthly Costs
- **Light usage** (< 1000 requests/month): $5-15
- **Moderate usage** (10K requests/month): $20-50
- **Heavy usage** (100K requests/month): $50-150

## 🔍 Monitoring

### Health Checks
- Backend: `https://your-backend-url.run.app/health`
- Frontend: `https://your-frontend-url.run.app/health`

### Logs
```bash
# View backend logs
gcloud logs read --service=ai-vessel-backend

# View frontend logs
gcloud logs read --service=ai-vessel-frontend
```

## 🚨 Troubleshooting

### Common Issues

1. **Port 8080 Required**: Cloud Run requires applications to listen on port 8080
2. **Environment Variables**: Make sure all required variables are set
3. **CORS Issues**: Backend CORS_ORIGIN must match frontend URL
4. **Firebase Auth**: Service account must have proper permissions

### Debug Commands
```bash
# Test local Docker build
docker build -t ai-vessel-backend ./backend
docker run -p 8080:8080 ai-vessel-backend

# View Cloud Run service details
gcloud run services describe ai-vessel-backend --region=us-central1

# Check service logs
gcloud logs tail --service=ai-vessel-backend
```

## 🔐 Security Notes

- Never commit `.env.production` files to version control
- Use Google Cloud Secret Manager for sensitive values in production
- Implement proper Firebase security rules
- Keep service account keys secure
- Use HTTPS only (automatic with Cloud Run)

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Google Cloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference)