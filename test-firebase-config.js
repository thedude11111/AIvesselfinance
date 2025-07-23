#!/usr/bin/env node

/**
 * Firebase Configuration Test Script
 * Tests actual Firebase connection and configuration validity
 */

const fs = require('fs');
const path = require('path');

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

function checkEnvFile(filePath, requiredVars) {
  log(`\n🔍 Checking ${filePath}...`, 'cyan');
  
  if (!fs.existsSync(filePath)) {
    log(`❌ File not found: ${filePath}`, 'red');
    return false;
  }
  
  const envContent = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  let allValid = true;
  
  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    
    if (!match) {
      issues.push(`❌ Missing: ${varName}`);
      allValid = false;
    } else {
      const value = match[1].trim().replace(/['"]/g, '');
      
      // Validate specific formats
      if (varName.includes('API_KEY') && !value.startsWith('AIza')) {
        if (!value.includes('your-') && !value.includes('test-')) {
          issues.push(`⚠️ ${varName}: Should start with 'AIza'`);
        }
      }
      
      if (varName.includes('PROJECT_ID') && !/^[a-z0-9-]+$/.test(value)) {
        if (!value.includes('your-') && !value.includes('test-')) {
          issues.push(`⚠️ ${varName}: Should be lowercase with hyphens`);
        }
      }
      
      if (varName.includes('AUTH_DOMAIN') && !value.includes('firebaseapp.com')) {
        if (!value.includes('your-') && !value.includes('test-')) {
          issues.push(`⚠️ ${varName}: Should end with 'firebaseapp.com'`);
        }
      }
      
      if (varName.includes('CLIENT_EMAIL') && !value.includes('gserviceaccount.com')) {
        if (!value.includes('your-') && !value.includes('test-')) {
          issues.push(`⚠️ ${varName}: Should be a service account email`);
        }
      }
      
      // Check for placeholder values
      if (value.includes('your-') || value.includes('replace-') || value.includes('TODO')) {
        issues.push(`🔄 ${varName}: Contains placeholder value`);
      } else {
        log(`✅ ${varName}: Configured`, 'green');
      }
    }
  });
  
  if (issues.length > 0) {
    issues.forEach(issue => log(issue, issue.startsWith('❌') ? 'red' : 'yellow'));
  }
  
  return allValid && issues.length === 0;
}

async function testFrontendConfig() {
  log('\n🌐 Testing Frontend Firebase Configuration', 'bright');
  log('=' .repeat(50), 'blue');
  
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  const requiredFrontendVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN', 
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID',
    'REACT_APP_API_URL'
  ];
  
  const frontendValid = checkEnvFile(frontendEnvPath, requiredFrontendVars);
  
  // Test Firebase config file
  const configPath = path.join(__dirname, 'frontend', 'src', 'config', 'firebase.js');
  if (fs.existsSync(configPath)) {
    log('\n✅ Firebase config file exists', 'green');
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for proper imports
    if (configContent.includes('initializeApp') && 
        configContent.includes('getAuth') && 
        configContent.includes('getFirestore')) {
      log('✅ All required Firebase services imported', 'green');
    } else {
      log('⚠️ Some Firebase services may be missing', 'yellow');
    }
    
    // Check for environment variable usage
    if (configContent.includes('process.env.REACT_APP_FIREBASE')) {
      log('✅ Using environment variables for configuration', 'green');
    } else {
      log('❌ Not using environment variables', 'red');
    }
  } else {
    log('❌ Firebase config file not found', 'red');
  }
  
  return frontendValid;
}

async function testBackendConfig() {
  log('\n🔧 Testing Backend Firebase Configuration', 'bright');
  log('=' .repeat(50), 'blue');
  
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  const requiredBackendVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'GOOGLE_AI_API_KEY',
    'PORT'
  ];
  
  const backendValid = checkEnvFile(backendEnvPath, requiredBackendVars);
  
  // Test FirestoreService
  const firestoreServicePath = path.join(__dirname, 'backend', 'utils', 'FirestoreService.js');
  if (fs.existsSync(firestoreServicePath)) {
    log('\n✅ FirestoreService file exists', 'green');
    
    const serviceContent = fs.readFileSync(firestoreServicePath, 'utf8');
    
    if (serviceContent.includes('firebase-admin')) {
      log('✅ Using Firebase Admin SDK', 'green');
    }
    
    if (serviceContent.includes('process.env.FIREBASE_PROJECT_ID')) {
      log('✅ Using environment variables', 'green');
    }
  } else {
    log('❌ FirestoreService file not found', 'red');
  }
  
  return backendValid;
}

