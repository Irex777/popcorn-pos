import { type Product, type Order, type OrderItem, type InsertProduct, type InsertOrder, type InsertOrderItem, type UpdateProductStock } from "@shared/schema";
import { db } from "./db";
import { products, orders, orderItems } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProductStock(id: number, update: UpdateProductStock): Promise<Product | undefined>;
  decrementProductStock(id: number, quantity: number): Promise<Product | undefined>;

  // Orders
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
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
        stock: db.raw(`GREATEST(stock - ${quantity}, 0)`)
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

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

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(orders.createdAt);
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
}

export const storage = new DatabaseStorage();