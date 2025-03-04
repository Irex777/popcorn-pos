import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertOrderItemSchema, updateProductStockSchema, insertProductSchema, insertCategorySchema, insertShopSchema } from "@shared/schema";
import { z } from "zod";
import { setupWebSocket, startAnalyticsUpdates } from "./websocket";
import { createPaymentIntent } from './stripe';
import { categories, products, orders, type Order, type Product, type Category } from "@shared/schema";

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
      // Validate required name field
      if (!req.body.name?.trim()) {
        return res.status(400).json({ error: "Shop name is required" });
      }

      // Create shop data with authenticated user's ID
      const shopData = {
        name: req.body.name.trim(),
        address: req.body.address?.trim() || null,
        createdById: req.user.id
      };

      // Create the shop
      const shop = await storage.createShop(shopData);
      if (!shop) {
        throw new Error("Failed to create shop");
      }

      res.status(201).json(shop);
    } catch (error) {
      console.error('Shop creation error:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Invalid shop data" 
      });
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

  // Payment endpoint
  app.post("/api/create-payment-intent", requireShopAccess, async (req, res) => {
    try {
      const { amount, currency, shopId } = req.body;

      if (!amount || !currency) {
        return res.status(400).json({ error: "Amount and currency are required" });
      }

      if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required" });
      }

      const paymentIntent = await createPaymentIntent({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: currency.toLowerCase()
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to create payment intent" 
      });
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

  // System test endpoint (admin only)
  app.post("/api/system-test", requireAdmin, async (req, res) => {
    let testShopId: number | null = null;
    let testCategoryId: number | null = null;
    let testProductId: number | null = null;
    let testOrderId: number | null = null;

    try {
      // Step 1: Create test shop
      const testShop = await storage.createShop({
        name: "Test Shop",
        createdById: req.user.id
      });
      testShopId = testShop.id;
      console.log('✓ Test shop created');

      // Step 2: Create test category
      const testCategory = await storage.createCategory({
        name: "Test Category",
        description: "Test Description",
        color: "#000000",
        shopId: testShopId
      });
      testCategoryId = testCategory.id;
      console.log('✓ Test category created');

      // Step 3: Create test product
      const testProduct = await storage.createProduct({
        name: "Test Product",
        description: "Test Description",
        price: "9.99",
        stock: 100,
        categoryId: testCategoryId,
        shopId: testShopId
      });
      testProductId = testProduct.id;
      console.log('✓ Test product created');

      // Step 4: Create test order
      const testOrder = await storage.createOrder(
        {
          total: "9.99",
          status: "completed",
          shopId: testShopId
        },
        [{
          productId: testProductId,
          quantity: 1,
          price: "9.99"
        }]
      );
      testOrderId = testOrder.id;
      console.log('✓ Test order created');

      // Step 5: Test reading data
      const shopExists = await storage.getShop(testShopId);
      const categoryExists = await storage.getCategories(testShopId);
      const productExists = await storage.getProducts(testShopId);
      const orderExists = await storage.getOrders(testShopId);

      if (!shopExists || !categoryExists.length || !productExists.length || !orderExists.length) {
        throw new Error("Data verification failed");
      }
      console.log('✓ Data verification successful');

      // Step 6: Clean up test data
      if (testOrderId) await storage.deleteOrderById(testOrderId, testShopId);
      if (testProductId) await storage.deleteProduct(testProductId, testShopId);
      if (testCategoryId) await storage.deleteCategory(testCategoryId, testShopId);
      if (testShopId) await storage.deleteShop(testShopId);
      console.log('✓ Test data cleanup successful');

      res.json({
        success: true,
        message: "All system tests passed successfully! Created and verified: shop, category, product, and order. All test data has been cleaned up."
      });
    } catch (error) {
      console.error('System test error:', error);

      // Attempt to clean up any remaining test data
      try {
        if (testOrderId) await storage.deleteOrderById(testOrderId, testShopId!);
        if (testProductId) await storage.deleteProduct(testProductId, testShopId!);
        if (testCategoryId) await storage.deleteCategory(testCategoryId, testShopId!);
        if (testShopId) await storage.deleteShop(testShopId);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred during system test"
      });
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