import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertOrderItemSchema, updateProductStockSchema, insertProductSchema, insertCategorySchema, insertShopSchema } from "@shared/schema";
import { z } from "zod";
import { setupWebSocket, startAnalyticsUpdates } from "./websocket";
import paymentsRouter from './routes/payments';
import { categories, products, orders, stripeSettings, type Order, type Product, type Category, type StripeSettings } from "@shared/schema";

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || !req.user.isAdmin) {
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

  // Require authentication
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Admin users can access all shops
  if (req.user.isAdmin) {
    return next();
  }

  // For non-admin users, check if they have access to this shop
  const user = await storage.getUser(req.user.id);
  if (!user?.shopIds?.includes(shopId)) {
    return res.status(403).json({ error: "You don't have access to this shop" });
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
        createdById: req.user?.id || 0
      };

      // Parse the data through the schema
      const validatedData = insertShopSchema.parse(shopData);

      // Create the shop
      const shop = await storage.createShop(validatedData);
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

  // Stripe settings routes
app.get("/api/shops/:shopId/stripe-settings", requireShopAccess, async (req, res) => {
  try {
    const shopId = parseInt(req.params.shopId);
    const settings = await storage.getStripeSettings(shopId);
    res.json(settings || { enabled: false, publishableKey: null, secretKey: null });
  } catch (error) {
    console.error('Error fetching Stripe settings:', error);
    res.status(500).json({ error: 'Failed to fetch Stripe settings' });
  }
});

app.post("/api/shops/:shopId/stripe-settings", requireAdmin, async (req, res) => {
  try {
    const shopId = parseInt(req.params.shopId);
    const { publishableKey, secretKey, enabled } = req.body;

    const settings = await storage.updateStripeSettings({
      shopId,
      publishableKey: publishableKey || null,
      secretKey: secretKey || null,
      enabled: !!enabled
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating Stripe settings:', error);
    res.status(500).json({ error: 'Failed to update Stripe settings' });
  }
});

app.get("/api/shops", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    if (req.user.isAdmin) {
      const shops = await storage.getAllShops();
      return res.json(shops);
    }
    
    // For non-admin users, get their assigned shops
    const user = await storage.getUser(req.user.id);
    if (!user?.shopIds) {
      return res.json([]);
    }
    
    const shops = await storage.getAllShops();
    const userShops = shops.filter(shop => user.shopIds!.includes(shop.id));
    
    res.json(userShops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

  // Stripe settings routes
  app.get("/api/shops/:shopId/stripe-settings", requireAdmin, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const settings = await storage.getStripeSettings(shopId);
      
      if (!settings) {
        return res.json({ 
          enabled: false,
          publishableKey: null,
          secretKey: null
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching Stripe settings:', error);
      res.status(500).json({ error: 'Failed to fetch Stripe settings' });
    }
  });

  app.post("/api/shops/:shopId/stripe-settings", requireAdmin, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const { publishableKey, secretKey, enabled } = req.body;

      const settings = await storage.updateStripeSettings({
        shopId,
        publishableKey: publishableKey || null,
        secretKey: secretKey || null,
        enabled: !!enabled
      });

      res.json(settings);
    } catch (error) {
      console.error('Error updating Stripe settings:', error);
      res.status(500).json({ error: 'Failed to update Stripe settings' });
    }
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

  app.patch("/api/shops/:shopId/categories/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const categoryId = parseInt(req.params.id);

      // First check if category exists and belongs to the shop
      const existingCategory = await storage.getCategory(categoryId);
      if (!existingCategory || existingCategory.shopId !== shopId) {
        return res.status(404).json({ error: "Category not found" });
      }

      const categoryData = insertCategorySchema.parse({
        ...req.body,
        shopId: shopId
      });

      const category = await storage.updateCategory(categoryId, categoryData);
      if (!category) {
        return res.status(500).json({ error: "Failed to update category" });
      }

      res.json(category);
    } catch (error) {
      console.error('Category update error:', error);
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.delete("/api/shops/:shopId/categories/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const categoryId = parseInt(req.params.id);

      // Check if category exists and belongs to the shop
      const existingCategory = await storage.getCategory(categoryId);
      if (!existingCategory || existingCategory.shopId !== shopId) {
        return res.status(404).json({ error: "Category not found" });
      }

      const deletedCategory = await storage.deleteCategory(categoryId);
      if (!deletedCategory) {
        return res.status(500).json({ error: "Failed to delete category" });
      }

      res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
      console.error('Category deletion error:', error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Products routes
  app.get("/api/shops/:shopId/products", requireShopAccess, async (req, res) => {
    const products = await storage.getProducts(parseInt(req.params.shopId));
    res.json(products);
  });

  app.post("/api/shops/:shopId/products", requireShopAccess, async (req, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        shopId: parseInt(req.params.shopId)
      });
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error('Product creation error:', error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.patch("/api/shops/:shopId/products/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const productId = parseInt(req.params.id);

      // First check if product exists and belongs to the shop
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct || existingProduct.shopId !== shopId) {
        return res.status(404).json({ error: "Product not found" });
      }

      const productData = insertProductSchema.parse({
        ...req.body,
        shopId: shopId
      });

      const product = await storage.updateProduct(productId, productData);
      if (!product) {
        return res.status(500).json({ error: "Failed to update product" });
      }

      res.json(product);
    } catch (error) {
      console.error('Product update error:', error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.delete("/api/shops/:shopId/products/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const productId = parseInt(req.params.id);

      // Check if product exists and belongs to the shop
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct || existingProduct.shopId !== shopId) {
        return res.status(404).json({ error: "Product not found" });
      }

      const deletedProduct = await storage.deleteProduct(productId);
      if (!deletedProduct) {
        return res.status(500).json({ error: "Failed to delete product" });
      }

      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      console.error('Product deletion error:', error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Orders routes
  app.get("/api/shops/:shopId/orders", requireShopAccess, async (req, res) => {
    const orders = await storage.getOrders(parseInt(req.params.shopId));
    const ordersWithItems = await Promise.all(
      orders.map(async (order: Order) => {
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

      // Then delete the order itself, include shopId for security check
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

  // User routes
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await Promise.all(
        (await storage.getAllUsers()).map(async (user) => {
          const userWithShops = await storage.getUser(user.id);
          return {
            ...user,
            shopIds: userWithShops?.shopIds || []
          };
        })
      );
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, password, shopIds } = req.body;
      let userDetailsChanged = false;
      let shopsChanged = false;

      // Handle shop assignments first (if provided)
      if (Array.isArray(shopIds)) {
        await storage.updateUserShops(userId, shopIds);
        shopsChanged = true;
      }

      // Only handle user details if provided (username/password)
      const userUpdates: { username?: string; password?: string } = {};
      if (username) userUpdates.username = username;
      if (password) userUpdates.password = password;

      if (Object.keys(userUpdates).length > 0) {
        await storage.updateUser(userId, userUpdates);
        userDetailsChanged = true;
      }

      // Return error if no valid updates were performed
      if (!userDetailsChanged && !shopsChanged) {
        return res.status(400).json({ error: "No values to set" });
      }

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Register payment routes
  app.use('/api', paymentsRouter);


  // Analytics endpoints
  app.get("/api/shops/:shopId/analytics/real-time", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const orders = await storage.getOrders(shopId);
      const currentHour = new Date().getHours();

      // Calculate real-time metrics...
      const currentHourOrders = orders.filter((order: Order) => {
        const orderHour = new Date(order.createdAt!).getHours();
        return orderHour === currentHour;
      });

      const realtimeMetrics = {
        currentHourSales: currentHourOrders.reduce((sum: number, order: Order) => sum + Number(order.total), 0),
        activeCustomers: new Set(currentHourOrders.map((order: Order) => order.id)).size,
        averageOrderValue: currentHourOrders.length > 0
          ? currentHourOrders.reduce((sum: number, order: Order) => sum + Number(order.total), 0) / currentHourOrders.length
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
      const historicalData = orders.map((order: Order) => ({
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
        address: null,
        createdById: req.user?.id || 0 // Fallback for typescript
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
        price: "9.99",
        stock: 100,
        categoryId: testCategoryId,
        shopId: testShopId,
        imageUrl: ""
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
      if (testOrderId) await storage.deleteOrderById(testOrderId, testShopId!);
      if (testProductId) await storage.deleteProduct(testProductId);
      if (testCategoryId) await storage.deleteCategory(testCategoryId);
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
        if (testProductId) await storage.deleteProduct(testProductId);
        if (testCategoryId) await storage.deleteCategory(testCategoryId);
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
