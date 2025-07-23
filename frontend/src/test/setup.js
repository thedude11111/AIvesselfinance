import '@testing-library/jest-dom'

// Mock Firebase
const mockAuth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    getIdToken: vi.fn().mockResolvedValue('mock-token')
  }
}

const mockFirebase = {
  auth: mockAuth,
  initializeApp: vi.fn(),
  getAuth: vi.fn().mockReturnValue(mockAuth)
}

vi.mock('../config/firebase', () => ({
  auth: mockAuth,
  default: mockFirebase
}))

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:5001'

// Mock fetch globally
global.fetch = vi.fn()

// Clean up after each test
beforeEach(() => {
  vi.clearAllMocks()
  fetch.mockClear()
})