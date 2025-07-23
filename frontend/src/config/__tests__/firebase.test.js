import { describe, test, expect, beforeEach, vi } from 'vitest'

// Mock Firebase modules before importing
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'mock-app' }))
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  GoogleAuthProvider: vi.fn(() => ({ providerId: 'google.com' }))
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ type: 'firestore' }))
}))

describe('Firebase Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up environment variables for testing
    process.env.REACT_APP_FIREBASE_API_KEY = 'test-api-key'
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com'
    process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project'
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = '123456789'
    process.env.REACT_APP_FIREBASE_APP_ID = '1:123456789:web:abcdef123456'
  })

  test('should have all required environment variables', () => {
    expect(process.env.REACT_APP_FIREBASE_API_KEY).toBeDefined()
    expect(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN).toBeDefined()
    expect(process.env.REACT_APP_FIREBASE_PROJECT_ID).toBeDefined()
    expect(process.env.REACT_APP_FIREBASE_STORAGE_BUCKET).toBeDefined()
    expect(process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID).toBeDefined()
    expect(process.env.REACT_APP_FIREBASE_APP_ID).toBeDefined()
  })

  test('should validate Firebase config format', () => {
    const { initializeApp } = require('firebase/app')
    
    // Import the firebase config (this triggers initialization)
    require('../firebase.js')
    
    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      authDomain: 'test-project.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test-project.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef123456'
    })
  })

  test('should initialize Firebase services', () => {
    const { getAuth } = require('firebase/auth')
    const { getFirestore } = require('firebase/firestore')
    
    // Import the firebase config
    const firebaseModule = require('../firebase.js')
    
    expect(getAuth).toHaveBeenCalled()
    expect(getFirestore).toHaveBeenCalled()
    expect(firebaseModule.auth).toBeDefined()
    expect(firebaseModule.db).toBeDefined()
    expect(firebaseModule.googleProvider).toBeDefined()
  })

  test('should validate API key format', () => {
    const apiKey = process.env.REACT_APP_FIREBASE_API_KEY
    
    // API key should start with 'AIza' and be at least 20 characters
    expect(apiKey).toMatch(/^AIza.{35,}$/)
  })

  test('should validate auth domain format', () => {
    const authDomain = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN
    
    // Auth domain should end with firebaseapp.com
    expect(authDomain).toMatch(/\.firebaseapp\.com$/)
  })

  test('should validate project ID format', () => {
    const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID
    
    // Project ID should be lowercase with hyphens
    expect(projectId).toMatch(/^[a-z0-9-]+$/)
  })

  test('should validate storage bucket format', () => {
    const storageBucket = process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
    
    // Storage bucket should match project format
    expect(storageBucket).toMatch(/^[a-z0-9-]+\.(appspot\.com|firebasestorage\.app)$/)
  })

  test('should validate messaging sender ID format', () => {
    const messagingSenderId = process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID
    
    // Messaging sender ID should be numeric
    expect(messagingSenderId).toMatch(/^\d+$/)
  })

  test('should validate app ID format', () => {
    const appId = process.env.REACT_APP_FIREBASE_APP_ID
    
    // App ID should match Firebase format
    expect(appId).toMatch(/^1:\d+:(web|android|ios):[a-f0-9]+$/)
  })

  test('should handle missing environment variables gracefully', () => {
    // Clear environment variables
    delete process.env.REACT_APP_FIREBASE_API_KEY
    
    expect(() => {
      // This should not throw but may result in undefined values
      const config = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
      }
      
      expect(config.apiKey).toBeUndefined()
    }).not.toThrow()
  })
})