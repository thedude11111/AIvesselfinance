#!/bin/bash

# Google Cloud Run Deployment Script
# Run this script after setting up your Google Cloud project

set -e

# Configuration
PROJECT_ID="your-project-id"  # Update this with your actual project ID
REGION="us-central1"
BACKEND_SERVICE="ai-vessel-backend"
FRONTEND_SERVICE="ai-vessel-frontend"

echo "🚀 Starting deployment to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed. Please install it first."
    exit 1
fi

# Set project
echo "📋 Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com

# Deploy Backend
echo "🏗️ Deploying backend service..."
cd ../backend

# Check if production environment file exists
if [ ! -f ".env.production" ]; then
    echo "❌ Backend .env.production file not found!"
    echo "Please copy .env.production.template to .env.production and fill in your values."
    exit 1
fi

gcloud run deploy $BACKEND_SERVICE \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production \
    --env-vars-file .env.production

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
echo "✅ Backend deployed at: $BACKEND_URL"

# Deploy Frontend
echo "🎨 Deploying frontend service..."
cd ../frontend

# Check if production environment file exists
if [ ! -f ".env.production" ]; then
    echo "❌ Frontend .env.production file not found!"
    echo "Please copy .env.production.template to .env.production and fill in your values."
    echo "Don't forget to update REACT_APP_API_URL with: $BACKEND_URL/api"
    exit 1
fi

# Update the API URL in the frontend environment
sed -i.bak "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$BACKEND_URL/api|" .env.production

gcloud run deploy $FRONTEND_SERVICE \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")
echo "✅ Frontend deployed at: $FRONTEND_URL"

# Update backend CORS settings
echo "🔧 Updating backend CORS settings..."
cd ../backend
sed -i.bak "s|CORS_ORIGIN=.*|CORS_ORIGIN=$FRONTEND_URL|" .env.production

# Redeploy backend with updated CORS
gcloud run deploy $BACKEND_SERVICE \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production \
    --env-vars-file .env.production

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Your app is now live at:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo ""
echo "🔧 Next steps:"
echo "1. Test your application"
echo "2. Set up custom domain (optional)"
echo "3. Configure monitoring and alerting"
echo "4. Set up CI/CD pipeline"
echo ""