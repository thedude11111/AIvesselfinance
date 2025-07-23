# 🚀 Google Cloud Deployment Guide

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud CLI** installed locally
3. **Docker** installed (for Cloud Run)
4. **Production environment variables** configured

## Option 1: Cloud Run Deployment (Recommended)

### Step 1: Create Dockerfiles

**Backend Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Configure Environment Variables

**Production Backend Environment** (`.env.production`):
```env
NODE_ENV=production
PORT=8080
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_AI_API_KEY=your-gemini-api-key
CORS_ORIGIN=https://your-frontend-url.run.app
```

**Production Frontend Environment** (`.env.production`):
```env
REACT_APP_API_URL=https://your-backend-url.run.app/api
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

### Step 3: Deploy to Cloud Run

```bash
# 1. Login to Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# 3. Deploy Backend
cd backend
gcloud run deploy ai-vessel-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars NODE_ENV=production \
  --max-instances 10

# 4. Deploy Frontend
cd ../frontend
gcloud run deploy ai-vessel-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80 \
  --max-instances 10
```

## Option 2: App Engine Deployment

### Step 1: Create app.yaml files

**Backend** (`backend/app.yaml`):
```yaml
runtime: nodejs18
service: backend

env_variables:
  NODE_ENV: production
  FIREBASE_PROJECT_ID: your-project-id
  FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\n..."
  FIREBASE_CLIENT_EMAIL: your-service-account@project.iam.gserviceaccount.com
  GOOGLE_AI_API_KEY: your-api-key

automatic_scaling:
  min_instances: 1
  max_instances: 10
```

**Frontend** (`frontend/app.yaml`):
```yaml
runtime: nodejs18
service: default

handlers:
- url: /static
  static_dir: dist/static
  
- url: /.*
  static_files: dist/index.html
  upload: dist/index.html

automatic_scaling:
  min_instances: 1
  max_instances: 10
```

### Step 2: Deploy to App Engine

```bash
# Deploy backend
cd backend
gcloud app deploy app.yaml

# Deploy frontend
cd ../frontend
npm run build
gcloud app deploy app.yaml
```

## Required Google Cloud Setup

### 1. Create Google Cloud Project
```bash
gcloud projects create ai-vessel-finance-prod
gcloud config set project ai-vessel-finance-prod
gcloud auth application-default login
```

### 2. Enable Required APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable appengine.googleapis.com
gcloud services enable firestore.googleapis.com
```

### 3. Set up Firestore
- Go to Firebase Console
- Create/select your project
- Enable Firestore Database
- Configure security rules for production

### 4. Configure IAM Permissions
```bash
# Create service account for the app
gcloud iam service-accounts create ai-vessel-app \
  --display-name="AI Vessel Finance App"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:ai-vessel-app@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/firestore.user"
```

## Production Configuration Changes

### 1. Update CORS Settings
In `backend/server.js`, update CORS for production:
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true
};
```

### 2. Update API URLs
In frontend, use environment-specific API URLs:
```javascript
const API_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL 
  : (process.env.REACT_APP_API_URL || '/api');
```

### 3. Configure Firebase for Production
Update Firebase security rules for production environment:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /analyses/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Cost Estimation

### Cloud Run (Pay-per-use)
- **CPU**: $0.000024 per vCPU-second
- **Memory**: $0.0000025 per GB-second
- **Requests**: $0.40 per million requests
- **Estimated monthly cost**: $10-50 for moderate usage

### App Engine (Always-on instances)
- **Standard Environment**: ~$0.05 per hour per instance
- **Estimated monthly cost**: $35-100 depending on scaling

## Monitoring & Logging

### Set up monitoring:
```bash
# Enable monitoring
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

### Add health checks in your backend:
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version 
  });
});
```

## Security Checklist

- [ ] Use HTTPS only (automatic with Cloud Run/App Engine)
- [ ] Implement proper Firebase security rules
- [ ] Use environment variables for all secrets
- [ ] Enable Google Cloud IAM for service accounts
- [ ] Configure CORS properly for production domain
- [ ] Set up monitoring and alerting
- [ ] Regular security updates for dependencies

## Next Steps

1. Choose deployment option (Cloud Run recommended)
2. Set up Google Cloud project and billing
3. Configure production environment variables
4. Create Dockerfiles (for Cloud Run) or app.yaml (for App Engine)
5. Deploy and test in production environment
6. Set up monitoring and logging
7. Configure custom domain (optional)

Would you like me to help you with any specific step?