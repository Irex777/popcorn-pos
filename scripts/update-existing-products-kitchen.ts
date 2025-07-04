import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { products } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/popcorn_pos';
const sql = neon(connectionString);
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
      'cooked', 'baked', 'roasted', 'meal', 'dish', 'entree', 'main',
      'food', 'plate', 'bowl'
    ];
    
    const nonKitchenKeywords = [
      'drink', 'beverage', 'soda', 'water', 'juice', 'coffee', 'tea',
      'beer', 'wine', 'cocktail', 'smoothie', 'shake', 'cold', 'ice',
      'bottle', 'can', 'glass'
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
      
      if (hasNonKitchenKeyword) {
        requiresKitchen = false;
      } else if (hasKitchenKeyword) {
        requiresKitchen = true;
      } else {
        // Default to true for unclear items (better to have false positives in kitchen than miss items)
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
    console.log('\n💡 Products marked as requiring kitchen preparation:');
    
    // Show final results
    const updatedProducts = await db.select().from(products);
    const kitchenProducts = updatedProducts.filter(p => p.requiresKitchen);
    const nonKitchenProducts = updatedProducts.filter(p => !p.requiresKitchen);
    
    console.log('\n🍳 Kitchen items:');
    kitchenProducts.forEach(p => console.log(`  - ${p.name}`));
    
    console.log('\n🥤 Non-kitchen items:');
    nonKitchenProducts.forEach(p => console.log(`  - ${p.name}`));
    
  } catch (error) {
    console.error('❌ Error updating products:', error);
  }
}

// Run the migration
updateExistingProducts();