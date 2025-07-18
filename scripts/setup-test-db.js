#!/usr/bin/env node

/**
 * Test Database Setup Script
 * Sets up consistent test data for visual regression tests
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js';
import { users, shops, categories, products, tables, staff_roles } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/popcorn_pos_test';

async function setupTestDatabase() {
  console.log('🔧 Setting up test database for visual regression tests...');
  
  try {
    // Connect to database
    const client = postgres(DATABASE_URL, { max: 1 });
    const db = drizzle(client, { schema });

    // Create test admin user
    const adminUser = await db.insert(users).values({
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        password: 'admin123',
        role: 'admin'
      }
    }).returning();

    console.log('✅ Test admin user created/updated');

    // Create test shop
    const testShop = await db.insert(shops).values({
      name: 'Test Shop',
      businessMode: 'shop',
      userId: adminUser[0].id
    }).onConflictDoUpdate({
      target: shops.name,
      set: {
        businessMode: 'shop',
        userId: adminUser[0].id
      }
    }).returning();

    console.log('✅ Test shop created/updated');

    // Create test restaurant
    const testRestaurant = await db.insert(shops).values({
      name: 'Test Restaurant',
      businessMode: 'restaurant',
      userId: adminUser[0].id
    }).onConflictDoUpdate({
      target: shops.name,
      set: {
        businessMode: 'restaurant',
        userId: adminUser[0].id
      }
    }).returning();

    console.log('✅ Test restaurant created/updated');

    // Create test categories
    const testCategories = [
      { name: 'Beverages', description: 'Drinks and beverages', color: '#3B82F6', shopId: testShop[0].id },
      { name: 'Snacks', description: 'Light snacks and treats', color: '#10B981', shopId: testShop[0].id },
      { name: 'Main Dishes', description: 'Restaurant main courses', color: '#F59E0B', shopId: testRestaurant[0].id },
      { name: 'Appetizers', description: 'Restaurant starters', color: '#EF4444', shopId: testRestaurant[0].id }
    ];

    for (const category of testCategories) {
      await db.insert(categories).values(category).onConflictDoUpdate({
        target: [categories.name, categories.shopId],
        set: {
          description: category.description,
          color: category.color
        }
      });
    }

    console.log('✅ Test categories created/updated');

    // Get created categories
    const shopCategories = await db.select().from(categories).where(eq(categories.shopId, testShop[0].id));
    const restaurantCategories = await db.select().from(categories).where(eq(categories.shopId, testRestaurant[0].id));

    // Create test products
    const testProducts = [
      { name: 'Coca Cola', price: '2.50', categoryId: shopCategories[0].id, stock: 50, shopId: testShop[0].id },
      { name: 'Pepsi', price: '2.50', categoryId: shopCategories[0].id, stock: 45, shopId: testShop[0].id },
      { name: 'Chips', price: '1.99', categoryId: shopCategories[1].id, stock: 100, shopId: testShop[0].id },
      { name: 'Burger', price: '12.99', categoryId: restaurantCategories[0].id, stock: 0, shopId: testRestaurant[0].id, requiresKitchen: true },
      { name: 'Caesar Salad', price: '8.99', categoryId: restaurantCategories[1].id, stock: 0, shopId: testRestaurant[0].id, requiresKitchen: true }
    ];

    for (const product of testProducts) {
      await db.insert(products).values(product).onConflictDoUpdate({
        target: [products.name, products.shopId],
        set: {
          price: product.price,
          categoryId: product.categoryId,
          stock: product.stock,
          requiresKitchen: product.requiresKitchen || false
        }
      });
    }

    console.log('✅ Test products created/updated');

    // Create test tables for restaurant
    const testTables = [
      { number: 1, capacity: 2, section: 'Main Floor', shopId: testRestaurant[0].id },
      { number: 2, capacity: 4, section: 'Main Floor', shopId: testRestaurant[0].id },
      { number: 3, capacity: 6, section: 'Patio', shopId: testRestaurant[0].id },
      { number: 4, capacity: 2, section: 'Bar', shopId: testRestaurant[0].id }
    ];

    for (const table of testTables) {
      await db.insert(tables).values(table).onConflictDoUpdate({
        target: [tables.number, tables.shopId],
        set: {
          capacity: table.capacity,
          section: table.section
        }
      });
    }

    console.log('✅ Test tables created/updated');

    // Create test staff roles
    const testStaffRoles = [
      { name: 'Server', permissions: ['take_orders', 'view_orders'], shopId: testRestaurant[0].id },
      { name: 'Kitchen Staff', permissions: ['view_kitchen_tickets', 'update_kitchen_tickets'], shopId: testRestaurant[0].id }
    ];

    for (const role of testStaffRoles) {
      await db.insert(staff_roles).values(role).onConflictDoUpdate({
        target: [staff_roles.name, staff_roles.shopId],
        set: {
          permissions: role.permissions
        }
      });
    }

    console.log('✅ Test staff roles created/updated');

    await client.end();
    console.log('🎉 Test database setup completed successfully!');
    
    return {
      adminUser: adminUser[0],
      testShop: testShop[0],
      testRestaurant: testRestaurant[0],
      categoriesCount: testCategories.length,
      productsCount: testProducts.length,
      tablesCount: testTables.length
    };

  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestDatabase()
    .then(result => {
      console.log('\n📊 Test data summary:');
      console.log(`- Admin user: ${result.adminUser.email}`);
      console.log(`- Test shop: ${result.testShop.name}`);
      console.log(`- Test restaurant: ${result.testRestaurant.name}`);
      console.log(`- Categories: ${result.categoriesCount}`);
      console.log(`- Products: ${result.productsCount}`);
      console.log(`- Tables: ${result.tablesCount}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to setup test database:', error);
      process.exit(1);
    });
}

export default setupTestDatabase;