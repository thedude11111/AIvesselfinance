#!/usr/bin/env node

/**
 * Test Runner Script for AI Vessel Finance
 * Orchestrates testing across frontend and backend
 */

const { execSync } = require('child_process');
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

function execCommand(command, cwd, description) {
  log(`\n${description}...`, 'cyan');
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    return false;
  }
}

function checkDependencies(dir, name) {
  const packageJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log(`❌ ${name} package.json not found`, 'red');
    return false;
  }
  
  const nodeModulesPath = path.join(dir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log(`📦 Installing ${name} dependencies...`, 'yellow');
    return execCommand('npm install', dir, `${name} dependency installation`);
  }
  
  return true;
}

function generateSummaryReport() {
  log('\n📊 Generating Test Summary Report...', 'cyan');
  
  const backendCoverageFile = path.join(__dirname, 'backend', 'coverage', 'coverage-summary.json');
  const frontendCoverageFile = path.join(__dirname, 'frontend', 'coverage', 'coverage-summary.json');
  
  let summary = {
    backend: null,
    frontend: null,
    timestamp: new Date().toISOString()
  };
  
  // Read backend coverage
  if (fs.existsSync(backendCoverageFile)) {
    try {
      summary.backend = JSON.parse(fs.readFileSync(backendCoverageFile, 'utf8'));
    } catch (error) {
      log('⚠️ Could not read backend coverage report', 'yellow');
    }
  }
  
  // Read frontend coverage
  if (fs.existsSync(frontendCoverageFile)) {
    try {
      summary.frontend = JSON.parse(fs.readFileSync(frontendCoverageFile, 'utf8'));
    } catch (error) {
      log('⚠️ Could not read frontend coverage report', 'yellow');
    }
  }
  
  // Generate summary
  log('\n📋 TEST SUMMARY REPORT', 'bright');
  log('=' .repeat(50), 'blue');
  
  if (summary.backend && summary.backend.total) {
    const backend = summary.backend.total;
    log(`\nBackend Coverage:`, 'cyan');
    log(`  Lines: ${backend.lines.pct}%`, backend.lines.pct >= 70 ? 'green' : 'red');
    log(`  Functions: ${backend.functions.pct}%`, backend.functions.pct >= 70 ? 'green' : 'red');
    log(`  Branches: ${backend.branches.pct}%`, backend.branches.pct >= 70 ? 'green' : 'red');
    log(`  Statements: ${backend.statements.pct}%`, backend.statements.pct >= 70 ? 'green' : 'red');
  }
  
  if (summary.frontend && summary.frontend.total) {
    const frontend = summary.frontend.total;
    log(`\nFrontend Coverage:`, 'cyan');
    log(`  Lines: ${frontend.lines.pct}%`, frontend.lines.pct >= 70 ? 'green' : 'red');
    log(`  Functions: ${frontend.functions.pct}%`, frontend.functions.pct >= 70 ? 'green' : 'red');
    log(`  Branches: ${frontend.branches.pct}%`, frontend.branches.pct >= 70 ? 'green' : 'red');
    log(`  Statements: ${frontend.statements.pct}%`, frontend.statements.pct >= 70 ? 'green' : 'red');
  }
  
  // Save combined report
  const reportPath = path.join(__dirname, 'test-summary.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  log(`\n📄 Test summary saved to: ${reportPath}`, 'blue');
  
  return summary;
}

function main() {
  const args = process.argv.slice(2);
  const runType = args[0] || 'all';
  
  log('🧪 AI Vessel Finance Test Runner', 'bright');
  log('================================', 'blue');
  
  const backendDir = path.join(__dirname, 'backend');
  const frontendDir = path.join(__dirname, 'frontend');
  
  let success = true;
  
  switch (runType) {
    case 'backend':
      log('\n🔧 Running Backend Tests Only', 'yellow');
      if (!checkDependencies(backendDir, 'Backend')) {
        success = false;
        break;
      }
      success = execCommand('npm run test:coverage', backendDir, 'Backend tests');
      break;
      
    case 'frontend':
      log('\n⚛️ Running Frontend Tests Only', 'yellow');
      if (!checkDependencies(frontendDir, 'Frontend')) {
        success = false;
        break;
      }
      success = execCommand('npm run test:coverage', frontendDir, 'Frontend tests');
      break;
      
    case 'unit':
      log('\n🧩 Running Unit Tests Only', 'yellow');
      if (!checkDependencies(backendDir, 'Backend')) {
        success = false;
        break;
      }
      success = execCommand('npm test -- --testNamePattern="unit"', backendDir, 'Unit tests');
      break;
      
    case 'integration':
      log('\n🔗 Running Integration Tests Only', 'yellow');
      if (!checkDependencies(backendDir, 'Backend')) {
        success = false;
        break;
      }
      success = execCommand('npm test -- --testNamePattern="integration"', backendDir, 'Integration tests');
      break;
      
    case 'watch':
      log('\n👀 Running Tests in Watch Mode', 'yellow');
      if (args[1] === 'frontend') {
        execCommand('npm test -- --watch', frontendDir, 'Frontend tests (watch mode)');
      } else {
        execCommand('npm run test:watch', backendDir, 'Backend tests (watch mode)');
      }
      return;
      
    case 'all':
    default:
      log('\n🎯 Running Full Test Suite', 'yellow');
      
      // Check dependencies
      if (!checkDependencies(backendDir, 'Backend') || !checkDependencies(frontendDir, 'Frontend')) {
        success = false;
        break;
      }
      
      // Run backend tests
      if (!execCommand('npm run test:coverage', backendDir, 'Backend tests')) {
        success = false;
      }
      
      // Run frontend tests
      if (!execCommand('npm run test:coverage', frontendDir, 'Frontend tests')) {
        success = false;
      }
      
      // Generate summary report
      generateSummaryReport();
      break;
  }
  
  // Final result
  log('\n' + '='.repeat(50), 'blue');
  if (success) {
    log('🎉 All tests completed successfully!', 'green');
    process.exit(0);
  } else {
    log('💥 Some tests failed. Please review the output above.', 'red');
    process.exit(1);
  }
}

// Usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('🧪 AI Vessel Finance Test Runner', 'bright');
  log('\nUsage: node test-runner.js [command]', 'cyan');
  log('\nCommands:', 'yellow');
  log('  all        Run all tests (default)');
  log('  backend    Run backend tests only');
  log('  frontend   Run frontend tests only');
  log('  unit       Run unit tests only');
  log('  integration Run integration tests only');
  log('  watch      Run tests in watch mode');
  log('  watch frontend  Run frontend tests in watch mode');
  log('\nFlags:', 'yellow');
  log('  --help, -h Show this help message');
  process.exit(0);
}

main();