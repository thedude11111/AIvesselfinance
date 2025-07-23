const FirestoreService = require('../utils/FirestoreService');

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn(),
    settings: jest.fn(),
    batch: jest.fn()
  };

  const mockAdmin = {
    apps: { length: 0 },
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
    credential: {
      cert: jest.fn(),
      applicationDefault: jest.fn()
    },
    auth: jest.fn(() => ({
      verifyIdToken: jest.fn()
    }))
  };

  // Add FieldValue to the mock
  mockAdmin.firestore.FieldValue = {
    serverTimestamp: jest.fn(() => ({ _methodName: 'FieldValue.serverTimestamp' })),
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn(),
    increment: jest.fn(),
    delete: jest.fn()
  };

  mockAdmin.firestore.Timestamp = {
    fromDate: jest.fn(date => ({ seconds: Math.floor(date.getTime() / 1000) }))
  };

  return mockAdmin;
});

const admin = require('firebase-admin');

describe('FirestoreService', () => {
  let firestoreService;
  let mockDb;
  let mockCollection;
  let mockDoc;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables
    process.env.FIREBASE_PROJECT_ID = 'test-project';

    // Set up mock Firestore structure
    mockDoc = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      id: 'test-doc-id'
    };

    mockCollection = {
      doc: jest.fn(() => mockDoc),
      add: jest.fn(() => Promise.resolve(mockDoc)),
      where: jest.fn(() => mockCollection),
      orderBy: jest.fn(() => mockCollection),
      limit: jest.fn(() => mockCollection),
      count: jest.fn(() => mockCollection),
      get: jest.fn()
    };

    mockDb = {
      collection: jest.fn(() => mockCollection),
      settings: jest.fn(),
      batch: jest.fn(() => ({
        delete: jest.fn(),
        commit: jest.fn()
      }))
    };

    admin.firestore.mockReturnValue(mockDb);

    // Create service instance
    firestoreService = new FirestoreService();
  });

  afterEach(() => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  });

  describe('Initialization', () => {
    test('should initialize with project ID', () => {
      expect(admin.initializeApp).toHaveBeenCalledWith({
        projectId: 'test-project'
      });
      expect(mockDb.settings).toHaveBeenCalledWith({
        ignoreUndefinedProperties: true
      });
    });

    test('should initialize with service account key', () => {
      const serviceAccount = { project_id: 'test', private_key: 'key' };
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify(serviceAccount);

      // Reset admin apps to simulate fresh initialization
      admin.apps.length = 0;

      new FirestoreService();

      expect(admin.credential.cert).toHaveBeenCalledWith(serviceAccount);
    });

    test('should use application default credentials', () => {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/credentials.json';
      delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      // Reset admin apps to simulate fresh initialization
      admin.apps.length = 0;

      new FirestoreService();

      expect(admin.credential.applicationDefault).toHaveBeenCalled();
    });
  });

  describe('User Management', () => {
    test('should create new user', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });
      mockDoc.set.mockResolvedValue();

      const userData = {
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      };

      const result = await firestoreService.createUser('user-123', userData);

      expect(mockDb.collection).toHaveBeenCalledWith('users');
      expect(mockCollection.doc).toHaveBeenCalledWith('user-123');
      expect(mockDoc.set).toHaveBeenCalledWith({
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        createdAt: expect.any(Object),
        lastLogin: expect.any(Object),
        updatedAt: expect.any(Object)
      });
      expect(result).toEqual({ userId: 'user-123', ...userData });
    });

    test('should update existing user', async () => {
      mockDoc.get.mockResolvedValue({ exists: true });
      mockDoc.update.mockResolvedValue();

      const userData = {
        email: 'test@example.com',
        displayName: 'Updated User'
      };

      await firestoreService.createUser('user-123', userData);

      expect(mockDoc.update).toHaveBeenCalledWith({
        email: userData.email,
        displayName: userData.displayName,
        photoURL: null,
        lastLogin: expect.any(Object),
        updatedAt: expect.any(Object)
      });
    });

    test('should get user by ID', async () => {
      const userData = {
        email: 'test@example.com',
        displayName: 'Test User'
      };

      mockDoc.get.mockResolvedValue({
        exists: true,
        id: 'user-123',
        data: () => userData
      });

      const result = await firestoreService.getUser('user-123');

      expect(result).toEqual({
        id: 'user-123',
        ...userData
      });
    });

    test('should return null for non-existent user', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      const result = await firestoreService.getUser('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('Analysis Management', () => {
    const sampleAnalysis = {
      userId: 'user-123',
      analysisName: 'Test Analysis',
      parameters: {
        vesselType: 'Bulk Carrier',
        price: 25000000
      },
      results: {
        npv: 5000000,
        irr: 0.12
      }
    };

    test('should save analysis successfully', async () => {
      mockCollection.add.mockResolvedValue({ id: 'analysis-123' });

      const analysisId = await firestoreService.saveAnalysis(sampleAnalysis);

      expect(mockDb.collection).toHaveBeenCalledWith('analyses');
      expect(mockCollection.add).toHaveBeenCalledWith({
        userId: 'user-123',
        analysisName: 'Test Analysis',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
        parameters: sampleAnalysis.parameters,
        results: sampleAnalysis.results,
        version: 1
      });
      expect(analysisId).toBe('analysis-123');
    });

    test('should throw error for missing required fields', async () => {
      const incompleteAnalysis = {
        analysisName: 'Test'
        // Missing userId, parameters, results
      };

      await expect(firestoreService.saveAnalysis(incompleteAnalysis))
        .rejects.toThrow('Missing required fields');
    });

    test('should get analysis by ID with user verification', async () => {
      mockDoc.get.mockResolvedValue({
        exists: true,
        id: 'analysis-123',
        data: () => sampleAnalysis
      });

      const result = await firestoreService.getAnalysis('analysis-123', 'user-123');

      expect(result).toEqual({
        id: 'analysis-123',
        ...sampleAnalysis
      });
    });

    test('should throw error for analysis owned by different user', async () => {
      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({ ...sampleAnalysis, userId: 'other-user' })
      });

      await expect(firestoreService.getAnalysis('analysis-123', 'user-123'))
        .rejects.toThrow('Access denied');
    });

    test('should return null for non-existent analysis', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      const result = await firestoreService.getAnalysis('non-existent', 'user-123');

      expect(result).toBeNull();
    });

    test('should get user analyses with summary', async () => {
      const mockAnalyses = [
        {
          id: 'analysis-1',
          data: () => ({
            analysisName: 'Analysis 1',
            createdAt: 'timestamp1',
            parameters: { vesselType: 'Bulk Carrier', price: 25000000 },
            results: { npv: 5000000, irr: 0.12 }
          })
        },
        {
          id: 'analysis-2', 
          data: () => ({
            analysisName: 'Analysis 2',
            createdAt: 'timestamp2',
            parameters: { vesselType: 'Container', price: 50000000 },
            results: { npv: 8000000, irr: 0.15 }
          })
        }
      ];

      mockCollection.get.mockResolvedValue({
        docs: mockAnalyses
      });

      const result = await firestoreService.getUserAnalyses('user-123');

      expect(mockCollection.where).toHaveBeenCalledWith('userId', '==', 'user-123');
      expect(mockCollection.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(mockCollection.limit).toHaveBeenCalledWith(50);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'analysis-1',
        analysisName: 'Analysis 1',
        createdAt: 'timestamp1',
        updatedAt: undefined,
        summary: {
          vesselType: 'Bulk Carrier',
          price: 25000000,
          npv: 5000000,
          irr: 0.12
        }
      });
    });

    test('should update analysis with ownership verification', async () => {
      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => sampleAnalysis
      });
      mockDoc.update.mockResolvedValue();

      const updateData = { analysisName: 'Updated Analysis' };

      const result = await firestoreService.updateAnalysis('analysis-123', 'user-123', updateData);

      expect(mockDoc.update).toHaveBeenCalledWith({
        analysisName: 'Updated Analysis',
        updatedAt: expect.any(Object)
      });
      expect(result).toBe(true);
    });

    test('should delete analysis with ownership verification', async () => {
      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => sampleAnalysis
      });
      mockDoc.delete.mockResolvedValue();

      const result = await firestoreService.deleteAnalysis('analysis-123', 'user-123');

      expect(mockDoc.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should return false when deleting non-existent analysis', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      const result = await firestoreService.deleteAnalysis('non-existent', 'user-123');

      expect(result).toBe(false);
    });
  });

  describe('Search and Count', () => {
    test('should get user analyses count', async () => {
      mockCollection.get.mockResolvedValue({
        data: () => ({ count: 15 })
      });

      const count = await firestoreService.getUserAnalysesCount('user-123');

      expect(mockCollection.where).toHaveBeenCalledWith('userId', '==', 'user-123');
      expect(mockCollection.count).toHaveBeenCalled();
      expect(count).toBe(15);
    });

    test('should search analyses by name', async () => {
      const searchTerm = 'Bulk';
      const mockResults = [
        {
          id: 'analysis-1',
          data: () => ({ analysisName: 'Bulk Carrier Analysis' })
        }
      ];

      mockCollection.get.mockResolvedValue({
        docs: mockResults
      });

      const results = await firestoreService.searchAnalyses('user-123', searchTerm);

      expect(mockCollection.where).toHaveBeenCalledWith('userId', '==', 'user-123');
      expect(mockCollection.where).toHaveBeenCalledWith('analysisName', '>=', searchTerm);
      expect(mockCollection.where).toHaveBeenCalledWith('analysisName', '<=', searchTerm + '\uf8ff');
      expect(results).toHaveLength(1);
    });
  });

  describe('Data Sanitization', () => {
    test('should sanitize object data', () => {
      const testData = {
        validString: 'test',
        validNumber: 42,
        nullValue: null,
        undefinedValue: undefined,
        nanValue: NaN,
        infinityValue: Infinity,
        functionValue: () => {},
        nestedObject: {
          validProp: 'value',
          invalidProp: undefined
        },
        arrayValue: [1, null, undefined, NaN]
      };

      const sanitized = firestoreService.sanitizeData(testData);

      expect(sanitized).toEqual({
        validString: 'test',
        validNumber: 42,
        nullValue: null,
        nanValue: null,
        infinityValue: null,
        nestedObject: {
          validProp: 'value'
        },
        arrayValue: [1, null, null, null]
      });
    });

    test('should handle primitive values', () => {
      expect(firestoreService.sanitizeData('string')).toBe('string');
      expect(firestoreService.sanitizeData(42)).toBe(42);
      expect(firestoreService.sanitizeData(null)).toBeNull();
      expect(firestoreService.sanitizeData(undefined)).toBeNull();
    });

    test('should handle arrays', () => {
      const testArray = [1, 'test', null, undefined, NaN];
      const sanitized = firestoreService.sanitizeData(testArray);

      expect(sanitized).toEqual([1, 'test', null, null, null]);
    });
  });

  describe('Cleanup Operations', () => {
    test('should cleanup old analyses', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn()
      };

      const mockDocs = [
        { ref: 'ref1' },
        { ref: 'ref2' },
        { ref: 'ref3' }
      ];

      mockDb.batch.mockReturnValue(mockBatch);
      mockCollection.get.mockResolvedValue({
        docs: mockDocs,
        size: 3
      });

      const deletedCount = await firestoreService.cleanupOldAnalyses(365);

      expect(mockCollection.where).toHaveBeenCalledWith('createdAt', '<', expect.any(Object));
      expect(mockCollection.limit).toHaveBeenCalledWith(100);
      expect(mockBatch.delete).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(deletedCount).toBe(3);
    });
  });

  describe('Error Handling', () => {
    test('should handle Firestore errors gracefully', async () => {
      mockDoc.get.mockRejectedValue(new Error('Firestore connection failed'));

      await expect(firestoreService.getUser('user-123'))
        .rejects.toThrow('Get user failed: Firestore connection failed');
    });

    test('should handle permission errors', async () => {
      mockDoc.get.mockRejectedValue(new Error('Missing or insufficient permissions'));

      await expect(firestoreService.getAnalysis('analysis-123', 'user-123'))
        .rejects.toThrow('Get analysis failed: Missing or insufficient permissions');
    });

    test('should handle network errors during save', async () => {
      mockCollection.add.mockRejectedValue(new Error('Network error'));

      await expect(firestoreService.saveAnalysis({
        userId: 'user-123',
        parameters: {},
        results: {}
      })).rejects.toThrow('Save analysis failed: Network error');
    });
  });
});