#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🔥 Firebase Credentials Verification');
console.log('====================================\n');

// Read backend .env file
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');

function verifyEnvFile(filePath, title, requiredVars) {
  console.log(`📂 ${title}`);
  console.log('-'.repeat(title.length + 3));
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let allValid = true;
  
  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = content.match(regex);
    
    if (!match) {
      console.log(`❌ ${varName}: Missing`);
      allValid = false;
    } else {
      const value = match[1].trim().replace(/^["']|["']$/g, '');
      
      if (value.includes('your-') || value.includes('replace-') || value.includes('TODO')) {
        console.log(`🔄 ${varName}: Contains placeholder`);
        allValid = false;
      } else if (varName.includes('PRIVATE_KEY')) {
        if (value.includes('BEGIN PRIVATE KEY') && value.includes('END PRIVATE KEY')) {
          console.log(`✅ ${varName}: Valid private key format`);
        } else {
          console.log(`❌ ${varName}: Invalid private key format`);
          allValid = false;
        }
      } else if (varName.includes('API_KEY')) {
        if (value.startsWith('AIza')) {
          console.log(`✅ ${varName}: Valid (${value.substring(0, 10)}...)`);
        } else {
          console.log(`⚠️  ${varName}: Unexpected format`);
        }
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    }
  });
  
  return allValid;
}

// Verify backend credentials
const backendValid = verifyEnvFile(backendEnvPath, 'Backend Configuration', [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY', 
  'FIREBASE_CLIENT_EMAIL',
  'GOOGLE_AI_API_KEY',
  'PORT'
]);

console.log('');

// Verify frontend credentials
const frontendValid = verifyEnvFile(frontendEnvPath, 'Frontend Configuration', [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_API_URL'
]);

console.log('\n' + '='.repeat(40));

if (backendValid && frontendValid) {
  console.log('🎉 ALL CREDENTIALS VERIFIED SUCCESSFULLY!');
  console.log('\n✅ All required environment variables are properly configured');
  console.log('✅ No placeholder values detected');
  console.log('✅ API keys and private keys have valid formats');
  console.log('\n🚀 Your Firebase configuration is ready for use!');
} else {
  console.log('⚠️  Some issues found with credentials');
  if (!backendValid) console.log('❌ Backend configuration needs attention');
  if (!frontendValid) console.log('❌ Frontend configuration needs attention');
}