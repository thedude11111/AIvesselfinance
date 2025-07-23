# Firebase Setup Guide - Using Existing Project

## Step 1: Access Your Existing Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your existing Firebase project from the list
3. You should see your project dashboard

## Step 2: Enable Required Services

### Enable Authentication
1. In the left sidebar, click **"Authentication"**
2. Click **"Get started"** if you haven't used Authentication before
3. Go to the **"Sign-in method"** tab
4. Find **"Google"** in the list and click on it
5. Toggle the **"Enable"** switch to ON
6. You'll need to set a **"Project support email"** - use your email
7. Click **"Save"**

### Enable Firestore Database
1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"** if you don't have one
3. Choose **"Start in production mode"** (we'll set custom rules later)
4. Select your preferred location (choose closest to your users)
5. Click **"Done"**

## Step 3: Get Firebase Web App Configuration

### Option A: If you already have a web app registered
1. Go to **Project Settings** (gear icon in left sidebar)
2. Scroll down to **"Your apps"** section
3. Click on your existing web app
4. You'll see the Firebase configuration object

### Option B: If you need to add a web app
1. Go to **Project Settings** (gear icon in left sidebar)  
2. Scroll down to **"Your apps"** section
3. Click the **"</>"** (web) icon to add a web app
4. Enter app name: `AI Vessel Finance` (or any name you prefer)
5. **Don't check** "Set up Firebase Hosting" for now
6. Click **"Register app"**
7. Copy the configuration object that appears

### Configuration Object Example
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC9X...", // This is what you need
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 4: Get Service Account Credentials (for Backend)

1. In Firebase Console, go to **Project Settings**
2. Click the **"Service accounts"** tab
3. Click **"Generate new private key"** button
4. Click **"Generate key"** in the popup
5. A JSON file will download - **keep this file secure**
6. Open the downloaded JSON file

### Extract Values from Service Account JSON
The downloaded file looks like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xyz@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

You need these three values:
- `project_id` → for `FIREBASE_PROJECT_ID`
- `private_key` → for `FIREBASE_PRIVATE_KEY`
- `client_email` → for `FIREBASE_CLIENT_EMAIL`

## Step 5: Set Up Firestore Security Rules

1. In Firebase Console, go to **Firestore Database**
2. Click the **"Rules"** tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to access their own analyses
    match /analyses/{analysisId} {
      allow read, write, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Allow authenticated users to create new analyses
    match /analyses/{analysisId} {
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

4. Click **"Publish"**

## Step 6: Configure Authorized Domains (Important!)

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Make sure these domains are in the list:
   - `localhost` (for development)
   - Your production domain (if you have one)
3. If `localhost` is not there, click **"Add domain"** and add it

## Step 7: Create Environment Files

### Frontend Environment File
Create `frontend/.env`:
```env
# Copy these values from your Firebase web app config
REACT_APP_FIREBASE_API_KEY=AIzaSyC9X...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com  
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# API Configuration  
REACT_APP_API_URL=http://localhost:5000/api
```

### Backend Environment File
Create `backend/.env`:
```env
# Copy these values from your service account JSON
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@your-project.iam.gserviceaccount.com

# Get this from Google AI Platform
GOOGLE_AI_API_KEY=your-gemini-api-key

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Step 8: Test Firebase Connection

### Test Frontend Connection
1. Start the frontend: `cd frontend && npm run dev`
2. Open browser to `http://localhost:3000`
3. Try clicking "Continue with Google"
4. You should see Google sign-in popup

### Test Backend Connection
1. Start the backend: `cd backend && npm start`
2. Check console logs for any Firebase connection errors
3. The server should start without authentication errors

## Common Issues & Solutions

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution**: Add `localhost` to authorized domains in Firebase Console

### Issue: "FIREBASE_PRIVATE_KEY is not valid"  
**Solution**: Make sure the private key includes the `\n` characters and is wrapped in quotes

### Issue: "Permission denied" when writing to Firestore
**Solution**: Check that security rules are published and user is authenticated

### Issue: "Service account does not have permission"
**Solution**: The service account should automatically have the right permissions. If not, go to Google Cloud Console → IAM and add Firebase Admin SDK Admin Service Agent role

## Verification Checklist

- [ ] Authentication enabled with Google provider
- [ ] Firestore database created and rules published  
- [ ] Web app registered and config copied
- [ ] Service account JSON downloaded and values extracted
- [ ] Environment files created with correct values
- [ ] Authorized domains include localhost
- [ ] Can sign in with Google (frontend test)
- [ ] No Firebase errors in backend console

Once all these steps are complete, your Firebase integration should work properly with the AI Vessel Finance application.