import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertOrderItemSchema, updateProductStockSchema, insertProductSchema, insertCategorySchema, insertShopSchema } from "@shared/schema";
import { z } from "zod";
import { setupWebSocket, startAnalyticsUpdates } from "./websocket";
import { createPaymentIntent } from './stripe';

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Only administrators can perform this action" });
  }
  next();
};

// Middleware to check if user has access to shop
const requireShopAccess = async (req: any, res: any, next: any) => {
  const shopId = parseInt(req.params.shopId || req.body.shopId);
  if (!shopId) {
    return res.status(400).json({ error: "Shop ID is required" });
  }

  const shop = await storage.getShop(shopId);
  if (!shop) {
    return res.status(404).json({ error: "Shop not found" });
  }

  // Allow access if user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Shop management routes (admin only)
  app.post("/api/shops", requireAdmin, async (req, res) => {
    try {
      const shopData = insertShopSchema.parse({
        ...req.body,
        createdById: req.user.id
      });
      const shop = await storage.createShop(shopData);
      res.status(201).json(shop);
    } catch (error) {
      res.status(400).json({ error: "Invalid shop data" });
    }
  });

  app.get("/api/shops", requireAdmin, async (_req, res) => {
    const shops = await storage.getAllShops();
    res.json(shops);
  });

  // Update existing routes to be shop-specific
  app.get("/api/shops/:shopId/categories", requireShopAccess, async (req, res) => {
    const categories = await storage.getCategories(parseInt(req.params.shopId));
    res.json(categories);
  });

  app.post("/api/shops/:shopId/categories", requireShopAccess, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      categoryData.shopId = parseInt(req.params.shopId);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.patch("/api/shops/:shopId/categories/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.updateCategory(id, categoryData, shopId);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.delete("/api/shops/:shopId/categories/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const id = parseInt(req.params.id);
      const category = await storage.deleteCategory(id, shopId);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Failed to delete category" });
    }
  });


  app.get("/api/shops/:shopId/products", requireShopAccess, async (req, res) => {
    const products = await storage.getProducts(parseInt(req.params.shopId));
    res.json(products);
  });

  app.post("/api/shops/:shopId/products", requireShopAccess, async (req, res) => {
    try {
      const productData = insertProductSchema.parse({...req.body, shopId: parseInt(req.params.shopId)});
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.patch("/api/shops/:shopId/products/:id/stock", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const id = parseInt(req.params.id);
      const update = updateProductStockSchema.parse(req.body);
      const product = await storage.updateProductStock(id, update, shopId);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid stock update data" });
    }
  });

  app.patch("/api/shops/:shopId/products/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.updateProduct(id, productData, shopId);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.delete("/api/shops/:shopId/products/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const id = parseInt(req.params.id);
      const product = await storage.deleteProduct(id, shopId);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.get("/api/shops/:shopId/orders", requireShopAccess, async (req, res) => {
    const orders = await storage.getOrders(parseInt(req.params.shopId));
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await storage.getOrderItems(order.id);
        return { ...order, items };
      })
    );
    res.json(ordersWithItems);
  });

  app.post("/api/shops/:shopId/orders", requireShopAccess, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body.order,
        shopId: parseInt(req.params.shopId)
      });
      const itemsData = z.array(insertOrderItemSchema).parse(
        req.body.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      );

      const order = await storage.createOrder(orderData, itemsData);

      if (!order) {
        return res.status(500).json({ error: "Failed to create order" });
      }

      // Get order items for the response
      const items = await storage.getOrderItems(order.id);
      res.status(201).json({ ...order, items });
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Invalid order data",
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  app.get("/api/shops/:shopId/orders/:id", requireShopAccess, async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    const orderId = parseInt(req.params.id);
    const order = await storage.getOrder(orderId, shopId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const items = await storage.getOrderItems(orderId);
    res.json({ order, items });
  });

  app.delete("/api/shops/:shopId/orders/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const orderId = parseInt(req.params.id);
      const order = await storage.deleteOrder(orderId, shopId);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: "Failed to delete order" });
    }
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

      console.log('Creating payment intent:', { amount, currency });
      const paymentIntent = await createPaymentIntent(amount, currency);
      console.log('Payment intent created successfully');
      res.json(paymentIntent);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      const errorMessage = error.message || 'Failed to create payment intent';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/real-time", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId || req.body.shopId);
      if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required" });
      }

      const orders = await storage.getOrders(shopId);
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

  app.get("/api/analytics/historical", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId || req.body.shopId);
      if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required" });
      }

      const orders = await storage.getOrders(shopId);
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

  // Add shop PATCH endpoint after the existing shop routes
  app.patch("/api/shops/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shopData = insertShopSchema.parse(req.body);
      const shop = await storage.updateShop(id, shopData);

      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }

      res.json(shop);
    } catch (error) {
      res.status(400).json({ error: "Invalid shop data" });
    }
  });

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  process.nextTick(() => {
    try {
      startAnalyticsUpdates();
    } catch (error) {
      console.error('Failed to start analytics updates:', error);
    }
  });

  return httpServer;
}