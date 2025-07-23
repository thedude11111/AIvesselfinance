@echo off
REM Google Cloud Run Deployment Script for Windows
REM Run this script after setting up your Google Cloud project

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_ID=your-project-id
set REGION=us-central1
set BACKEND_SERVICE=ai-vessel-backend
set FRONTEND_SERVICE=ai-vessel-frontend

echo 🚀 Starting deployment to Google Cloud Run...

REM Check if gcloud is installed
gcloud --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Google Cloud CLI is not installed. Please install it first.
    exit /b 1
)

REM Set project
echo 📋 Setting up Google Cloud project...
gcloud config set project %PROJECT_ID%

REM Enable required APIs
echo 🔧 Enabling required APIs...
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com

REM Deploy Backend
echo 🏗️ Deploying backend service...
cd ..\backend

REM Check if production environment file exists
if not exist ".env.production" (
    echo ❌ Backend .env.production file not found!
    echo Please copy .env.production.template to .env.production and fill in your values.
    exit /b 1
)

gcloud run deploy %BACKEND_SERVICE% ^
    --source . ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --port 8080 ^
    --memory 1Gi ^
    --cpu 1 ^
    --min-instances 0 ^
    --max-instances 10 ^
    --set-env-vars NODE_ENV=production ^
    --env-vars-file .env.production

REM Get backend URL
for /f "tokens=*" %%i in ('gcloud run services describe %BACKEND_SERVICE% --region=%REGION% --format="value(status.url)"') do set BACKEND_URL=%%i
echo ✅ Backend deployed at: !BACKEND_URL!

REM Deploy Frontend
echo 🎨 Deploying frontend service...
cd ..\frontend

REM Check if production environment file exists
if not exist ".env.production" (
    echo ❌ Frontend .env.production file not found!
    echo Please copy .env.production.template to .env.production and fill in your values.
    echo Don't forget to update REACT_APP_API_URL with: !BACKEND_URL!/api
    exit /b 1
)

gcloud run deploy %FRONTEND_SERVICE% ^
    --source . ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --port 8080 ^
    --memory 512Mi ^
    --cpu 1 ^
    --min-instances 0 ^
    --max-instances 5

REM Get frontend URL
for /f "tokens=*" %%i in ('gcloud run services describe %FRONTEND_SERVICE% --region=%REGION% --format="value(status.url)"') do set FRONTEND_URL=%%i
echo ✅ Frontend deployed at: !FRONTEND_URL!

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📱 Your app is now live at:
echo    Frontend: !FRONTEND_URL!
echo    Backend:  !BACKEND_URL!
echo.
echo 🔧 Next steps:
echo 1. Test your application
echo 2. Set up custom domain (optional)
echo 3. Configure monitoring and alerting
echo 4. Set up CI/CD pipeline
echo.

pause