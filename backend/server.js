const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin (needed for token verification)
if (!admin.apps.length) {
  try {
    const config = {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT
    };
    
    // Use service account credentials if provided
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      config.credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      });
      console.log('✅ Firebase Admin initialized with service account credentials (with Firestore fallback)');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      config.credential = admin.credential.applicationDefault();
      console.log('✅ Firebase Admin initialized with application default credentials');
    } else {
      console.log('✅ Firebase Admin initialized with project ID only');
    }
    
    admin.initializeApp(config);
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
  }
}

// Import our services
const VesselFinancialModel = require('./models/VesselFinancialModel');
const GeminiAIService = require('./utils/GeminiAIService');
const FirestoreService = require('./utils/FirestoreService');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from Railway domains, localhost for development, and specific CORS_ORIGIN
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:3003'
    ].filter(Boolean); // Remove null/undefined values
    
    // Allow Railway domains (*.up.railway.app)
    const isRailwayDomain = origin && origin.includes('.up.railway.app');
    const isLocalhost = origin && origin.includes('localhost');
    const isAllowedOrigin = allowedOrigins.includes(origin);
    
    // Allow if no origin (mobile apps), localhost, Railway domain, or explicitly allowed
    if (!origin || isLocalhost || isRailwayDomain || isAllowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Initialize services
let geminiService, firestoreService;

try {
  geminiService = new GeminiAIService();
  firestoreService = new FirestoreService();
  console.log('✅ Services initialized successfully');
} catch (error) {
  console.error('❌ Service initialization error:', error.message);
  console.log('⚠️ Server starting in limited mode - some features may not work');
}

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔍 Auth verification - URL:', req.url, 'Header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header');
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('🔑 Verifying token for URL:', req.url);
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    console.log('✅ Token verified for user:', decodedToken.uid);
    next();
  } catch (error) {
    console.error('❌ Token verification error for URL:', req.url, error);
    res.status(401).json({ 
      error: 'Invalid authorization token',
      details: error.message 
    });
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  const status = {
    status: 'AI Vessel Finance API is running',
    timestamp: new Date().toISOString(),
    services: {
      gemini: geminiService ? 'available' : 'unavailable',
      firestore: firestoreService ? 'available' : 'unavailable'
    }
  };
  res.json(status);
});

// Authentication endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // Create or update user in Firestore
    if (firestoreService) {
      await firestoreService.createUser(uid, {
        email,
        displayName: name,
        photoURL: picture
      });
    }

    res.json({
      success: true,
      user: {
        uid,
        email,
        displayName: name,
        photoURL: picture
      },
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
});

// Chatbot endpoint for parameter extraction
app.post('/api/chatbot', verifyFirebaseToken, async (req, res) => {
  try {
    const { message, context } = req.body;
    const conversationHistory = context?.conversationHistory || [];
    const currentParameters = context?.currentParameters || {};
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!geminiService) {
      return res.status(503).json({ error: 'AI service is not available' });
    }

    const result = await geminiService.extractParameters(message, conversationHistory, currentParameters);
    
    res.json({
      success: true,
      parameters: result.parameters,
      aiResponse: result.confirmation,
      extractedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: 'Parameter extraction failed', 
      details: error.message 
    });
  }
});

// Scenario modification endpoint
app.post('/api/chatbot/modify', verifyFirebaseToken, async (req, res) => {
  try {
    const { message, currentParameters, conversationHistory } = req.body;
    
    if (!message || !currentParameters) {
      return res.status(400).json({ error: 'Message and current parameters are required' });
    }

    if (!geminiService) {
      return res.status(503).json({ error: 'AI service is not available' });
    }

    const result = await geminiService.modifyScenario(message, currentParameters, conversationHistory);
    
    res.json({
      success: true,
      updatedParameters: result.updatedParameters,
      modifications: result.modifications,
      aiResponse: result.confirmation,
      modifiedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scenario modification error:', error);
    res.status(500).json({ 
      error: 'Scenario modification failed', 
      details: error.message 
    });
  }
});

// Financial calculation endpoint
app.post('/api/calculate', verifyFirebaseToken, async (req, res) => {
  try {
    const { parameters, analysisName } = req.body;
    
    if (!parameters) {
      return res.status(400).json({ error: 'Parameters are required' });
    }

    // Run financial analysis
    const financialModel = new VesselFinancialModel(parameters);
    const results = financialModel.calculateFinancialMetrics();

    // Save analysis to database
    if (firestoreService) {
      try {
        const analysisId = await firestoreService.saveAnalysis({
          userId: req.user.uid,
          analysisName: analysisName || 'Vessel Analysis',
          parameters,
          results
        });
        results.analysisId = analysisId;
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue without saving - don't fail the calculation
      }
    }

    res.json({
      success: true,
      results,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ 
      error: 'Financial calculation failed', 
      details: error.message 
    });
  }
});

// Query results endpoint
app.post('/api/query-results', verifyFirebaseToken, async (req, res) => {
  try {
    const { query, analysisId, resultsData, conversationHistory } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    let analysisData = resultsData;
    
    // If analysisId provided, fetch from database
    if (analysisId && firestoreService && !resultsData) {
      try {
        analysisData = await firestoreService.getAnalysis(analysisId, req.user.uid);
        if (!analysisData) {
          return res.status(404).json({ error: 'Analysis not found' });
        }
      } catch (dbError) {
        console.error('Database fetch error:', dbError);
        return res.status(500).json({ error: 'Failed to fetch analysis data' });
      }
    }

    if (!analysisData) {
      return res.status(400).json({ error: 'Results data or analysis ID is required' });
    }

    if (!geminiService) {
      return res.status(503).json({ error: 'AI service is not available' });
    }

    const answer = await geminiService.answerResultsQuery(query, analysisData, conversationHistory);
    
    res.json({
      success: true,
      answer,
      query,
      answeredAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Results query error:', error);
    res.status(500).json({ 
      error: 'Results query failed', 
      details: error.message 
    });
  }
});

// Get user's analyses
app.get('/api/analyses', verifyFirebaseToken, async (req, res) => {
  try {
    console.log('📊 Getting analyses for user:', req.user.uid);
    
    if (!firestoreService) {
      console.log('❌ Firestore service not available');
      return res.status(503).json({ error: 'Database service is not available' });
    }

    const analyses = await firestoreService.getUserAnalyses(req.user.uid);
    console.log('✅ Found', analyses.length, 'analyses for user');
    
    res.json({
      success: true,
      analyses,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get analyses error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analyses', 
      details: error.message 
    });
  }
});

// Get specific analysis
app.get('/api/analyses/:analysisId', verifyFirebaseToken, async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    if (!firestoreService) {
      return res.status(503).json({ error: 'Database service is not available' });
    }

    const analysis = await firestoreService.getAnalysis(analysisId, req.user.uid);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.json({
      success: true,
      analysis,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analysis', 
      details: error.message 
    });
  }
});

// Delete analysis
app.delete('/api/analyses/:analysisId', verifyFirebaseToken, async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    if (!firestoreService) {
      return res.status(503).json({ error: 'Database service is not available' });
    }

    const success = await firestoreService.deleteAnalysis(analysisId, req.user.uid);
    
    if (!success) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.json({
      success: true,
      message: 'Analysis deleted successfully',
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to delete analysis', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
  });
});

// Health check endpoint (for container health checks)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 AI Vessel Finance API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;