// Jest setup file for global test configuration

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.GEMINI_API_KEY = 'test-api-key';

// Mock console methods in test environment to reduce noise
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Global test utilities
global.testUtils = {
  mockVesselParameters: {
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
  },
  
  mockUser: {
    uid: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User'
  },
  
  mockAnalysisResults: {
    npv: 5000000,
    irr: 0.12,
    paybackPeriod: 8.5,
    cashFlows: [
      { year: 0, netCashFlow: -5000000 },
      { year: 1, netCashFlow: 2000000 }
    ],
    keyRatios: {
      debtServiceCoverageRatio: 1.8,
      operatingMargin: 0.65
    }
  }
};

// Global test timeout
jest.setTimeout(10000);