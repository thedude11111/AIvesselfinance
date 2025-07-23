const request = require('supertest');
const app = require('../server');

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  auth: () => ({
    verifyIdToken: jest.fn()
  })
}));

// Mock services
jest.mock('../utils/GeminiAIService');
jest.mock('../utils/FirestoreService');

const admin = require('firebase-admin');
const GeminiAIService = require('../utils/GeminiAIService');
const FirestoreService = require('../utils/FirestoreService');

describe('API Endpoints', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User'
  };

  const validToken = 'valid-token';
  const validParameters = {
    vesselType: 'Bulk Carrier',
    age: 10,
    price: 25000000,
    dwt: 75000,
    downPaymentPercent: 20,
    loanTermYears: 10,
    interestRatePercent: 5.5,
    dailyCharterRate: 15000,
    opexPerDay: 8000,
    utilizationPercent: 85
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firebase token verification
    admin.auth().verifyIdToken.mockResolvedValue(mockUser);
    
    // Mock GeminiAIService
    GeminiAIService.mockImplementation(() => ({
      extractParameters: jest.fn(),
      modifyScenario: jest.fn(),
      answerResultsQuery: jest.fn()
    }));
    
    // Mock FirestoreService
    FirestoreService.mockImplementation(() => ({
      createUser: jest.fn(),
      saveAnalysis: jest.fn(),
      getAnalysis: jest.fn(),
      getUserAnalyses: jest.fn(),
      deleteAnalysis: jest.fn()
    }));
  });

  describe('Health Check', () => {
    test('GET /api/health returns service status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('gemini');
      expect(response.body.services).toHaveProperty('firestore');
    });
  });

  describe('Authentication', () => {
    test('POST /api/auth/google with valid token', async () => {
      const mockFirestore = new FirestoreService();
      mockFirestore.createUser.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: validToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual({
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.name,
        photoURL: undefined
      });
    });

    test('POST /api/auth/google without token', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('ID token is required');
    });

    test('POST /api/auth/google with invalid token', async () => {
      admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'invalid-token' })
        .expect(401);

      expect(response.body.error).toBe('Authentication failed');
    });
  });

  describe('Chatbot Endpoints', () => {
    const authHeaders = { Authorization: `Bearer ${validToken}` };

    test('POST /api/chatbot extracts parameters successfully', async () => {
      const mockGemini = new GeminiAIService();
      const mockResult = {
        parameters: { vesselType: 'Bulk Carrier', price: 25000000 },
        confirmation: 'Parameters extracted successfully'
      };
      mockGemini.extractParameters.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/chatbot')
        .set(authHeaders)
        .send({
          message: 'I want to analyze a bulk carrier worth $25M',
          conversationHistory: []
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.parameters).toEqual(mockResult.parameters);
      expect(response.body.aiResponse).toBe(mockResult.confirmation);
    });

    test('POST /api/chatbot without message', async () => {
      const response = await request(app)
        .post('/api/chatbot')
        .set(authHeaders)
        .send({ conversationHistory: [] })
        .expect(400);

      expect(response.body.error).toBe('Message is required');
    });

    test('POST /api/chatbot without authorization', async () => {
      const response = await request(app)
        .post('/api/chatbot')
        .send({ message: 'test message' })
        .expect(401);

      expect(response.body.error).toBe('No authorization token provided');
    });

    test('POST /api/chatbot/modify updates parameters', async () => {
      const mockGemini = new GeminiAIService();
      const mockResult = {
        updatedParameters: { ...validParameters, price: 30000000 },
        modifications: { price: 30000000 },
        confirmation: 'Price updated to $30M'
      };
      mockGemini.modifyScenario.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/chatbot/modify')
        .set(authHeaders)
        .send({
          message: 'Change the price to $30M',
          currentParameters: validParameters,
          conversationHistory: []
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updatedParameters.price).toBe(30000000);
      expect(response.body.modifications).toEqual({ price: 30000000 });
    });
  });

  describe('Financial Calculation', () => {
    const authHeaders = { Authorization: `Bearer ${validToken}` };

    test('POST /api/calculate runs analysis successfully', async () => {
      const mockFirestore = new FirestoreService();
      mockFirestore.saveAnalysis.mockResolvedValue('analysis-123');

      const response = await request(app)
        .post('/api/calculate')
        .set(authHeaders)
        .send({
          parameters: validParameters,
          analysisName: 'Test Analysis'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveProperty('npv');
      expect(response.body.results).toHaveProperty('irr');
      expect(response.body.results).toHaveProperty('cashFlows');
      expect(response.body.results).toHaveProperty('analysisId');
    });

    test('POST /api/calculate without parameters', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .set(authHeaders)
        .send({ analysisName: 'Test' })
        .expect(400);

      expect(response.body.error).toBe('Parameters are required');
    });

    test('POST /api/calculate with invalid parameters', async () => {
      const invalidParams = { ...validParameters, price: -1000 };

      const response = await request(app)
        .post('/api/calculate')
        .set(authHeaders)
        .send({ parameters: invalidParams })
        .expect(500);

      expect(response.body.error).toBe('Financial calculation failed');
    });

    test('POST /api/calculate continues without database save on error', async () => {
      const mockFirestore = new FirestoreService();
      mockFirestore.saveAnalysis.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .post('/api/calculate')
        .set(authHeaders)
        .send({ parameters: validParameters })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).not.toHaveProperty('analysisId');
    });
  });

  describe('Results Query', () => {
    const authHeaders = { Authorization: `Bearer ${validToken}` };
    const mockResults = {
      npv: 5000000,
      irr: 0.12,
      paybackPeriod: 8.5,
      summary: { vesselDescription: 'Test Vessel' }
    };

    test('POST /api/query-results answers query with results data', async () => {
      const mockGemini = new GeminiAIService();
      mockGemini.answerResultsQuery.mockResolvedValue('The NPV is positive at $5M');

      const response = await request(app)
        .post('/api/query-results')
        .set(authHeaders)
        .send({
          query: 'What is the NPV?',
          resultsData: mockResults,
          conversationHistory: []
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.answer).toBe('The NPV is positive at $5M');
      expect(response.body.query).toBe('What is the NPV?');
    });

    test('POST /api/query-results fetches analysis by ID', async () => {
      const mockFirestore = new FirestoreService();
      mockFirestore.getAnalysis.mockResolvedValue(mockResults);
      
      const mockGemini = new GeminiAIService();
      mockGemini.answerResultsQuery.mockResolvedValue('Analysis retrieved');

      const response = await request(app)
        .post('/api/query-results')
        .set(authHeaders)
        .send({
          query: 'What is the NPV?',
          analysisId: 'analysis-123'
        })
        .expect(200);

      expect(mockFirestore.getAnalysis).toHaveBeenCalledWith('analysis-123', mockUser.uid);
      expect(response.body.success).toBe(true);
    });

    test('POST /api/query-results without query', async () => {
      const response = await request(app)
        .post('/api/query-results')
        .set(authHeaders)
        .send({ resultsData: mockResults })
        .expect(400);

      expect(response.body.error).toBe('Query is required');
    });
  });

  describe('Analysis Management', () => {
    const authHeaders = { Authorization: `Bearer ${validToken}` };

    test('GET /api/analyses returns user analyses', async () => {
      const mockFirestore = new FirestoreService();
      const mockAnalyses = [
        { id: 'analysis-1', name: 'Test Analysis 1' },
        { id: 'analysis-2', name: 'Test Analysis 2' }
      ];
      mockFirestore.getUserAnalyses.mockResolvedValue(mockAnalyses);

      const response = await request(app)
        .get('/api/analyses')
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analyses).toEqual(mockAnalyses);
      expect(mockFirestore.getUserAnalyses).toHaveBeenCalledWith(mockUser.uid);
    });

    test('GET /api/analyses/:analysisId returns specific analysis', async () => {
      const mockFirestore = new FirestoreService();
      const mockAnalysis = { id: 'analysis-123', name: 'Test Analysis' };
      mockFirestore.getAnalysis.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .get('/api/analyses/analysis-123')
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toEqual(mockAnalysis);
    });

    test('GET /api/analyses/:analysisId returns 404 for non-existent analysis', async () => {
      const mockFirestore = new FirestoreService();
      mockFirestore.getAnalysis.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/analyses/non-existent')
        .set(authHeaders)
        .expect(404);

      expect(response.body.error).toBe('Analysis not found');
    });

    test('DELETE /api/analyses/:analysisId deletes analysis', async () => {
      const mockFirestore = new FirestoreService();
      mockFirestore.deleteAnalysis.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/analyses/analysis-123')
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Analysis deleted successfully');
      expect(mockFirestore.deleteAnalysis).toHaveBeenCalledWith('analysis-123', mockUser.uid);
    });
  });

  describe('Error Handling', () => {
    test('returns 404 for non-existent endpoint', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Endpoint not found');
    });

    test('handles service unavailable gracefully', async () => {
      // Override the mock to simulate service unavailable
      GeminiAIService.mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      const response = await request(app)
        .post('/api/chatbot')
        .set({ Authorization: `Bearer ${validToken}` })
        .send({ message: 'test' })
        .expect(503);

      expect(response.body.error).toBe('AI service is not available');
    });
  });

  describe('Authentication Middleware', () => {
    test('blocks requests without authorization header', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({ parameters: validParameters })
        .expect(401);

      expect(response.body.error).toBe('No authorization token provided');
    });

    test('blocks requests with invalid bearer format', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .set({ Authorization: 'InvalidFormat token' })
        .send({ parameters: validParameters })
        .expect(401);

      expect(response.body.error).toBe('No authorization token provided');
    });

    test('blocks requests with invalid token', async () => {
      admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/calculate')
        .set({ Authorization: 'Bearer invalid-token' })
        .send({ parameters: validParameters })
        .expect(401);

      expect(response.body.error).toBe('Invalid authorization token');
    });
  });

  describe('Request Validation', () => {
    const authHeaders = { Authorization: `Bearer ${validToken}` };

    test('validates JSON payload size limit', async () => {
      const largePayload = {
        parameters: validParameters,
        data: 'x'.repeat(11 * 1024 * 1024) // 11MB payload
      };

      const response = await request(app)
        .post('/api/calculate')
        .set(authHeaders)
        .send(largePayload)
        .expect(413);
    });

    test('handles malformed JSON', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .set(authHeaders)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });
});