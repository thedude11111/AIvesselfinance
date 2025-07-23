#!/usr/bin/env node

/**
 * Firebase Connection Test
 * Attempts to connect to Firebase using current configuration
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testFirebaseConnection() {
  log('🔥 Testing Firebase Connection', 'bright');
  log('=============================', 'blue');
  
  try {
    // Test Firebase Admin SDK connection
    const admin = require('firebase-admin');
    
    log('\n📊 Configuration Check:', 'cyan');
    log(`Project ID: ${process.env.FIREBASE_PROJECT_ID || 'NOT SET'}`, 
        process.env.FIREBASE_PROJECT_ID ? 'green' : 'red');
    log(`Client Email: ${process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET'}`, 
        process.env.FIREBASE_CLIENT_EMAIL ? 'green' : 'red');
    log(`Private Key: ${process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET'}`, 
        process.env.FIREBASE_PRIVATE_KEY ? 'green' : 'red');
    log(`Port: ${process.env.PORT || '5001'}`, 'green');
    
    // Check if already initialized
    if (admin.apps.length === 0) {
      log('\n🔧 Initializing Firebase Admin...', 'cyan');
      
      const config = {
        projectId: process.env.FIREBASE_PROJECT_ID
      };
      
      // Add credentials if available
      if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        config.credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        });
        log('✅ Using service account credentials', 'green');
      } else {
        log('⚠️ Using project ID only (emulator mode)', 'yellow');
      }
      
      admin.initializeApp(config);
      log('✅ Firebase Admin initialized', 'green');
    } else {
      log('✅ Firebase Admin already initialized', 'green');
    }
    
    // Test Firestore connection
    log('\n🗄️ Testing Firestore Connection...', 'cyan');
    const db = admin.firestore();
    
    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true
    });
    
    // Test basic Firestore operation (read system info)
    try {
      log('📡 Attempting to connect to Firestore...', 'yellow');
      
      // Use a minimal operation that doesn't require data
      const testRef = db.collection('_test_connection').doc('test');
      
      // This will either succeed or throw an error
      await testRef.get();
      
      log('✅ Firestore connection successful', 'green');
      
      // Test Auth service
      log('\n🔐 Testing Firebase Auth...', 'cyan');
      const auth = admin.auth();
      
      // Test a simple auth operation
      try {
        // This doesn't create anything, just tests the auth service
        await auth.listUsers(1);
        log('✅ Firebase Auth service available', 'green');
      } catch (authError) {
        if (authError.code === 'auth/insufficient-permission') {
          log('⚠️ Firebase Auth: Insufficient permissions (expected for service account)', 'yellow');
        } else {
          log(`⚠️ Firebase Auth: ${authError.message}`, 'yellow');
        }
      }
      
    } catch (firestoreError) {
      log(`❌ Firestore connection failed: ${firestoreError.message}`, 'red');
      
      if (firestoreError.message.includes('Could not reach Cloud Firestore backend')) {
        log('💡 This might be due to network issues or invalid credentials', 'yellow');
      }
      
      if (firestoreError.message.includes('service account')) {
        log('💡 Check your service account key configuration', 'yellow');
      }
    }
    
  } catch (error) {
    log(`❌ Firebase initialization failed: ${error.message}`, 'red');
    
    if (error.message.includes('privateKey')) {
      log('💡 Check your FIREBASE_PRIVATE_KEY format', 'yellow');
    }
    
    if (error.message.includes('projectId')) {
      log('💡 Check your FIREBASE_PROJECT_ID', 'yellow');
    }
  }
}

async function testGeminiConnection() {
  log('\n🤖 Testing Gemini AI Connection', 'bright');
  log('=================================', 'blue');
  
  const geminiApiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey || geminiApiKey.includes('your-')) {
    log('❌ Gemini API Key not configured', 'red');
    log('💡 Set GOOGLE_AI_API_KEY in your .env file', 'yellow');
    return;
  }
  
  log(`API Key: ${geminiApiKey.substring(0, 10)}...${geminiApiKey.slice(-4)}`, 'green');
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    log('🧪 Testing simple AI request...', 'yellow');
    
    // Test with a simple prompt
    const result = await model.generateContent("Say 'Connection test successful' in JSON format.");
    const response = await result.response;
    const text = response.text();
    
    log('✅ Gemini AI connection successful', 'green');
    log(`Response: ${text.substring(0, 100)}...`, 'cyan');
    
  } catch (error) {
    log(`❌ Gemini AI connection failed: ${error.message}`, 'red');
    
    if (error.message.includes('API_KEY')) {
      log('💡 Check your Gemini API key', 'yellow');
    }
    
    if (error.message.includes('quota')) {
      log('💡 API quota exceeded', 'yellow');
    }
  }
}

async function main() {
  log('🧪 Firebase & AI Connection Test Suite', 'bright');
  log('AI Vessel Finance Project', 'cyan');
  log('=' .repeat(50), 'blue');
  
  await testFirebaseConnection();
  await testGeminiConnection();
  
  log('\n' + '=' .repeat(50), 'blue');
  log('🎯 Connection Test Complete', 'bright');
  
  log('\n📋 Next Steps if Issues Found:', 'cyan');
  log('1. Verify Firebase project settings in console');
  log('2. Download and configure service account key');
  log('3. Ensure Firestore and Auth are enabled');
  log('4. Get valid Gemini API key from makersuite.google.com');
  log('5. Update .env files with correct values');
  
  process.exit(0);
}

main().catch(error => {
  log(`❌ Test suite error: ${error.message}`, 'red');
  process.exit(1);
});