/**
 * Test script for waifu.it API integration
 * Run with: node test-waifu-api.js
 */

const fetch = require('node-fetch');

const ENDPOINTS = [
  '/hug',
  '/kiss',
  '/dance',
  '/waifu',
  '/husbando'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\nTesting: ${endpoint}`);
    const url = `https://waifu.it/api/v4${endpoint}`;
    
    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      console.log(`  ❌ Failed: HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (!data || !data.url) {
      console.log(`  ❌ Invalid response format`);
      return false;
    }
    
    console.log(`  ✅ Success (${duration}ms)`);
    console.log(`  URL: ${data.url}`);
    return true;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('=================================');
  console.log('Waifu.it API Integration Test');
  console.log('=================================');
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=================================');
  console.log('Test Results');
  console.log('=================================');
  console.log(`Passed: ${passed}/${ENDPOINTS.length}`);
  console.log(`Failed: ${failed}/${ENDPOINTS.length}`);
  console.log('=================================\n');
  
  if (failed === 0) {
    console.log('✅ All tests passed! API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the API or network connection.');
  }
}

runTests().catch(console.error);