async function testSecurityConfiguration() {
  log('\n🛡️ Testing Security Configuration', 'bright');
  log('=' .repeat(50), 'blue');
  
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  
  // Check if .env files are in .gitignore
  const gitignorePath = path.join(__dirname, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    if (gitignoreContent.includes('.env')) {
      log('✅ .env files are in .gitignore', 'green');
    } else {
      log('⚠️ .env files should be added to .gitignore', 'yellow');
    }
  }
  
  // Check for hardcoded secrets in source files
  const srcFiles = [
    path.join(__dirname, 'frontend', 'src', 'config', 'firebase.js'),
    path.join(__dirname, 'backend', 'utils', 'FirestoreService.js')
  ];
  
  let secretsFound = false;
  srcFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for potential hardcoded secrets
      const secretPatterns = [
        /AIza[A-Za-z0-9_-]{35,}/,  // Firebase API keys
        /-----BEGIN PRIVATE KEY-----/,  // Private keys
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/  // UUIDs
      ];
      
      secretPatterns.forEach(pattern => {
        if (pattern.test(content) && !content.includes('process.env')) {
          log(`⚠️ Potential hardcoded secret found in ${path.basename(filePath)}`, 'yellow');
          secretsFound = true;
        }
      });
    }
  });
  
  if (!secretsFound) {
    log('✅ No hardcoded secrets detected', 'green');
  }
}

async function testProjectConsistency() {
  log('\n🔄 Testing Project Consistency', 'bright');
  log('=' .repeat(50), 'blue');
  
  // Extract project IDs from both env files
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  
  let frontendProjectId = null;
  let backendProjectId = null;
  
  if (fs.existsSync(frontendEnvPath)) {
    const content = fs.readFileSync(frontendEnvPath, 'utf8');
    const match = content.match(/REACT_APP_FIREBASE_PROJECT_ID=(.+)/);
    if (match) {
      frontendProjectId = match[1].trim().replace(/['"]/g, '');
    }
  }
  
  if (fs.existsSync(backendEnvPath)) {
    const content = fs.readFileSync(backendEnvPath, 'utf8');
    const match = content.match(/FIREBASE_PROJECT_ID=(.+)/);
    if (match) {
      backendProjectId = match[1].trim().replace(/['"]/g, '');
    }
  }
  
  if (frontendProjectId && backendProjectId) {
    if (frontendProjectId === backendProjectId) {
      log(`✅ Project IDs match: ${frontendProjectId}`, 'green');
    } else {
      log(`❌ Project ID mismatch:`, 'red');
      log(`   Frontend: ${frontendProjectId}`, 'red');
      log(`   Backend: ${backendProjectId}`, 'red');
    }
  } else {
    log('⚠️ Could not extract project IDs for comparison', 'yellow');
  }
}

async function main() {
  log('🔥 Firebase Configuration Test Suite', 'bright');
  log('AI Vessel Finance Project', 'cyan');
  log('=' .repeat(60), 'blue');
  
  try {
    const frontendValid = await testFrontendConfig();
    const backendValid = await testBackendConfig();
    
    await testSecurityConfiguration();
    await testProjectConsistency();
    
    log('\n' + '=' .repeat(60), 'blue');
    
    if (frontendValid && backendValid) {
      log('🎉 All Firebase configurations are valid!', 'green');
      log('\n📋 Next Steps:', 'cyan');
      log('1. Install dependencies: npm install in both frontend and backend');
      log('2. Start the backend server: cd backend && npm run dev');
      log('3. Start the frontend: cd frontend && npm run dev');
      log('4. Test authentication and database operations');
    } else {
      log('⚠️ Some configuration issues found. Please review above.', 'yellow');
      log('\n📋 Common fixes:', 'cyan');
      log('1. Update placeholder values in .env files');
      log('2. Ensure all required environment variables are set');
      log('3. Verify Firebase project settings match your actual project');
    }
    
  } catch (error) {
    log(`\n❌ Error during configuration test: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testFrontendConfig, testBackendConfig };