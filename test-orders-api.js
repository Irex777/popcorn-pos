#!/usr/bin/env node

// Simple test script to check orders API
const fetch = globalThis.fetch;

const BASE_URL = 'http://localhost:3002';

async function testOrdersAPI() {
  console.log('🔍 Testing Orders API with Product Data...\n');

  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');

    // 2. Get orders
    console.log('\n2. Fetching orders...');
    const ordersResponse = await fetch(`${BASE_URL}/api/shops/1/orders`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (!ordersResponse.ok) {
      throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
    }

    const orders = await ordersResponse.json();
    console.log(`✅ Found ${orders.length} orders`);

    if (orders.length > 0) {
      const firstOrder = orders[0];
      console.log('\n📋 First order details:');
      console.log(`   - Order ID: ${firstOrder.id}`);
      console.log(`   - Total: ${firstOrder.total}`);
      console.log(`   - Status: ${firstOrder.status}`);
      console.log(`   - Items count: ${firstOrder.items ? firstOrder.items.length : 'No items'}`);
      
      if (firstOrder.items && firstOrder.items.length > 0) {
        const firstItem = firstOrder.items[0];
        console.log('\n🍿 First item details:');
        console.log(`   - Quantity: ${firstItem.quantity}`);
        console.log(`   - Product ID: ${firstItem.productId}`);
        console.log(`   - Product object:`, firstItem.product);
        console.log(`   - Product name: ${firstItem.product?.name || 'MISSING'}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOrdersAPI();