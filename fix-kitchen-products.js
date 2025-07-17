#!/usr/bin/env node

// Script to update existing products to require kitchen preparation in restaurant shops
const fetch = globalThis.fetch;

const BASE_URL = 'http://localhost:3002';

async function fixKitchenProducts() {
  console.log('🔧 Fixing Kitchen Products for Restaurant Mode...\n');

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

    // 2. Get restaurant shops
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
    const restaurantShops = shops.filter(shop => shop.businessMode === 'restaurant');
    
    console.log(`Found ${restaurantShops.length} restaurant shops`);

    for (const shop of restaurantShops) {
      console.log(`\n3. Processing shop: ${shop.name}`);
      
      // Get products for this shop
      const productsResponse = await fetch(`${BASE_URL}/api/shops/${shop.id}/products`, {
        headers: {
          'Cookie': cookies
        }
      });

      if (!productsResponse.ok) {
        console.error(`Failed to fetch products for shop ${shop.id}`);
        continue;
      }

      const products = await productsResponse.json();
      const productsNeedingUpdate = products.filter(p => !p.requiresKitchen);
      
      console.log(`   - Found ${products.length} products, ${productsNeedingUpdate.length} need kitchen update`);

      // Update each product
      for (const product of productsNeedingUpdate) {
        try {
          const updateResponse = await fetch(`${BASE_URL}/api/shops/${shop.id}/products/${product.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookies
            },
            body: JSON.stringify({
              requiresKitchen: true
            })
          });

          if (updateResponse.ok) {
            console.log(`   ✅ Updated product: ${product.name}`);
          } else {
            console.log(`   ❌ Failed to update product: ${product.name}`);
          }
        } catch (error) {
          console.log(`   ❌ Error updating product ${product.name}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Kitchen products fix completed!');
    console.log('💡 Now all products in restaurant shops require kitchen preparation');
    console.log('   New orders will generate kitchen tickets automatically');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixKitchenProducts();