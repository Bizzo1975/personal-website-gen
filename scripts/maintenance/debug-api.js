// Script to test API endpoints directly without the browser
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api'; // Adjust port if needed
const DEBUG = true;

// Helper function to log with timestamp
function log(message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] ${message}`);
}

// Test API endpoints
async function testApiEndpoints() {
  log('=== TESTING API ENDPOINTS ===');
  
  // Test endpoints
  const endpoints = [
    { name: 'Get All Pages', method: 'GET', url: '/pages' },
  ];
  
  for (const endpoint of endpoints) {
    log(`\nTesting: ${endpoint.name} (${endpoint.method} ${endpoint.url})`);
    
    try {
      const url = `${API_BASE_URL}${endpoint.url}`;
      log(`Request URL: ${url}`);
      
      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const status = response.status;
      log(`Response Status: ${status} (${response.statusText})`);
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        log(`Error parsing JSON: ${e.message}`);
        data = null;
      }
      
      if (DEBUG && data) {
        if (Array.isArray(data)) {
          log(`Response Data: Array with ${data.length} items`);
          if (data.length > 0) {
            log(`Sample item: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
          }
        } else {
          log(`Response Data: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
        }
      }
      
      log(`Result: ${status >= 200 && status < 300 ? '✅ SUCCESS' : '❌ FAILED'}`);
      
    } catch (error) {
      log(`❌ ERROR: ${error.message}`);
      log('This could indicate the Next.js server is not running or there are network issues');
    }
  }
  
  log('\n=== TESTING RECOMMENDATIONS ===');
  log('If API requests are failing, check:');
  log('1. Make sure Next.js server is running (npx next dev)');
  log('2. Check for CORS issues in the API routes');
  log('3. Verify authentication is working (if endpoints require auth)');
  log('4. Check MongoDB connection in the API handlers');
  log('\nTo manually check API from the browser:');
  log('1. Open browser dev tools (F12)');
  log('2. Go to Network tab');
  log('3. Navigate to the admin dashboard');
  log('4. Look for API requests and check their status/response');
}

// Run the tests
testApiEndpoints(); 