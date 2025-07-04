const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { products } = require('../shared/schema.ts');
const { eq } = require('drizzle-orm');

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/popcorn_pos';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function updateExistingProducts() {
  try {
    console.log('🔍 Checking existing products...');
    
    // Get all existing products
    const allProducts = await db.select().from(products);
    console.log(`📦 Found ${allProducts.length} existing products`);
    
    if (allProducts.length === 0) {
      console.log('ℹ️  No existing products found. Nothing to update.');
      return;
    }
    
    // Display products for review
    console.log('\n📋 Current products:');
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price} (Kitchen: ${product.requiresKitchen || 'undefined'})`);
    });
    
    // Update products that likely require kitchen preparation
    const kitchenKeywords = [
      'pizza', 'burger', 'sandwich', 'pasta', 'salad', 'soup', 'steak', 
      'chicken', 'fish', 'fries', 'wings', 'hot', 'grilled', 'fried',
      'cooked', 'baked', 'roasted', 'meal', 'dish', 'entree', 'main'
    ];
    
    const nonKitchenKeywords = [
      'drink', 'beverage', 'soda', 'water', 'juice', 'coffee', 'tea',
      'beer', 'wine', 'cocktail', 'smoothie', 'shake', 'cold', 'ice'
    ];
    
    let updatedCount = 0;
    
    for (const product of allProducts) {
      const productName = product.name.toLowerCase();
      let requiresKitchen = false;
      
      // Check if product name contains kitchen-related keywords
      const hasKitchenKeyword = kitchenKeywords.some(keyword => 
        productName.includes(keyword)
      );
      
      const hasNonKitchenKeyword = nonKitchenKeywords.some(keyword => 
        productName.includes(keyword)
      );
      
      if (hasKitchenKeyword && !hasNonKitchenKeyword) {
        requiresKitchen = true;
      } else if (hasNonKitchenKeyword) {
        requiresKitchen = false;
      } else {
        // Default to true for food items, false for unclear items
        // You can adjust this logic based on your needs
        requiresKitchen = true;
      }
      
      // Update the product
      await db
        .update(products)
        .set({ requiresKitchen })
        .where(eq(products.id, product.id));
      
      console.log(`✅ Updated "${product.name}" - Kitchen required: ${requiresKitchen}`);
      updatedCount++;
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} products!`);
    console.log('\n📝 Review the updates and manually adjust any products as needed through the admin interface.');
    
  } catch (error) {
    console.error('❌ Error updating products:', error);
  } finally {
    await sql.end();
  }
}

// Run the migration
updateExistingProducts();