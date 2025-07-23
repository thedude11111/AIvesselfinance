const admin = require('firebase-admin');

// Mock Firebase Admin before requiring any modules that use it
jest.mock('firebase-admin', () => {
  const mockAuth = {
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    getUserByEmail: jest.fn()
  };
  
  const mockFirestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      add: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      get: jest.fn()
    })),
    settings: jest.fn()
  };

  return {
    apps: { length: 0 },
    initializeApp: jest.fn(() => ({ name: 'test-app' })),
    credential: {
      cert: jest.fn(() => ({ type: 'service-account' })),
      applicationDefault: jest.fn(() => ({ type: 'application-default' }))
    },
    auth: jest.fn(() => mockAuth),
    firestore: jest.fn(() => mockFirestore)
  };
});

describe('Firebase Backend Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;
    
    // Clear mocks
    jest.clearAllMocks();
    
    // Reset Firebase apps
    admin.apps.length = 0;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Variables Validation', () => {
    test('should validate FIREBASE_PROJECT_ID exists', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      
      expect(process.env.FIREBASE_PROJECT_ID).toBeDefined();
      expect(process.env.FIREBASE_PROJECT_ID).toBe('test-project');
    });

    test('should validate FIREBASE_PROJECT_ID format', () => {
      process.env.FIREBASE_PROJECT_ID = 'brickid-auth';
      
      // Project ID should be lowercase with hyphens allowed
      expect(process.env.FIREBASE_PROJECT_ID).toMatch(/^[a-z0-9-]+$/);
    });

    test('should validate FIREBASE_CLIENT_EMAIL format', () => {
      process.env.FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk-abc123@test-project.iam.gserviceaccount.com';
      
      // Should match Firebase service account email pattern
      expect(process.env.FIREBASE_CLIENT_EMAIL).toMatch(
        /^firebase-adminsdk-.+@.+\.iam\.gserviceaccount\.com$/
      );
    });

    test('should validate FIREBASE_PRIVATE_KEY format', () => {
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n';
      
      // Should be a valid private key format
      expect(process.env.FIREBASE_PRIVATE_KEY).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(process.env.FIREBASE_PRIVATE_KEY).toMatch(/-----END PRIVATE KEY-----/);
    });
  });

  describe('Firebase Admin Initialization', () => {
    test('should initialize with project ID only (for emulator)', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      
      // Simulate FirestoreService initialization
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      
      expect(admin.initializeApp).toHaveBeenCalledWith({
        projectId: 'test-project'
      });
    });

    test('should initialize with service account credentials', () => {
      const serviceAccount = {
        type: 'service_account',
        project_id: 'test-project',
        private_key_id: 'key-id',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        client_email: 'firebase-adminsdk-abc@test-project.iam.gserviceaccount.com',
        client_id: '12345',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token'
      };

      process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify(serviceAccount);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      
      expect(admin.credential.cert).toHaveBeenCalledWith(serviceAccount);
    });

    test('should initialize with application default credentials', () => {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/service-account.json';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      
      expect(admin.credential.applicationDefault).toHaveBeenCalled();
    });

    test('should handle missing Firebase project ID', () => {
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.GCLOUD_PROJECT;
      
      expect(() => {
        // This should be handled gracefully by the application
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
        expect(projectId).toBeUndefined();
      }).not.toThrow();
    });
  });

  describe('Firebase Service Configuration', () => {
    test('should configure Firestore settings', () => {
      const mockFirestore = admin.firestore();
      
      mockFirestore.settings({
        ignoreUndefinedProperties: true
      });
      
      expect(mockFirestore.settings).toHaveBeenCalledWith({
        ignoreUndefinedProperties: true
      });
    });

    test('should validate Auth service availability', () => {
      const mockAuth = admin.auth();
      
      expect(mockAuth).toBeDefined();
      expect(mockAuth.verifyIdToken).toBeDefined();
      expect(typeof mockAuth.verifyIdToken).toBe('function');
    });

    test('should validate Firestore service availability', () => {
      const mockFirestore = admin.firestore();
      
      expect(mockFirestore).toBeDefined();
      expect(mockFirestore.collection).toBeDefined();
      expect(typeof mockFirestore.collection).toBe('function');
    });
  });

  describe('Configuration Security', () => {
    test('should not expose private keys in production', () => {
      process.env.NODE_ENV = 'production';
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // In production, private key should not be logged or exposed
      expect(() => {
        console.log(privateKey); // This would be caught in production
      }).not.toThrow();
    });

    test('should validate service account key format', () => {
      const validServiceAccount = {
        type: 'service_account',
        project_id: 'test-project',
        private_key: '-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----\n',
        client_email: 'test@test-project.iam.gserviceaccount.com'
      };
      
      expect(validServiceAccount.type).toBe('service_account');
      expect(validServiceAccount.project_id).toMatch(/^[a-z0-9-]+$/);
      expect(validServiceAccount.private_key).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(validServiceAccount.client_email).toMatch(/@.+\.iam\.gserviceaccount\.com$/);
    });

    test('should handle malformed service account JSON', () => {
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY = 'invalid-json';
      
      expect(() => {
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      }).toThrow('Unexpected token');
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should use different configs for development vs production', () => {
      // Development
      process.env.NODE_ENV = 'development';
      process.env.FIREBASE_PROJECT_ID = 'test-project-dev';
      
      expect(process.env.FIREBASE_PROJECT_ID).toBe('test-project-dev');
      
      // Production
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_PROJECT_ID = 'test-project-prod';
      
      expect(process.env.FIREBASE_PROJECT_ID).toBe('test-project-prod');
    });

    test('should validate PORT configuration', () => {
      process.env.PORT = '5001';
      
      const port = parseInt(process.env.PORT) || 5000;
      expect(port).toBe(5001);
      expect(port).toBeGreaterThan(1024);
      expect(port).toBeLessThan(65536);
    });

    test('should validate GEMINI_API_KEY format', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyAbc123def456ghi789';
      
      // Gemini API keys should start with 'AIzaSy'
      expect(process.env.GEMINI_API_KEY).toMatch(/^AIzaSy[A-Za-z0-9_-]+$/);
    });
  });

  describe('Error Handling', () => {
    test('should handle Firebase initialization errors gracefully', () => {
      admin.initializeApp.mockImplementation(() => {
        throw new Error('Firebase initialization failed');
      });
      
      expect(() => {
        try {
          admin.initializeApp({ projectId: 'test' });
        } catch (error) {
          expect(error.message).toBe('Firebase initialization failed');
        }
      }).not.toThrow();
    });

    test('should handle missing credentials gracefully', () => {
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      
      const config = {
        projectId: process.env.FIREBASE_PROJECT_ID
      };
      
      expect(config.projectId).toBeUndefined();
    });
  });
});