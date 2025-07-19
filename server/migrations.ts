import { db } from './db.js';
import { sql } from 'drizzle-orm';

export async function runStartupMigrations() {
  console.log('🔄 Running startup migrations...');
  
  try {
    // Migration 1: Check if business_mode column exists
    const businessModeExists = await db.execute(sql`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'shops' AND column_name = 'business_mode'
    `);
    
    if (businessModeExists.rows.length === 0) {
      console.log('📋 Adding business_mode column to shops table...');
      
      // Add the business_mode column
      await db.execute(sql`
        ALTER TABLE shops ADD COLUMN business_mode TEXT NOT NULL DEFAULT 'shop'
      `);
      
      // Add the check constraint
      await db.execute(sql`
        ALTER TABLE shops ADD CONSTRAINT check_business_mode 
        CHECK (business_mode IN ('shop', 'restaurant'))
      `);
      
      console.log('✅ business_mode column added successfully');
    } else {
      console.log('✅ business_mode column already exists');
    }
    
    // Ensure all existing shops have business_mode set
    await db.execute(sql`
      UPDATE shops SET business_mode = 'shop' WHERE business_mode IS NULL
    `);

    // Migration 2: Check if payment_method column exists in orders table
    const paymentMethodExists = await db.execute(sql`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'payment_method'
    `);
    
    if (paymentMethodExists.rows.length === 0) {
      console.log('📋 Adding payment_method column to orders table...');
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN payment_method TEXT
      `);
      console.log('✅ payment_method column added successfully');
    } else {
      console.log('✅ payment_method column already exists');
    }

    // Migration 3: Check if completed_at column exists in orders table
    const completedAtExists = await db.execute(sql`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'completed_at'
    `);
    
    if (completedAtExists.rows.length === 0) {
      console.log('📋 Adding completed_at column to orders table...');
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN completed_at TIMESTAMP
      `);
      console.log('✅ completed_at column added successfully');
    } else {
      console.log('✅ completed_at column already exists');
    }

    // Migration 4: Check if requires_kitchen column exists in products table
    const requiresKitchenExists = await db.execute(sql`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'requires_kitchen'
    `);
    
    if (requiresKitchenExists.rows.length === 0) {
      console.log('📋 Adding requires_kitchen column to products table...');
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN requires_kitchen BOOLEAN NOT NULL DEFAULT false
      `);
      
      // Create index for performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_products_requires_kitchen ON products(requires_kitchen)
      `);
      
      console.log('✅ requires_kitchen column added successfully');
    } else {
      console.log('✅ requires_kitchen column already exists');
    }
    
    console.log('✅ Startup migrations completed successfully');
  } catch (error) {
    console.error('❌ Startup migration failed:', error);
    // Don't throw error to prevent app from crashing
  }
}