# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered vessel purchasing and financial analysis web application. The core innovation is a Gemini AI chatbot that extracts financial parameters from natural language input, feeds them into a vessel financial model, and presents results through interactive visualizations.

## Architecture

### Technology Stack
- **Frontend**: React with Vite, Tailwind CSS, Recharts for data visualization
- **Backend**: Node.js with Express.js
- **Database**: Google Firestore
- **Authentication**: Firebase Authentication with Google OAuth
- **AI**: Google Gemini API for parameter extraction and conversational analysis

### Application Flow
1. User authenticates via Google (SignInPage → MainApp)
2. AI chatbot (ChatbotPanel) extracts vessel parameters from natural language
3. Parameters are displayed/edited in ParametersPanel 
4. Financial model calculates NPV, IRR, cash flows via VesselFinancialModel
5. Results visualized in ResultsDashboard with charts and metrics
6. AI answers follow-up questions about results

## Development Commands

### Frontend (React + Vite)
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

### Backend (Node.js + Express)
```bash
cd backend
npm run dev          # Development with nodemon
npm run start        # Production server
```

## Core Components

### Financial Model Parameters
The VesselFinancialModel expects these parameters:
- **Vessel**: vesselType, age, price, dwt, scrapValue
- **Financing**: downPaymentPercent, loanTermYears, interestRatePercent
- **Revenue**: dailyCharterRate, utilizationPercent
- **Costs**: opexPerDay

### AI Integration Pattern
The GeminiAIService handles two main functions:
1. **Parameter Extraction**: Converts natural language to structured JSON
2. **Results Q&A**: Answers questions about financial analysis results

The system prompt is specifically engineered for maritime asset analysis.

### API Endpoints
- `POST /api/auth/google` - Firebase token validation
- `POST /api/chatbot` - Parameter extraction via Gemini
- `POST /api/calculate` - Financial model calculations
- `POST /api/query-results` - AI Q&A on analysis results

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
Required environment variables:
- **Frontend**: `REACT_APP_FIREBASE_*` config values
- **Backend**: `GEMINI_API_KEY`, `FIREBASE_PROJECT_ID`

### Component Architecture
- **MainApp**: Central workspace with dual-panel layout
- **ChatbotPanel**: Manages conversation state and AI interactions
- **ParametersPanel**: Structured form with real-time AI updates
- **ResultsDashboard**: Composite view with CashFlowChart, MetricsSummary components

The application follows a clear separation between AI parameter extraction (chatbot) and manual parameter refinement (form), with the financial engine operating on validated parameter objects.