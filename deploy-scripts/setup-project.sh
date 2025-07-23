#!/bin/bash

# Google Cloud Project Setup Script
# Run this script first to set up your Google Cloud project

set -e

# Configuration
PROJECT_ID="your-project-id"  # Update this with your desired project ID
PROJECT_NAME="AI Vessel Finance"
BILLING_ACCOUNT_ID="your-billing-account-id"  # Update with your billing account ID
REGION="us-central1"

echo "🏗️ Setting up Google Cloud project for AI Vessel Finance..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Login to Google Cloud
echo "🔐 Logging in to Google Cloud..."
gcloud auth login

# Create project
echo "📋 Creating Google Cloud project..."
gcloud projects create $PROJECT_ID --name="$PROJECT_NAME"

# Set the project as default
gcloud config set project $PROJECT_ID

# Link billing account (you need to update BILLING_ACCOUNT_ID)
echo "💳 Linking billing account..."
echo "⚠️  You need to link a billing account manually in the Cloud Console"
echo "   Or update BILLING_ACCOUNT_ID in this script and uncomment the next line:"
echo "   Visit: https://console.cloud.google.com/billing"
# gcloud beta billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable firebase.googleapis.com
gcloud services enable iamcredentials.googleapis.com

# Create service account for the application
echo "👤 Creating service account..."
gcloud iam service-accounts create ai-vessel-app \
    --display-name="AI Vessel Finance App" \
    --description="Service account for AI Vessel Finance application"

# Grant necessary permissions to service account
echo "🔑 Granting permissions to service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:ai-vessel-app@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/firestore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:ai-vessel-app@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/firebase.admin"

# Generate service account key
echo "🗝️ Generating service account key..."
gcloud iam service-accounts keys create ./service-account-key.json \
    --iam-account=ai-vessel-app@$PROJECT_ID.iam.gserviceaccount.com

echo "✅ Service account key saved to: ./service-account-key.json"
echo "⚠️  Keep this file secure and never commit it to version control!"

# Set up Firestore
echo "🗄️ Setting up Firestore..."
echo "You need to manually enable Firestore in the Firebase Console:"
echo "1. Visit: https://console.firebase.google.com/"
echo "2. Select your project: $PROJECT_ID"
echo "3. Go to Firestore Database"
echo "4. Click 'Create database'"
echo "5. Choose 'Start in test mode'"
echo "6. Select region: $REGION"

# Set up Firebase Authentication
echo "🔐 Setting up Firebase Authentication..."
echo "You need to manually enable Authentication in the Firebase Console:"
echo "1. Visit: https://console.firebase.google.com/"
echo "2. Select your project: $PROJECT_ID"
echo "3. Go to Authentication"
echo "4. Click 'Get started'"
echo "5. Enable Google sign-in provider"

echo ""
echo "🎉 Project setup completed!"
echo ""
echo "📋 Project Details:"
echo "   Project ID: $PROJECT_ID"
echo "   Project Name: $PROJECT_NAME"
echo "   Region: $REGION"
echo ""
echo "📝 Next steps:"
echo "1. Enable billing for your project in the Cloud Console"
echo "2. Set up Firestore database (see instructions above)"
echo "3. Set up Firebase Authentication (see instructions above)"
echo "4. Update environment files with your project details"
echo "5. Run the deployment script: ./deploy-to-cloud-run.sh"
echo ""
echo "🔗 Useful links:"
echo "   Cloud Console: https://console.cloud.google.com/home/dashboard?project=$PROJECT_ID"
echo "   Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo ""