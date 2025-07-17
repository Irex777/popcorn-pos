#!/usr/bin/env node

// Comprehensive functionality test for Popcorn POS
// This script tests all core features to ensure they work end-to-end

const BASE_URL = 'http://localhost:3002';

async function testAPI(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`${method} ${endpoint} failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ ${method} ${endpoint} - SUCCESS`);
    return result;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} - ERROR:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting Popcorn POS Functionality Tests...\n');

  // Test 1: Check server health
  console.log('📋 Testing server health...');
  const health = await testAPI('GET', '/api/health');
  if (!health) {
    console.log('❌ Server health check failed - stopping tests');
    return;
  }

  // Test 2: Get shops
  console.log('\n📋 Testing shops endpoint...');
  const shops = await testAPI('GET', '/api/shops');
  if (!shops || shops.length === 0) {
    console.log('❌ No shops found - stopping tests');
    return;
  }
  
  const shopId = shops[0].id;
  console.log(`   Using shop ID: ${shopId}`);

  // Test 3: Get categories
  console.log('\n📋 Testing categories endpoint...');
  const categories = await testAPI('GET', `/api/shops/${shopId}/categories`);
  
  // Test 4: Create a test category
  console.log('\n📋 Testing category creation...');
  const testCategory = {
    name: 'Test Category',
    description: 'Test category for functionality test',
    color: '#ff0000',
    shopId: shopId
  };
  const createdCategory = await testAPI('POST', `/api/shops/${shopId}/categories`, testCategory);

  // Test 5: Get products
  console.log('\n📋 Testing products endpoint...');
  const products = await testAPI('GET', `/api/shops/${shopId}/products`);

  // Test 6: Create a test product
  console.log('\n📋 Testing product creation...');
  const testProduct = {
    name: 'Test Product',
    price: 10.99,
    description: 'Test product for functionality test',
    categoryId: createdCategory ? createdCategory.id : (categories && categories[0] ? categories[0].id : null),
    stock: 100,
    shopId: shopId
  };
  
  if (testProduct.categoryId) {
    const createdProduct = await testAPI('POST', `/api/shops/${shopId}/products`, testProduct);
    
    // Test 7: Create a test order
    if (createdProduct) {
      console.log('\n📋 Testing order creation...');
      const testOrder = {
        items: [{
          productId: createdProduct.id,
          quantity: 2,
          price: testProduct.price
        }],
        total: testProduct.price * 2,
        shopId: shopId
      };
      const createdOrder = await testAPI('POST', `/api/shops/${shopId}/orders`, testOrder);
      
      // Test 8: Get orders
      console.log('\n📋 Testing orders endpoint...');
      const orders = await testAPI('GET', `/api/shops/${shopId}/orders`);
      
      // Cleanup: Delete test order
      if (createdOrder) {
        console.log('\n🧹 Cleaning up test order...');
        await testAPI('DELETE', `/api/shops/${shopId}/orders/${createdOrder.id}`);
      }
    }
    
    // Cleanup: Delete test product
    if (createdProduct) {
      console.log('\n🧹 Cleaning up test product...');
      await testAPI('DELETE', `/api/shops/${shopId}/products/${createdProduct.id}`);
    }
  }

  // Cleanup: Delete test category
  if (createdCategory) {
    console.log('\n🧹 Cleaning up test category...');
    await testAPI('DELETE', `/api/shops/${shopId}/categories/${createdCategory.id}`);
  }

  console.log('\n✅ Functionality tests completed!');
  console.log('\nIf all tests show ✅ SUCCESS, the application is working correctly.');
  console.log('If any tests show ❌ ERROR, there are still issues to fix.');
}

// Run tests
runTests().catch(console.error);