import { type Product, type Order, type OrderItem, type InsertProduct, type InsertOrder, type InsertOrderItem, type UpdateProductStock, type Category, type InsertCategory, type User, type InsertUser, type Shop, type InsertShop, type StripeSettings, users, shops, stripeSettings, userShops } from "@shared/schema";
import { db } from "./db";
import { products, orders, orderItems, categories } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

console.log('🔄 Storage module loaded successfully');

export interface IStorage {
  // Database initialization
  initializeDatabase(): Promise<void>;
  
  // Users
  getUser(id: number): Promise<(User & { shopIds?: number[] }) | undefined>;
  getUserByUsername(username: string): Promise<(User & { shopIds?: number[] }) | undefined>;
  createUser(user: InsertUser & { isAdmin?: boolean }): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<User>;
  updateUser(id: number, updates: { username?: string; password?: string }): Promise<User>;
  updateUserShops(userId: number, shopIds: number[]): Promise<void>;
  updateUserPreferences(id: number, preferences: { language?: string; currency?: string }): Promise<User>;
  getUserPreferences(id: number): Promise<{ language: string; currency: string } | null>;
  getAllUsers(): Promise<User[]>;

  // Shops
  createShop(shop: InsertShop): Promise<Shop>;
  getShop(id: number): Promise<Shop | undefined>;
  getAllShops(): Promise<Shop[]>;
  updateShop(id: number, shop: InsertShop): Promise<Shop | undefined>;
  deleteShop(id: number, force?: boolean): Promise<Shop | undefined>;

  // Categories
  getCategories(shopId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: InsertCategory): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<Category | undefined>;

  // Products
  getProducts(shopId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: InsertProduct): Promise<Product | undefined>;
  updateProductStock(id: number, update: UpdateProductStock): Promise<Product | undefined>;
  decrementProductStock(id: number, quantity: number): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<Product | undefined>;

  // Orders
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(shopId: number): Promise<Order[]>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  deleteOrderItems(orderId: number): Promise<void>;
  deleteOrderById(orderId: number, shopId: number): Promise<Order | undefined>;

