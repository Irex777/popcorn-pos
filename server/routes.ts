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

export function registerRoutes(app: Express): Server {
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

  app.patch("/api/shops/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Get existing shop first
      const existingShop = await storage.getShop(id);
      if (!existingShop) {
        return res.status(404).json({ error: "Shop not found" });
      }

      // Only validate the updateable fields
      const updateData = {
        name: req.body.name,
        address: req.body.address || null
      };

      // Merge with existing data to preserve createdById
      const shopData = {
        ...updateData,
        createdById: existingShop.createdById
      };

      const shop = await storage.updateShop(id, shopData);
      if (!shop) {
        throw new Error("Failed to update shop");
      }

      res.json(shop);
    } catch (error) {
      console.error('Error updating shop:', error);
      res.status(400).json({ error: "Invalid shop data" });
    }
  });

  // Categories routes
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

  // Products routes
  app.get("/api/shops/:shopId/products", requireShopAccess, async (req, res) => {
    const products = await storage.getProducts(parseInt(req.params.shopId));
    res.json(products);
  });

  // Orders routes
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

  app.delete("/api/shops/:shopId/orders/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const orderId = parseInt(req.params.id);

      // Check if the order exists and belongs to the shop before deletion
      const orderToDelete = await storage.getOrder(orderId);
      if (!orderToDelete || orderToDelete.shopId !== shopId) {
        return res.status(404).json({ error: "Order not found" });
      }

      // First delete order items
      await storage.deleteOrderItems(orderId);

      // Then delete the order itself
      const deletedOrder = await storage.deleteOrderById(orderId, shopId);
      if (!deletedOrder) {
        throw new Error("Failed to delete order after deleting items");
      }

      res.json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Analytics endpoints
  app.get("/api/shops/:shopId/analytics/real-time", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const orders = await storage.getOrders(shopId);
      const currentHour = new Date().getHours();

      // Calculate real-time metrics...
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

      res.json({
        realtimeMetrics,
        trendIndicators: {
          salesTrend: 'stable' as const,
          confidence: 0.95
        },
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

  app.get("/api/shops/:shopId/analytics/historical", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
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

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  // Start analytics updates
  process.nextTick(() => {
    try {
      startAnalyticsUpdates();
    } catch (error) {
      console.error('Failed to start analytics updates:', error);
    }
  });

  return httpServer;
}