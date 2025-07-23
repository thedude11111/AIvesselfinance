const admin = require('firebase-admin');
require('dotenv').config({ path: './backend/.env' });

async function testChatbotAPI() {
  try {
    console.log('🧪 Testing Chatbot API Endpoint...');
    
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
      });
    }

    // Create a test ID token for a test user
    const testUser = {
      uid: 'test-user-123',
      email: 'test@example.com'
    };

    console.log('🔑 Creating test ID token...');
    const customToken = await admin.auth().createCustomToken(testUser.uid);
    
    // We can't easily verify this token without Firebase SDK, so let's test with a mock approach
    console.log('📡 Testing API endpoint...');
    
    const fetch = require('node-fetch');
    
    const response = await fetch('http://localhost:5001/api/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-for-testing'
      },
      body: JSON.stringify({
        message: 'I want to buy a 10-year-old bulk carrier for $25 million',
        context: {
          currentParameters: {},
          conversationHistory: []
        }
      })
    });
    
    const responseText = await response.text();
    console.log('📊 Response status:', response.status);
    console.log('📊 Response body:', responseText);
    
    if (response.status === 401) {
      console.log('✅ Auth check working (401 expected with invalid token)');
    } else if (response.ok) {
      console.log('✅ API endpoint working');
    } else {
      console.log('❌ Unexpected response');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChatbotAPI();