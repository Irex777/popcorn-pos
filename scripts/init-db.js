#!/usr/bin/env node

/**
 * Database initialization script
 * Creates all tables and initial data for Popcorn POS
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema.js';
import * as bcrypt from 'bcrypt';

// Load environment variables
config();

console.log('🚀 Starting database initialization...');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

const db = drizzle(pool, { schema });

async function initializeDatabase() {
  try {
    console.log('📋 Creating database tables...');
    
    // Create all tables using Drizzle schema
    const createTablesSQL = `
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Create shops table
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by_id INTEGER REFERENCES users(id) NOT NULL
      );

      -- Create user_shops junction table
      CREATE TABLE IF NOT EXISTS user_shops (
        user_id INTEGER REFERENCES users(id) NOT NULL,
        shop_id INTEGER REFERENCES shops(id) NOT NULL,
        PRIMARY KEY (user_id, shop_id)
      );

      -- Create categories table
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL DEFAULT '#94A3B8',
        shop_id INTEGER REFERENCES shops(id) NOT NULL
      );

      -- Create products table
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER REFERENCES categories(id) NOT NULL,
        image_url TEXT NOT NULL DEFAULT '',
        stock INTEGER NOT NULL DEFAULT 0,
        shop_id INTEGER REFERENCES shops(id) NOT NULL
      );

      -- Create orders table
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        total DECIMAL(10,2) NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        user_id INTEGER REFERENCES users(id),
        shop_id INTEGER REFERENCES shops(id) NOT NULL
      );

      -- Create order_items table
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) NOT NULL,
        product_id INTEGER REFERENCES products(id) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL
      );

      -- Create stripe_settings table
      CREATE TABLE IF NOT EXISTS stripe_settings (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER REFERENCES shops(id) NOT NULL UNIQUE,
        publishable_key TEXT,
        secret_key TEXT,
        enabled BOOLEAN NOT NULL DEFAULT false
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_user_shops_user_id ON user_shops(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_shops_shop_id ON user_shops(shop_id);
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `;

    await pool.query(createTablesSQL);
    console.log('✅ Database tables created successfully');

    // Check if admin user exists
    const adminUser = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (adminUser.rows.length === 0) {
      console.log('👤 Creating default admin user...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminResult = await pool.query(
        'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3) RETURNING id',
        ['admin', hashedPassword, true]
      );
      
      console.log('✅ Default admin user created (admin/admin123)');
      
      // Create default shop
      const shopResult = await pool.query(
        'INSERT INTO shops (name, address, created_by_id) VALUES ($1, $2, $3) RETURNING id',
        ['Default Shop', '123 Main Street', adminResult.rows[0].id]
      );
      
      console.log('✅ Default shop created');
      
      // Create default categories
      const categoryResult = await pool.query(
        'INSERT INTO categories (name, description, color, shop_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Beverages', 'Drinks and beverages', '#3B82F6', shopResult.rows[0].id]
      );
      
      await pool.query(
        'INSERT INTO categories (name, description, color, shop_id) VALUES ($1, $2, $3, $4)',
        ['Snacks', 'Snacks and quick bites', '#EF4444', shopResult.rows[0].id]
      );
      
      console.log('✅ Default categories created');
      
      // Create sample products
      await pool.query(
        'INSERT INTO products (name, price, category_id, stock, shop_id) VALUES ($1, $2, $3, $4, $5)',
        ['Coca Cola', '2.50', categoryResult.rows[0].id, 50, shopResult.rows[0].id]
      );
      
      await pool.query(
        'INSERT INTO products (name, price, category_id, stock, shop_id) VALUES ($1, $2, $3, $4, $5)',
        ['Pepsi', '2.50', categoryResult.rows[0].id, 45, shopResult.rows[0].id]
      );
      
      console.log('✅ Sample products created');
    } else {
      console.log('ℹ️  Admin user already exists, skipping initial data creation');
    }

    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the initialization
initializeDatabase().catch((error) => {
  console.error('💥 Fatal error during database initialization:', error);
  process.exit(1);
});
