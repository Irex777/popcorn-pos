import { type Product, type Order, type OrderItem, type InsertProduct, type InsertOrder, type InsertOrderItem } from "@shared/schema";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Orders
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem[]>;
  private currentProductId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;

  constructor() {
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.currentProductId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;

    // Add sample products
    this.initializeProducts();
  }

  private initializeProducts() {
    const sampleProducts: InsertProduct[] = [
      {
        name: "Espresso",
        price: "3.50",
        category: "Drinks",
        imageUrl: "https://api.iconify.design/lucide:coffee.svg"
      },
      {
        name: "Cappuccino",
        price: "4.50",
        category: "Drinks",
        imageUrl: "https://api.iconify.design/lucide:coffee.svg"
      },
      {
        name: "Croissant",
        price: "3.00",
        category: "Bakery",
        imageUrl: "https://api.iconify.design/lucide:cookie.svg"
      }
    ];

    sampleProducts.forEach(product => this.createProduct(product));
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product = { id, ...insertProduct };
    this.products.set(id, product);
    return product;
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.currentOrderId++;
    const order = { 
      id, 
      ...insertOrder,
      createdAt: new Date() 
    };
    
    this.orders.set(id, order);
    
    const orderItems = items.map(item => ({
      id: this.currentOrderItemId++,
      ...item,
      orderId: id
    }));
    
    this.orderItems.set(id, orderItems);
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return this.orderItems.get(orderId) || [];
  }
}

export const storage = new MemStorage();
