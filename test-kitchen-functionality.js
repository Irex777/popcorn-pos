#!/usr/bin/env node

// Simple test script to verify kitchen functionality
const fetch = globalThis.fetch;

const BASE_URL = 'http://localhost:3002';

async function testKitchenFunctionality() {
  console.log('🧪 Testing Kitchen Functionality...\n');

  try {
    // 1. Login as admin (assuming admin/admin123 exists)
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

    // 2. Get shops and find restaurant mode shop
    console.log('\n2. Fetching shops...');
    const shopsResponse = await fetch(`${BASE_URL}/api/shops`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (!shopsResponse.ok) {
      throw new Error(`Failed to fetch shops: ${shopsResponse.status}`);
    }

    const shops = await shopsResponse.json();
    console.log(`Found ${shops.length} shops`);
    
    let restaurantShop = shops.find(shop => shop.businessMode === 'restaurant');
    
    if (!restaurantShop) {
      console.log('⚠️  No restaurant shop found, creating one...');
      const createShopResponse = await fetch(`${BASE_URL}/api/shops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          name: 'Test Restaurant',
          businessMode: 'restaurant',
          address: 'Test Address'
        })
      });

      if (!createShopResponse.ok) {
        throw new Error(`Failed to create restaurant shop: ${createShopResponse.status}`);
      }

      restaurantShop = await createShopResponse.json();
      console.log('✅ Restaurant shop created');
    } else {
      console.log('✅ Restaurant shop found:', restaurantShop.name);
    }

    // 3. Check for products with requiresKitchen = true
    console.log('\n3. Checking products with kitchen requirements...');
    const productsResponse = await fetch(`${BASE_URL}/api/shops/${restaurantShop.id}/products`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (!productsResponse.ok) {
      throw new Error(`Failed to fetch products: ${productsResponse.status}`);
    }

    const products = await productsResponse.json();
    const kitchenProducts = products.filter(p => p.requiresKitchen === true);
    
    console.log(`Found ${products.length} total products, ${kitchenProducts.length} require kitchen`);

    if (kitchenProducts.length === 0) {
      console.log('⚠️  No kitchen products found. Kitchen tickets won\'t be generated!');
      console.log('💡 To test kitchen functionality:');
      console.log('   1. Go to Inventory → Add Product');
      console.log('   2. Check "Requires Kitchen Preparation"');
      console.log('   3. Create and save the product');
      console.log('   4. Place an order with that product');
    } else {
      console.log('✅ Kitchen products found:', kitchenProducts.map(p => p.name).join(', '));
    }

    // 4. Check existing kitchen tickets
    console.log('\n4. Checking existing kitchen tickets...');
    const ticketsResponse = await fetch(`${BASE_URL}/api/shops/${restaurantShop.id}/kitchen/tickets`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (!ticketsResponse.ok) {
      throw new Error(`Failed to fetch kitchen tickets: ${ticketsResponse.status}`);
    }

    const tickets = await ticketsResponse.json();
    console.log(`Found ${tickets.length} kitchen tickets`);

    if (tickets.length > 0) {
      console.log('✅ Kitchen tickets exist:');
      tickets.forEach(ticket => {
        console.log(`   - Ticket #${ticket.ticketNumber}: ${ticket.status} (Order #${ticket.orderId})`);
      });
    } else {
      console.log('⚠️  No kitchen tickets found');
    }

    console.log('\n🔍 Summary:');
    console.log(`   - Restaurant shop: ${restaurantShop ? '✅' : '❌'}`);
    console.log(`   - Products requiring kitchen: ${kitchenProducts.length > 0 ? '✅' : '❌'}`);
    console.log(`   - Kitchen tickets: ${tickets.length > 0 ? '✅' : '❌'}`);

    if (kitchenProducts.length === 0) {
      console.log('\n❗ Issue identified: No products are marked as requiring kitchen preparation');
      console.log('   This is why no kitchen tickets are being generated.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testKitchenFunctionality();