import { type Product, type Order, type OrderItem, type InsertProduct, type InsertOrder, type InsertOrderItem, type UpdateProductStock, type Category, type InsertCategory, type User, type InsertUser, type Shop, type InsertShop, users, shops } from "@shared/schema";
import { db } from "./db";
import { products, orders, orderItems, categories } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { isAdmin?: boolean }): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<User | undefined>;
  updateUser(id: number, updates: { username?: string; password?: string }): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Shops
  createShop(shop: InsertShop): Promise<Shop>;
  getShop(id: number): Promise<Shop | undefined>;
  getAllShops(): Promise<Shop[]>;
  updateShop(id: number, shop: InsertShop): Promise<Shop | undefined>;
  deleteShop(id: number): Promise<Shop | undefined>;

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

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
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

  async deleteShop(id: number): Promise<Shop | undefined> {
    const [deletedShop] = await db
      .delete(shops)
      .where(eq(shops.id, id))
      .returning();
    return deletedShop;
  }

  // Update existing methods to be shop-specific
  async getCategories(shopId: number): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.shopId, shopId));
  }

  async getProducts(shopId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.shopId, shopId));
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
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        isAdmin: insertUser.isAdmin || false,
      })
      .returning();
    return user;
  }

  async updateUserPassword(id: number, password: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: number, updates: { username?: string; password?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
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
    const [category] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    return category;
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

    return results.map(product => ({
      ...product,
    }));
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
        price: typeof insertProduct.price === 'string' ? insertProduct.price : insertProduct.price.toFixed(2),
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
    const [product] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    return product;
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

  async getOrders(shopId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.shopId, shopId))
      .orderBy(orders.createdAt);
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

    // Delete the order
    const [deletedOrder] = await db
      .delete(orders)
      .where(sql`${orders.id} = ${orderId} AND ${orders.shopId} = ${shopId}`)
      .returning();

    return deletedOrder;
  }
}

export const storage = new DatabaseStorage();