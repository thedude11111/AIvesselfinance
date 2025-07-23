# 🚂 Railway CLI Deployment (Alternative Method)

If Railway can't see your GitHub repository, you can deploy directly using the Railway CLI.

## 📦 Install Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

## 🚀 Deploy Both Services

### Deploy Backend
```bash
cd backend
railway init
railway up
```

### Deploy Frontend  
```bash
cd ../frontend
railway init
railway up
```

## 🔧 Add Environment Variables

After deployment, add environment variables in Railway dashboard:

### Backend Variables:
```
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
FIREFOX_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
GOOGLE_AI_API_KEY=your-gemini-key
```

### Frontend Variables:
```
REACT_APP_API_URL=https://your-backend-url.up.railway.app/api
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## ✅ Result

Both services will be deployed and you'll get URLs for each.