  // Stripe settings
  getStripeSettings(shopId: number): Promise<StripeSettings | undefined>;
  updateStripeSettings(settings: { shopId: number; publishableKey: string | null; secretKey: string | null; enabled: boolean }): Promise<StripeSettings>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  // Database initialization method
  async initializeDatabase(): Promise<void> {
    try {
      console.log('🔄 Initializing database tables...');
      
      // Use raw SQL to create tables since Drizzle migrate might not work in this context
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          is_admin BOOLEAN NOT NULL DEFAULT false,
          language TEXT NOT NULL DEFAULT 'cs',
          currency TEXT NOT NULL DEFAULT 'CZK',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS shops (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          created_by_id INTEGER REFERENCES users(id) NOT NULL
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_shops (
          user_id INTEGER REFERENCES users(id) NOT NULL,
          shop_id INTEGER REFERENCES shops(id) NOT NULL,
          PRIMARY KEY (user_id, shop_id)
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          color TEXT NOT NULL DEFAULT '#94A3B8',
          shop_id INTEGER REFERENCES shops(id) NOT NULL
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          category_id INTEGER REFERENCES categories(id) NOT NULL,
          image_url TEXT NOT NULL DEFAULT '',
          stock INTEGER NOT NULL DEFAULT 0,
          shop_id INTEGER REFERENCES shops(id) NOT NULL
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          total DECIMAL(10,2) NOT NULL,
          status TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          user_id INTEGER REFERENCES users(id),
          shop_id INTEGER REFERENCES shops(id) NOT NULL
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id) NOT NULL,
          product_id INTEGER REFERENCES products(id) NOT NULL,
          quantity INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS stripe_settings (
          id SERIAL PRIMARY KEY,
          shop_id INTEGER REFERENCES shops(id) NOT NULL UNIQUE,
          publishable_key TEXT,
          secret_key TEXT,
          enabled BOOLEAN NOT NULL DEFAULT false
        );
      `);

      // Create indexes for performance
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_shops_user_id ON user_shops(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_shops_shop_id ON user_shops(shop_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`);

      // Add preferences columns to existing users table if they don't exist
      try {
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'cs';`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CZK';`);
        console.log('✅ User preferences columns added/verified');
      } catch (migrationError) {
        console.log('ℹ️  User preferences columns may already exist:', migrationError);
      }

      console.log('✅ Database tables initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async getStripeSettings(shopId: number): Promise<StripeSettings | undefined> {
    const [settings] = await db
      .select()
      .from(stripeSettings)
      .where(eq(stripeSettings.shopId, shopId));
    return settings;
  }

  async updateStripeSettings(settings: { shopId: number; publishableKey: string | null; secretKey: string | null; enabled: boolean }): Promise<StripeSettings> {
    const [existing] = await db
      .select()
      .from(stripeSettings)
      .where(eq(stripeSettings.shopId, settings.shopId));

    if (existing) {
      const [updated] = await db
        .update(stripeSettings)
        .set(settings)
        .where(eq(stripeSettings.shopId, settings.shopId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(stripeSettings)
        .values(settings)
        .returning();
      return created;
    }
  }

  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // Shop methods
  async createShop(shop: InsertShop): Promise<Shop> {
    const [newShop] = await db.insert(shops).values(shop).returning();
    return newShop;
  }

  async getShop(id: number): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops).where(eq(shops.id, id));
    return shop;
  }

  async getAllShops(): Promise<Shop[]> {
    return await db.select().from(shops);
  }

  async updateShop(id: number, shop: InsertShop): Promise<Shop | undefined> {
    try {
      const [updatedShop] = await db
        .update(shops)
        .set({
          name: shop.name,
          address: shop.address,
          createdById: shop.createdById // Preserve the existing createdById
        })
        .where(eq(shops.id, id))
        .returning();
      return updatedShop;
    } catch (error) {
      console.error('Error updating shop:', error);
      return undefined;
    }
  }

  async deleteShop(id: number, force: boolean = false): Promise<Shop | undefined> {
    try {
      if (force) {
        // Force delete: cascade delete all related data
        console.log(`Force deleting shop ${id} and all related data...`);
        
        // 0. Delete kitchen_order_items for this shop's orders
        await db.execute(sql`
          DELETE FROM kitchen_order_items
          WHERE order_item_id IN (
            SELECT oi.id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.shop_id = ${id}
          )
        `);
        
        // 1. Delete all order items for orders in this shop
        await db.execute(sql`
          DELETE FROM order_items 
          WHERE order_id IN (
            SELECT id FROM orders WHERE shop_id = ${id}
          )
        `);
        
        // 2. Delete all orders for this shop
        await db
          .delete(orders)
          .where(eq(orders.shopId, id));
        
        // 3. Delete all products for this shop
        await db
          .delete(products)
          .where(eq(products.shopId, id));
        
        // 4. Delete all categories for this shop
        await db
          .delete(categories)
          .where(eq(categories.shopId, id));
      }

      // Delete user-shop assignments for this shop
      await db
        .delete(userShops)
        .where(eq(userShops.shopId, id));

      // Delete stripe settings for this shop
      await db
        .delete(stripeSettings)
        .where(eq(stripeSettings.shopId, id));

      // Finally, delete the shop itself
      const [deletedShop] = await db
        .delete(shops)
        .where(eq(shops.id, id))
        .returning();

      return deletedShop;
    } catch (error) {
      console.error('Error deleting shop:', error);
      throw error;
    }
  }

  // Shop-specific methods
  async getCategories(shopId: number): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.shopId, shopId));
  }

  async getProducts(shopId: number): Promise<Product[]> {
    const results = await db.select({
      id: products.id,
      name: products.name,
      price: products.price,
      categoryId: products.categoryId,
      imageUrl: products.imageUrl,
      stock: products.stock,
      shopId: products.shopId,
    })
      .from(products)
      .where(eq(products.shopId, shopId));

    return results;
  }

  async getOrders(shopId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.shopId, shopId))
      .orderBy(orders.createdAt);
  }

  // Keep other existing methods but add shopId validation where appropriate
  async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔄 Executing getAllUsers query...');
      const result = await db.select().from(users);
      console.log('✅ getAllUsers query successful, returned', result.length, 'users');
      return result;
    } catch (error) {
      console.error('💥 getAllUsers query failed:', error);
      console.error('Error details:', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getUser(id: number): Promise<(User & { shopIds?: number[] }) | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;

    if (!user.isAdmin) {
      // Get user's assigned shops
      const userShopRecords = await db
        .select({ shopId: userShops.shopId })
        .from(userShops)
        .where(eq(userShops.userId, id));
      
      return {
        ...user,
        shopIds: userShopRecords.map(record => record.shopId)
      };
    }

    // For admin users, get all shop IDs
    const allShops = await db.select({ id: shops.id }).from(shops);
    return {
      ...user,
      shopIds: allShops.map(shop => shop.id)
    };
  }

  async getUserByUsername(username: string): Promise<(User & { shopIds?: number[] }) | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) return undefined;

    if (!user.isAdmin) {
      // Get user's assigned shops
      const userShopRecords = await db
        .select({ shopId: userShops.shopId })
        .from(userShops)
        .where(eq(userShops.userId, user.id));
      
      return {
        ...user,
        shopIds: userShopRecords.map(record => record.shopId)
      };
    }

    // For admin users, get all shop IDs
    const allShops = await db.select({ id: shops.id }).from(shops);
    return {
      ...user,
      shopIds: allShops.map(shop => shop.id)
    };
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean; shopIds?: number[] }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        isAdmin: insertUser.isAdmin || false,
      })
      .returning();

    // If specific shops are provided, assign those
    if (insertUser.shopIds?.length) {
      await db.insert(userShops).values(
        insertUser.shopIds.map(shopId => ({
          userId: user.id,
          shopId: shopId
        }))
      );
    }
    // For non-admin users without specified shops, assign to the first shop
    else if (!user.isAdmin) {
      const [firstShop] = await db.select().from(shops).limit(1);
      if (firstShop) {
        await db.insert(userShops).values({
          userId: user.id,
          shopId: firstShop.id
        });
      }
    }

    // Return full user with shops
    return await this.getUser(user.id) as User;
  }

  async updateUserPassword(id: number, password: string): Promise<User> {
    if (!password) {
      throw new Error("Password is required for password update");
    }
    const [user] = await db
      .update(users)
      .set({ password })
      .where(eq(users.id, id))
      .returning();
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async updateUser(id: number, updates: { username?: string; password?: string }): Promise<User> {
    // Filter out undefined values to avoid empty updates
    const validUpdates: { username?: string; password?: string } = {};
    if (updates.username !== undefined) validUpdates.username = updates.username;
    if (updates.password !== undefined) validUpdates.password = updates.password;

    // If there are no valid updates, get the existing user
    if (Object.keys(validUpdates).length === 0) {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (!user) throw new Error("User not found");
      return user;
    }

    const [user] = await db
      .update(users)
      .set(validUpdates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserShops(userId: number, shopIds: number[]): Promise<void> {
    // Delete existing shop assignments
    await db
      .delete(userShops)
      .where(eq(userShops.userId, userId));

    // Insert new shop assignments if any
    if (shopIds.length > 0) {
      await db
        .insert(userShops)
        .values(shopIds.map(shopId => ({ userId, shopId })));
    }
  }

  async updateUserPreferences(id: number, preferences: { language?: string; currency?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set(preferences)
      .where(eq(users.id, id))
      .returning();
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async getUserPreferences(id: number): Promise<{ language: string; currency: string } | null> {
    const [user] = await db
      .select({ language: users.language, currency: users.currency })
      .from(users)
      .where(eq(users.id, id));
    return user || null;
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, updateCategory: InsertCategory): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(updateCategory)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<Category | undefined> {
    try {
      // First check if category has any products
      const relatedProducts = await db
        .select()
        .from(products)
        .where(eq(products.categoryId, id));

      if (relatedProducts.length > 0) {
        throw new Error("Cannot delete category that has products");
      }

      // If no products exist, delete the category
      const [category] = await db
        .delete(categories)
        .where(eq(categories.id, id))
        .returning();

      return category;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    try {
      // Format the product data
      const formattedProduct = {
        name: insertProduct.name,
        price: insertProduct.price,
        categoryId: Number(insertProduct.categoryId),
        imageUrl: insertProduct.imageUrl || '', // Always ensure a string, never null
        stock: Number(insertProduct.stock),
        shopId: insertProduct.shopId
      };

      console.log('Creating product with data:', formattedProduct);

      const [product] = await db.insert(products)
        .values(formattedProduct)
        .returning();

      if (!product) {
        throw new Error('Failed to create product');
      }

      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id: number, updateProduct: InsertProduct): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updateProduct)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async updateProductStock(id: number, update: UpdateProductStock): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ stock: update.stock })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async decrementProductStock(id: number, quantity: number): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({
        stock: sql`GREATEST(${products.stock} - ${quantity}, 0)`
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<Product | undefined> {
    try {
      // First check if product exists in any orders
      const relatedOrderItems = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.productId, id));

      if (relatedOrderItems.length > 0) {
        // Delete all related order items first
        await db
          .delete(orderItems)
          .where(eq(orderItems.productId, id));
      }

      // Now we can safely delete the product
      const [product] = await db
        .delete(products)
        .where(eq(products.id, id))
        .returning();

      return product;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Orders implementation
  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();

    if (items.length > 0) {
      // Update stock levels for each product
      for (const item of items) {
        await this.decrementProductStock(item.productId, item.quantity);
      }

      // Create order items
      await db.insert(orderItems).values(
        items.map(item => ({
          ...item,
          orderId: order.id
        }))
      );
    }

    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async deleteOrderItems(orderId: number): Promise<void> {
    await db.delete(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async deleteOrderById(orderId: number, shopId: number): Promise<Order | undefined> {
    // First verify the order belongs to the shop
    const [order] = await db
      .select()
      .from(orders)
      .where(sql`${orders.id} = ${orderId} AND ${orders.shopId} = ${shopId}`);

    if (!order) {
      return undefined;
    }

    // First delete order items due to foreign key constraint
    await db.delete(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Then delete the order
    const [deletedOrder] = await db
      .delete(orders)
      .where(sql`${orders.id} = ${orderId} AND ${orders.shopId} = ${shopId}`)
      .returning();

    return deletedOrder;
  }
}

export const storage = new DatabaseStorage();
