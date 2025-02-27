import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertOrderItemSchema, updateProductStockSchema, insertProductSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import { setupWebSocket, startAnalyticsUpdates } from "./websocket";
import { createPaymentIntent } from './stripe';

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (_req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.updateCategory(id, categoryData);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.deleteCategory(id);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Failed to delete category" });
    }
  });

  // Products
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.patch("/api/products/:id/stock", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const update = updateProductStockSchema.parse(req.body);
      const product = await storage.updateProductStock(id, update);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid stock update data" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.updateProduct(id, productData);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  // Orders
  app.get("/api/orders", async (_req, res) => {
    const orders = await storage.getOrders();
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await storage.getOrderItems(order.id);
        return { ...order, items };
      })
    );
    res.json(ordersWithItems);
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        total: req.body.order.total,
        status: req.body.order.status
      });

      const itemsData = z.array(insertOrderItemSchema).parse(
        req.body.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      );

      const order = await storage.createOrder(orderData, itemsData);
      res.json(order);
    } catch (error) {
      console.error('Order validation error:', error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = await storage.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const items = await storage.getOrderItems(orderId);
    res.json({ order, items });
  });

  // Payment endpoint
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      if (!currency) {
        return res.status(400).json({ error: 'Currency is required' });
      }

      const paymentIntent = await createPaymentIntent(amount, currency);
      res.json(paymentIntent);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });


  // Analytics endpoints
  app.get("/api/analytics/real-time", async (_req, res) => {
    try {
      const orders = await storage.getOrders();
      const currentHour = new Date().getHours();

      // Calculate real-time metrics
      const currentHourOrders = orders.filter(order => {
        const orderHour = new Date(order.createdAt!).getHours();
        return orderHour === currentHour;
      });

      const realtimeMetrics = {
        currentHourSales: currentHourOrders.reduce((sum, order) => sum + Number(order.total), 0),
        activeCustomers: new Set(currentHourOrders.map(order => order.id)).size,
        averageOrderValue: currentHourOrders.length > 0
          ? currentHourOrders.reduce((sum, order) => sum + Number(order.total), 0) / currentHourOrders.length
          : 0
      };

      // Generate predictive insights
      const trendIndicators = {
        salesTrend: 'stable' as const,
        confidence: 0.95
      };

      res.json({ 
        realtimeMetrics,
        trendIndicators,
        predictions: {
          nextHour: { predictedValue: 0, confidenceInterval: { lower: 0, upper: 0 } },
          nextDay: { predictedValue: 0, confidenceInterval: { lower: 0, upper: 0 } },
          nextWeek: { predictedValue: 0, confidenceInterval: { lower: 0, upper: 0 } }
        }
      });
    } catch (error) {
      console.error('Error fetching real-time analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  app.get("/api/analytics/historical", async (_req, res) => {
    try {
      const orders = await storage.getOrders();
      const historicalData = orders.map(order => ({
        date: order.createdAt,
        total: Number(order.total)
      }));

      res.json(historicalData);
    } catch (error) {
      console.error('Error fetching historical analytics:', error);
      res.status(500).json({ error: 'Failed to fetch historical data' });
    }
  });

  // Create HTTP server and set up WebSocket
  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  // Start analytics updates in the next tick to avoid blocking server startup
  process.nextTick(() => {
    try {
      startAnalyticsUpdates();
    } catch (error) {
      console.error('Failed to start analytics updates:', error);
    }
  });

  return httpServer;
}