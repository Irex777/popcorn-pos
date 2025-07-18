import { type Product, type Order, type OrderItem, type InsertProduct, type InsertOrder, type InsertOrderItem, type UpdateProductStock, type Category, type InsertCategory, type User, type InsertUser, type Shop, type InsertShop, type StripeSettings, type Table, type InsertTable, type Reservation, type InsertReservation, type KitchenTicket, type InsertKitchenTicket, type StaffRole, type InsertStaffRole, users, shops, stripeSettings, userShops, tables, reservations, kitchenTickets, staffRoles } from "@shared/schema";
import { db } from "./db";
import { products, orders, orderItems, categories } from "@shared/schema";
import { eq, sql, and, leftJoin } from "drizzle-orm";
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
  createUser(user: InsertUser & { isAdmin?: boolean; shopIds?: number[] }): Promise<User>;
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
  addItemsToOrder(orderId: number, items: InsertOrderItem[]): Promise<Order>;
  deleteOrderItems(orderId: number): Promise<void>;
  deleteOrderById(orderId: number, shopId: number): Promise<Order | undefined>;

  // Stripe settings
  getStripeSettings(shopId: number): Promise<StripeSettings | undefined>;
  updateStripeSettings(settings: { shopId: number; publishableKey: string | null; secretKey: string | null; enabled: boolean }): Promise<StripeSettings>;

  // Restaurant Tables
  getTables(shopId: number): Promise<Table[]>;
  getTable(id: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined>;
  deleteTable(id: number): Promise<Table | undefined>;

  // Reservations
  getReservations(shopId: number, date?: Date): Promise<Reservation[]>;
  getReservation(id: number): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: number, reservation: Partial<InsertReservation>): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<Reservation | undefined>;

  // Kitchen Tickets
  getKitchenTickets(shopId: number): Promise<KitchenTicket[]>;
  getKitchenTicket(id: number): Promise<KitchenTicket | undefined>;
  createKitchenTicket(ticket: InsertKitchenTicket): Promise<KitchenTicket>;
  updateKitchenTicket(id: number, ticket: Partial<InsertKitchenTicket>): Promise<KitchenTicket | undefined>;
  deleteKitchenTicket(id: number): Promise<KitchenTicket | undefined>;

  // Staff Roles
  getStaffRoles(shopId: number): Promise<StaffRole[]>;
  getStaffRole(id: number): Promise<StaffRole | undefined>;
  createStaffRole(role: InsertStaffRole): Promise<StaffRole>;
  updateStaffRole(id: number, role: Partial<InsertStaffRole>): Promise<StaffRole | undefined>;
  deleteStaffRole(id: number): Promise<StaffRole | undefined>;

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
          shop_id INTEGER REFERENCES shops(id) NOT NULL,
          requires_kitchen BOOLEAN NOT NULL DEFAULT FALSE
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

      // Add restaurant tables
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS tables (
            id SERIAL PRIMARY KEY,
            number TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            section TEXT,
            status TEXT NOT NULL DEFAULT 'available',
            x_position INTEGER,
            y_position INTEGER,
            shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);

        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS reservations (
            id SERIAL PRIMARY KEY,
            customer_name TEXT NOT NULL,
            customer_phone TEXT,
            party_size INTEGER NOT NULL,
            reservation_time TIMESTAMP NOT NULL,
            status TEXT NOT NULL DEFAULT 'confirmed',
            table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
            shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);

        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS kitchen_tickets (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            ticket_number TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'new',
            priority TEXT NOT NULL DEFAULT 'normal',
            estimated_completion TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP
          );
        `);

        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS staff_roles (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            permissions TEXT NOT NULL,
            shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE
          );
        `);

        // Add restaurant columns to existing tables
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL;`);
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS server_id INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'dine_in';`);
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_count INTEGER NOT NULL DEFAULT 1;`);
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;`);
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS course_timing TEXT;`);

        await db.execute(sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';`);
        await db.execute(sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS course_number INTEGER NOT NULL DEFAULT 1;`);
        await db.execute(sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS special_requests TEXT;`);
        await db.execute(sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER;`);

        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES staff_roles(id) ON DELETE SET NULL;`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;`);
        
        // Add kitchen flag to products
        await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_kitchen BOOLEAN NOT NULL DEFAULT FALSE;`);
        
        // Smart update for existing products based on name patterns
        await db.execute(sql`
          UPDATE products 
          SET requires_kitchen = TRUE 
          WHERE requires_kitchen = FALSE 
          AND (
            LOWER(name) LIKE '%pizza%' OR 
            LOWER(name) LIKE '%burger%' OR 
            LOWER(name) LIKE '%sandwich%' OR 
            LOWER(name) LIKE '%pasta%' OR 
            LOWER(name) LIKE '%salad%' OR 
            LOWER(name) LIKE '%soup%' OR 
            LOWER(name) LIKE '%steak%' OR 
            LOWER(name) LIKE '%chicken%' OR 
            LOWER(name) LIKE '%fish%' OR 
            LOWER(name) LIKE '%fries%' OR 
            LOWER(name) LIKE '%wings%' OR 
            LOWER(name) LIKE '%hot%' OR 
            LOWER(name) LIKE '%grilled%' OR 
            LOWER(name) LIKE '%fried%' OR 
            LOWER(name) LIKE '%cooked%' OR 
            LOWER(name) LIKE '%baked%' OR 
            LOWER(name) LIKE '%roasted%' OR 
            LOWER(name) LIKE '%meal%' OR 
            LOWER(name) LIKE '%dish%' OR 
            LOWER(name) LIKE '%entree%' OR 
            LOWER(name) LIKE '%main%' OR 
            LOWER(name) LIKE '%food%' OR 
            LOWER(name) LIKE '%plate%' OR 
            LOWER(name) LIKE '%bowl%'
          )
          AND NOT (
            LOWER(name) LIKE '%drink%' OR 
            LOWER(name) LIKE '%beverage%' OR 
            LOWER(name) LIKE '%soda%' OR 
            LOWER(name) LIKE '%water%' OR 
            LOWER(name) LIKE '%juice%' OR 
            LOWER(name) LIKE '%coffee%' OR 
            LOWER(name) LIKE '%tea%' OR 
            LOWER(name) LIKE '%beer%' OR 
            LOWER(name) LIKE '%wine%' OR 
            LOWER(name) LIKE '%cocktail%' OR 
            LOWER(name) LIKE '%smoothie%' OR 
            LOWER(name) LIKE '%shake%' OR 
            LOWER(name) LIKE '%cold%' OR 
            LOWER(name) LIKE '%ice%' OR 
            LOWER(name) LIKE '%bottle%' OR 
            LOWER(name) LIKE '%can%' OR 
            LOWER(name) LIKE '%glass%'
          );
        `);

        // Create restaurant indexes
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tables_shop_id ON tables(shop_id);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reservations_shop_id ON reservations(shop_id);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reservations_reservation_time ON reservations(reservation_time);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_order_id ON kitchen_tickets(order_id);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_status ON kitchen_tickets(status);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_staff_roles_shop_id ON staff_roles(shop_id);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_orders_server_id ON orders(server_id);`);

        console.log('✅ Restaurant tables and columns added/verified');
      } catch (restaurantError) {
        console.log('ℹ️  Restaurant tables may already exist:', restaurantError);
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
    const result = await db.insert(shops).values(shop).returning();
    return result[0] as Shop;
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
          businessMode: shop.businessMode,
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
      const result = await db
        .delete(shops)
        .where(eq(shops.id, id))
        .returning();

      return (result as any)[0];
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
      requiresKitchen: products.requiresKitchen,
    })
      .from(products)
      .where(eq(products.shopId, shopId));

    return results;
  }

  async getOrders(shopId: number): Promise<Order[]> {
    try {
      console.log(`Storage: Fetching orders for shop ${shopId}`);
      const result = await db
        .select()
        .from(orders)
        .where(eq(orders.shopId, shopId))
        .orderBy(orders.createdAt);
      
      console.log(`Storage: Retrieved ${result.length} orders for shop ${shopId}`);
      return result;
    } catch (error) {
      console.error(`Storage: Error fetching orders for shop ${shopId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
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
    const result = await db
      .insert(users)
      .values({
        ...insertUser,
        isAdmin: insertUser.isAdmin || false,
      })
      .returning();
    const user = result[0];

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

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async addItemsToOrder(orderId: number, items: InsertOrderItem[]): Promise<Order> {
    // Get the existing order
    const existingOrder = await this.getOrder(orderId);
    if (!existingOrder) {
      throw new Error("Order not found");
    }

    // Update stock levels for each new item
    for (const item of items) {
      await this.decrementProductStock(item.productId, item.quantity);
    }

    // Add new items to the order
    await db.insert(orderItems).values(
      items.map(item => ({
        ...item,
        orderId: orderId
      }))
    );

    // Calculate new total by getting all items
    const allItems = await this.getOrderItems(orderId);
    const newTotal = allItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    // Update order total
    const result = await db
      .update(orders)
      .set({ total: newTotal.toString() })
      .where(eq(orders.id, orderId))
      .returning();

    return result[0];
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const items = await db
      .select()
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return items.map(item => ({
      ...item.order_items,
      product: item.products
    }));
  }

  async updateOrderItemStatus(orderId: number, productId: number, status: string): Promise<void> {
    await db
      .update(orderItems)
      .set({ status })
      .where(
        and(
          eq(orderItems.orderId, orderId),
          eq(orderItems.productId, productId)
        )
      );
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

  // Restaurant Tables implementation
  async getTables(shopId: number): Promise<Table[]> {
    return await db.select().from(tables).where(eq(tables.shopId, shopId));
  }

  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table;
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [newTable] = await db.insert(tables).values(table).returning();
    return newTable;
  }

  async updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined> {
    const [updatedTable] = await db
      .update(tables)
      .set(table)
      .where(eq(tables.id, id))
      .returning();
    return updatedTable;
  }

  async deleteTable(id: number): Promise<Table | undefined> {
    try {
      // First, get the table to return it after deletion
      const tableToDelete = await this.getTable(id);
      if (!tableToDelete) {
        return undefined;
      }

      // Update related orders to remove table reference (preserve order history)
      await db
        .update(orders)
        .set({ tableId: null })
        .where(eq(orders.tableId, id));

      // Update related reservations to remove table reference
      await db
        .update(reservations)
        .set({ tableId: null })
        .where(eq(reservations.tableId, id));

      // Now delete the table
      const [deletedTable] = await db
        .delete(tables)
        .where(eq(tables.id, id))
        .returning();
      
      return deletedTable;
    } catch (error) {
      console.error('Error deleting table:', error);
      throw new Error(`Failed to delete table: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Reservations implementation
  async getReservations(shopId: number, date?: Date): Promise<Reservation[]> {
    let query = db.select().from(reservations).where(eq(reservations.shopId, shopId));
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = (query as any).where(and(
        sql`${reservations.reservationTime} >= ${startOfDay}`,
        sql`${reservations.reservationTime} <= ${endOfDay}`
      ));
    }
    
    return await query;
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation;
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const [newReservation] = await db.insert(reservations).values(reservation).returning();
    return newReservation;
  }

  async updateReservation(id: number, reservation: Partial<InsertReservation>): Promise<Reservation | undefined> {
    const [updatedReservation] = await db
      .update(reservations)
      .set(reservation)
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation;
  }

  async deleteReservation(id: number): Promise<Reservation | undefined> {
    const [deletedReservation] = await db
      .delete(reservations)
      .where(eq(reservations.id, id))
      .returning();
    return deletedReservation;
  }

  // Kitchen Tickets implementation
  async getKitchenTickets(shopId: number): Promise<any[]> {
    const tickets = await db
      .select()
      .from(kitchenTickets)
      .innerJoin(orders, eq(kitchenTickets.orderId, orders.id))
      .where(eq(orders.shopId, shopId));

    // Get order items with product details for each ticket
    const ticketsWithItems = await Promise.all(
      tickets.map(async (ticket) => {
        const items = await db
          .select()
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, ticket.kitchen_tickets.orderId));

        const itemsWithProducts = items
          .filter(item => item.products.requiresKitchen)
          .map(item => ({
            ...item.order_items,
            product: item.products
          }));

        return {
          ...ticket.kitchen_tickets,
          order: ticket.orders,
          items: itemsWithProducts
        };
      })
    );

    // Filter out tickets that have no kitchen items
    return ticketsWithItems.filter(ticket => ticket.items.length > 0);
  }

  async getKitchenTicket(id: number): Promise<KitchenTicket | undefined> {
    const [ticket] = await db.select().from(kitchenTickets).where(eq(kitchenTickets.id, id));
    return ticket;
  }

  async createKitchenTicket(ticket: InsertKitchenTicket): Promise<KitchenTicket> {
    const [newTicket] = await db.insert(kitchenTickets).values(ticket).returning();
    return newTicket;
  }

  async updateKitchenTicket(id: number, ticket: Partial<InsertKitchenTicket>): Promise<KitchenTicket | undefined> {
    const [updatedTicket] = await db
      .update(kitchenTickets)
      .set(ticket)
      .where(eq(kitchenTickets.id, id))
      .returning();
    return updatedTicket;
  }

  async deleteKitchenTicket(id: number): Promise<KitchenTicket | undefined> {
    const [deletedTicket] = await db
      .delete(kitchenTickets)
      .where(eq(kitchenTickets.id, id))
      .returning();
    return deletedTicket;
  }

  // Staff Roles implementation
  async getStaffRoles(shopId: number): Promise<StaffRole[]> {
    return await db.select().from(staffRoles).where(eq(staffRoles.shopId, shopId));
  }

  async getStaffRole(id: number): Promise<StaffRole | undefined> {
    const [role] = await db.select().from(staffRoles).where(eq(staffRoles.id, id));
    return role;
  }

  async createStaffRole(role: InsertStaffRole): Promise<StaffRole> {
    const result = await db.insert(staffRoles).values(role).returning();
    return result[0];
  }

  async updateStaffRole(id: number, role: Partial<InsertStaffRole>): Promise<StaffRole | undefined> {
    const result = await db
      .update(staffRoles)
      .set(role)
      .where(eq(staffRoles.id, id))
      .returning();
    return result[0];
  }

  async deleteStaffRole(id: number): Promise<StaffRole | undefined> {
    const result = await db
      .delete(staffRoles)
      .where(eq(staffRoles.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
