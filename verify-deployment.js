#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests backend connectivity and CORS configuration
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://aoi-bot-1bin.onrender.com';
const FRONTEND_URL = 'https://aoisenpai.netlify.app';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', reject);
  });
}

async function testBackendHealth() {
  log('\n🔍 Testing Backend Health...', 'cyan');
  
  try {
    const response = await makeRequest(BACKEND_URL);
    
    if (response.statusCode === 200) {
      log('✅ Backend is reachable', 'green');
      log(`   Response: ${response.body.substring(0, 100)}...`, 'blue');
      return true;
    } else {
      log(`❌ Backend returned status ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Backend is not reachable: ${error.message}`, 'red');
    log('   💡 Tip: Render free tier may be sleeping. Try accessing the URL in browser first.', 'yellow');
    return false;
  }
}

async function testAuthEndpoint() {
  log('\n🔍 Testing Auth Endpoint...', 'cyan');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/check-auth`);
    
    if (response.statusCode === 200) {
      log('✅ Auth endpoint is working', 'green');
      log(`   Response: ${response.body}`, 'blue');
      return true;
    } else {
      log(`❌ Auth endpoint returned status ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Auth endpoint failed: ${error.message}`, 'red');
    return false;
  }
}

async function testSocketIO() {
  log('\n🔍 Testing Socket.IO Endpoint...', 'cyan');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/socket.io/?EIO=4&transport=polling`);
    
    if (response.statusCode === 200 && response.body.includes('sid')) {
      log('✅ Socket.IO endpoint is working', 'green');
      log(`   Response: ${response.body.substring(0, 100)}...`, 'blue');
      return true;
    } else {
      log(`❌ Socket.IO endpoint returned unexpected response`, 'red');
      log(`   Status: ${response.statusCode}`, 'red');
      log(`   Body: ${response.body}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Socket.IO endpoint failed: ${error.message}`, 'red');
    return false;
  }
}

async function testCORS() {
  log('\n🔍 Testing CORS Headers...', 'cyan');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/check-auth`, {
      headers: {
        'Origin': FRONTEND_URL
      }
    });
    
    const corsHeader = response.headers['access-control-allow-origin'];
    const credentialsHeader = response.headers['access-control-allow-credentials'];
    
    if (corsHeader === FRONTEND_URL) {
      log('✅ CORS origin header is correct', 'green');
      log(`   Access-Control-Allow-Origin: ${corsHeader}`, 'blue');
    } else if (corsHeader === '*') {
      log('⚠️  CORS is using wildcard (*) - this will cause issues with credentials!', 'yellow');
      log('   💡 Make sure ALLOWED_ORIGINS is set in Render environment variables', 'yellow');
    } else {
      log(`❌ CORS origin header is incorrect: ${corsHeader}`, 'red');
    }
    
    if (credentialsHeader === 'true') {
      log('✅ CORS credentials header is correct', 'green');
    } else {
      log(`❌ CORS credentials header is missing or incorrect: ${credentialsHeader}`, 'red');
    }
    
    return corsHeader === FRONTEND_URL && credentialsHeader === 'true';
  } catch (error) {
    log(`❌ CORS test failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkEnvironmentVariables() {
  log('\n📋 Environment Variables Checklist', 'cyan');
  log('   Please verify these are set in Render dashboard:', 'blue');
  log('   - ALLOWED_ORIGINS (should include: https://aoisenpai.netlify.app)', 'blue');
  log('   - DASHBOARD_USERNAME', 'blue');
  log('   - DASHBOARD_PASSWORD', 'blue');
  log('   - SESSION_SECRET', 'blue');
  log('   - BOT_TOKEN', 'blue');
  log('   - MONGO_URI', 'blue');
}

async function main() {
  log('═══════════════════════════════════════════════════', 'cyan');
  log('   Deployment Verification Script', 'cyan');
  log('═══════════════════════════════════════════════════', 'cyan');
  
  log(`\n🎯 Backend URL: ${BACKEND_URL}`, 'blue');
  log(`🎯 Frontend URL: ${FRONTEND_URL}`, 'blue');
  
  const results = {
    backendHealth: await testBackendHealth(),
    authEndpoint: await testAuthEndpoint(),
    socketIO: await testSocketIO(),
    cors: await testCORS()
  };
  
  await checkEnvironmentVariables();
  
  log('\n═══════════════════════════════════════════════════', 'cyan');
  log('   Test Results Summary', 'cyan');
  log('═══════════════════════════════════════════════════', 'cyan');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${icon} ${test}: ${passed ? 'PASSED' : 'FAILED'}`, color);
  });
  
  if (allPassed) {
    log('\n🎉 All tests passed! Your deployment should work correctly.', 'green');
    log('   Next steps:', 'blue');
    log('   1. Deploy your frontend to Netlify', 'blue');
    log('   2. Visit https://aoisenpai.netlify.app', 'blue');
    log('   3. Try logging in', 'blue');
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    log('   Common fixes:', 'blue');
    log('   1. Set ALLOWED_ORIGINS in Render environment variables', 'blue');
    log('   2. Redeploy your backend after setting environment variables', 'blue');
    log('   3. Wait 30-60 seconds for Render free tier to wake up', 'blue');
    log('   4. Check Render logs for any errors', 'blue');
  }
  
  log('\n📚 For detailed instructions, see: FINAL_DEPLOYMENT_FIX.md', 'cyan');
}

main().catch(error => {
  log(`\n❌ Script error: ${error.message}`, 'red');
  process.exit(1);
});
