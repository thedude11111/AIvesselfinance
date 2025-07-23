# AI Vessel Finance - Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase account
- Google AI Platform account

## Step 1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Enable the following services:
   - **Authentication** (with Google provider)
   - **Firestore Database** (in production mode)

4. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Add a web app if none exists
   - Copy the Firebase configuration

## Step 2: Google AI API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key for Gemini
3. Save the API key securely

## Step 3: Environment Configuration

### Backend Configuration
Create `backend/.env` file:
```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Google AI
GOOGLE_AI_API_KEY=your-gemini-api-key

# Server
PORT=5000
NODE_ENV=development
```

### Frontend Configuration
Create `frontend/.env` file:
```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
```

## Step 4: Firebase Service Account Setup

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Extract the following values for your backend .env:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the \n characters)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## Step 5: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 6: Firebase Security Rules

Set up Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own analyses
    match /analyses/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Allow authenticated users to create new analyses
    match /analyses/{document} {
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Step 7: Run the Application

### Start Backend
```bash
cd backend
npm start
```

### Start Frontend
```bash
cd frontend
npm run dev
```

## Step 8: Testing

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Continue with Google" to test authentication
3. Try the AI chat functionality
4. Test financial calculations

## Troubleshooting

### Common Issues

1. **Firebase Authentication Error**
   - Check Firebase API keys
   - Verify Google provider is enabled
   - Ensure domain is authorized in Firebase Console

2. **Gemini AI Error**
   - Verify API key is correct
   - Check API quotas and billing
   - Ensure API is enabled

3. **CORS Issues**
   - Backend proxy is configured in Vite
   - Check ports (frontend: 3000, backend: 5000)

4. **Database Connection**
   - Verify Firestore is enabled
   - Check security rules
   - Ensure service account has proper permissions

## Production Deployment

For production deployment:

1. Update environment variables for production URLs
2. Configure Firebase hosting or deploy to Vercel/Netlify
3. Deploy backend to Heroku, Railway, or similar platform
4. Update CORS settings for production domain
5. Set up proper Firebase security rules

## Security Notes

- Never commit `.env` files to version control
- Use Firebase security rules to protect data
- Implement rate limiting for API endpoints
- Monitor API usage and costs
- Use HTTPS in production