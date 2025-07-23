# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered vessel purchasing and financial analysis web application. The core innovation is a Gemini AI chatbot that extracts financial parameters from natural language input, feeds them into a vessel financial model, and presents results through interactive visualizations.

**Current Status**: ✅ **LIVE IN PRODUCTION** on Railway
- **Frontend**: https://ai-vessel-frontend-production.up.railway.app
- **Backend**: https://ai-vessel-backend-production.up.railway.app

## Architecture

### Technology Stack
- **Frontend**: React with Vite, Tailwind CSS, Recharts for data visualization
- **Backend**: Node.js with Express.js
- **Database**: Google Firestore (Firebase project: brickid-auth)
- **Authentication**: Firebase Authentication with Google OAuth
- **AI**: Google Gemini 2.5 Flash Lite for parameter extraction and conversational analysis
- **Deployment**: Railway (automatic deployments from GitHub)
- **Version Control**: GitHub repository (https://github.com/thedude11111/AIvesselfinance)

### Application Flow
1. User authenticates via Google (SignInPage → MainApp)
2. AI chatbot (ChatbotPanel) extracts vessel parameters from natural language
3. Parameters are displayed/edited in ParametersPanel 
4. Financial model calculates NPV, IRR, cash flows via VesselFinancialModel
5. Results visualized in ResultsDashboard with charts and metrics
6. AI answers follow-up questions about results

## Development Commands

### Local Development
```bash
# Frontend (React + Vite)
cd frontend
npm run dev          # Development server (http://localhost:3003)
npm run build        # Production build
npm run preview      # Preview production build

# Backend (Node.js + Express)
cd backend
npm run dev          # Development with nodemon (http://localhost:5001)
npm run start        # Production server
```

### Production Deployment (Railway)
```bash
# Automatic deployment via GitHub
git add .
git commit -m "Your changes"
git push origin main  # Triggers automatic Railway deployment

# Manual deployment via Railway CLI
cd backend
railway up           # Deploy backend service

cd ../frontend  
railway up           # Deploy frontend service
```

### Testing
```bash
# Backend tests
cd backend
npm test             # Run Jest tests
npm run test:coverage # Generate coverage report

# Frontend tests  
cd frontend
npm test             # Run Vitest tests
```

## Core Components

### Financial Model Parameters
The VesselFinancialModel expects these parameters:
- **Vessel**: vesselType, age, price, dwt, scrapValue
- **Financing**: downPaymentPercent, loanTermYears, interestRatePercent
- **Revenue**: dailyCharterRate, utilizationPercent
- **Costs**: opexPerDay

### AI Integration Pattern
The GeminiAIService handles multiple functions:
1. **Parameter Extraction**: Converts natural language to structured JSON with parameter preservation
2. **Results Q&A**: Answers questions about financial analysis results
3. **Scenario Modification**: Updates specific parameters while preserving others

**Key Features**:
- **Parameter Preservation**: Maintains previously extracted parameters across multiple messages
- **Intelligent Merging**: Only updates parameters explicitly mentioned in new messages
- **Context Awareness**: Uses conversation history and current parameters for better extraction
- **Enhanced Prompting**: Optimized system prompt for vessel type extraction and maritime terminology

The system prompt is specifically engineered for maritime asset analysis with explicit vessel type extraction.

### API Endpoints
- `POST /api/chatbot` - AI parameter extraction with context (updated to accept currentParameters)
- `POST /api/calculate` - Financial model calculations  
- `POST /api/query-results` - AI Q&A on analysis results
- `GET /health` - Service health check endpoint
- **Authentication**: All endpoints require Firebase token validation

### Database Schema
**Firestore Collections**:
- `users`: {userId, email, displayName, createdAt}
- `analyses`: {userId, analysisName, createdAt, parameters, results}

## Key Implementation Notes

### Financial Calculations
The financial model implements standard maritime investment analysis:
- NPV using 10% discount rate
- IRR calculation via iterative methods
- Cash flow projections with EBITDA and loan payments
- Amortization schedules for vessel financing

### State Management
React components use props/context for state management across:
- User authentication state
- Chatbot conversation history
- Financial parameters form data
- Analysis results

### Environment Variables

#### Production (Railway)
**Backend Environment Variables**:
```env
NODE_ENV=production
FIREBASE_PROJECT_ID=brickid-auth
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=service-account@brickid-auth.iam.gserviceaccount.com
GOOGLE_AI_API_KEY=your-gemini-api-key
CORS_ORIGIN=https://ai-vessel-frontend-production.up.railway.app
```

**Frontend Environment Variables**:
```env
REACT_APP_API_URL=https://ai-vessel-backend-production.up.railway.app/api
REACT_APP_FIREBASE_API_KEY=AIzaSyAks6g1U3aXo2jTSohZ94R1HWAa6Vq8dHw
REACT_APP_FIREBASE_AUTH_DOMAIN=brickid-auth.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=brickid-auth
REACT_APP_FIREBASE_STORAGE_BUCKET=brickid-auth.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=504379670481
REACT_APP_FIREBASE_APP_ID=1:504379670481:web:d5db05ea2ab5dce1a5aaf0
```

#### Local Development
- **Frontend**: Use `.env` file with same `REACT_APP_*` variables, `REACT_APP_API_URL=http://localhost:5001/api`
- **Backend**: Use `.env` file with Firebase credentials and `GOOGLE_AI_API_KEY`
- **Never commit** `.env` files to version control

### Component Architecture
- **MainApp**: Central workspace with dual-panel layout
- **ChatbotPanel**: Manages conversation state and AI interactions
- **ParametersPanel**: Structured form with real-time AI updates
- **ResultsDashboard**: Composite view with CashFlowChart, MetricsSummary components

The application follows a clear separation between AI parameter extraction (chatbot) and manual parameter refinement (form), with the financial engine operating on validated parameter objects.

## Current Status & Deployment

### Production Environment
- **Status**: ✅ Live and operational
- **Frontend URL**: https://ai-vessel-frontend-production.up.railway.app
- **Backend URL**: https://ai-vessel-backend-production.up.railway.app  
- **Health Check**: https://ai-vessel-backend-production.up.railway.app/health
- **Deployment Platform**: Railway (automatic deployments)
- **Cost**: ~$10/month ($5 per service)

### Key Features Implemented
- ✅ **Google OAuth Authentication** - Users sign in with Google accounts
- ✅ **AI Parameter Extraction** - Gemini 2.5 Flash Lite converts natural language to structured vessel parameters
- ✅ **Parameter Preservation** - Maintains parameters across multiple AI conversations
- ✅ **Financial Analysis** - NPV, IRR, cash flow calculations for vessel investments
- ✅ **Interactive Visualizations** - Charts and graphs for financial results
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **Real-time Updates** - Live parameter updates from AI conversations
- ✅ **Conversation History** - Persistent chat history within sessions
- ✅ **Error Handling** - Graceful error handling and user feedback

### Development Workflow
1. **Local Development**: Make changes using `npm run dev` for both frontend and backend
2. **Version Control**: Commit changes to GitHub repository
3. **Automatic Deployment**: Railway automatically deploys changes on git push
4. **Testing**: Use health check endpoints and live testing
5. **Environment Management**: Separate local and production environment variables

### Recent Improvements
- **Enhanced AI Prompting**: Better vessel type extraction and maritime terminology handling
- **Parameter Merging**: Intelligent parameter preservation across conversations  
- **Railway Deployment**: Full production deployment with automatic CI/CD
- **CORS Configuration**: Secure cross-origin requests between frontend and backend
- **Health Monitoring**: Comprehensive health check endpoints
- **Error Recovery**: Robust error handling for production environment

### Next Development Priorities
- [ ] Enable Firestore database for data persistence
- [ ] Add user analysis history and saved calculations
- [ ] Implement additional vessel types and analysis scenarios
- [ ] Add export functionality for analysis results
- [ ] Enhance mobile responsiveness and UX improvements