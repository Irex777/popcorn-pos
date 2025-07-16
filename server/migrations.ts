import { db } from './db.js';
import { sql } from 'drizzle-orm';

export async function runStartupMigrations() {
  console.log('🔄 Running startup migrations...');
  
  try {
    // Check if business_mode column exists
    const columnExists = await db.execute(sql`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'shops' AND column_name = 'business_mode'
    `);
    
    if (columnExists.rows.length === 0) {
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
    
    console.log('✅ Startup migrations completed successfully');
  } catch (error) {
    console.error('❌ Startup migration failed:', error);
    // Don't throw error to prevent app from crashing
  }
}