#!/usr/bin/env node

import http from 'http';
import querystring from 'querystring';

// Test configuration
const BASE_URL = 'http://localhost:3002';
const TEST_USER = {
  username: 'testuser123',
  password: 'testpass123'
};

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Extract cookies from response headers
function extractCookies(headers) {
  const cookies = headers['set-cookie'] || [];
  return cookies.map(cookie => cookie.split(';')[0]).join('; ');
}

async function testAuthFlow() {
  console.log('🔍 Testing Authentication Flow...\n');
  
  let sessionCookie = '';
  
  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server health...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/health',
      method: 'GET'
    });
    
    if (healthResponse.statusCode === 200) {
      console.log('✅ Server is running');
      console.log('📊 Health data:', healthResponse.data);
    } else {
      console.log('❌ Server health check failed:', healthResponse.statusCode);
      return;
    }
    
    // Test 2: Check unauthenticated user endpoint
    console.log('\n2️⃣ Testing unauthenticated /api/user...');
    const unauthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/user',
      method: 'GET'
    });
    
    console.log('📊 Status:', unauthResponse.statusCode);
    console.log('📊 Response:', unauthResponse.data);
    
    if (unauthResponse.statusCode === 401) {
      console.log('✅ Correctly returns 401 for unauthenticated user');
    } else {
      console.log('⚠️ Unexpected response for unauthenticated user');
    }
    
    // Extract any initial cookies
    if (unauthResponse.headers['set-cookie']) {
      sessionCookie = extractCookies(unauthResponse.headers);
      console.log('🍪 Initial session cookie:', sessionCookie);
    }
    
    // Test 3: Register a new user
    console.log('\n3️⃣ Testing user registration...');
    const registerData = JSON.stringify(TEST_USER);
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registerData),
        'Cookie': sessionCookie
      }
    }, registerData);
    
    console.log('📊 Register Status:', registerResponse.statusCode);
    console.log('📊 Register Response:', registerResponse.data);
    
    if (registerResponse.statusCode === 201) {
      console.log('✅ User registered successfully');
      // Update session cookie after registration
      if (registerResponse.headers['set-cookie']) {
        sessionCookie = extractCookies(registerResponse.headers);
        console.log('🍪 Updated session cookie after registration:', sessionCookie);
      }
    } else if (registerResponse.statusCode === 400 && registerResponse.data?.error?.includes('already exists')) {
      console.log('ℹ️ User already exists, proceeding with login test');
    } else {
      console.log('❌ Registration failed unexpectedly');
    }
    
    // Test 4: Login with the user
    console.log('\n4️⃣ Testing user login...');
    const loginData = JSON.stringify(TEST_USER);
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData),
        'Cookie': sessionCookie
      }
    }, loginData);
    
    console.log('📊 Login Status:', loginResponse.statusCode);
    console.log('📊 Login Response:', loginResponse.data);
    
    if (loginResponse.statusCode === 200) {
      console.log('✅ Login successful');
      // Update session cookie after login
      if (loginResponse.headers['set-cookie']) {
        sessionCookie = extractCookies(loginResponse.headers);
        console.log('🍪 Updated session cookie after login:', sessionCookie);
      }
    } else {
      console.log('❌ Login failed');
      console.log('🔍 Login error details:', loginResponse.rawData);
    }
    
    // Test 5: Check authenticated user endpoint
    console.log('\n5️⃣ Testing authenticated /api/user...');
    const authResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/user',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log('📊 Auth Status:', authResponse.statusCode);
    console.log('📊 Auth Response:', authResponse.data);
    
    if (authResponse.statusCode === 200) {
      console.log('✅ Successfully authenticated and retrieved user data');
    } else {
      console.log('❌ Failed to retrieve user data after login');
      console.log('🔍 Auth error details:', authResponse.rawData);
    }
    
    // Test 6: Test logout
    console.log('\n6️⃣ Testing logout...');
    const logoutResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/logout',
      method: 'POST',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log('📊 Logout Status:', logoutResponse.statusCode);
    console.log('📊 Logout Response:', logoutResponse.data);
    
    if (logoutResponse.statusCode === 200) {
      console.log('✅ Logout successful');
    } else {
      console.log('❌ Logout failed');
    }
    
    // Test 7: Verify logout worked
    console.log('\n7️⃣ Testing /api/user after logout...');
    const postLogoutResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/user',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log('📊 Post-logout Status:', postLogoutResponse.statusCode);
    console.log('📊 Post-logout Response:', postLogoutResponse.data);
    
    if (postLogoutResponse.statusCode === 401) {
      console.log('✅ Logout verification successful - user is no longer authenticated');
    } else {
      console.log('❌ Logout verification failed - user still appears authenticated');
    }
    
    console.log('\n🎯 Authentication Flow Test Complete!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testAuthFlow();