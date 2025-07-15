import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertOrderItemSchema, updateProductStockSchema, insertProductSchema, insertCategorySchema, insertShopSchema, insertTableSchema, insertReservationSchema, insertKitchenTicketSchema, insertStaffRoleSchema } from "@shared/schema";
import { z } from "zod";

import paymentsRouter from './routes/payments';
import { categories, products, orders, stripeSettings, type Order, type Product, type Category, type StripeSettings } from "@shared/schema";

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  // Demo mode bypass for testing
  if (process.env.DEMO_MODE === 'true') {
    return next();
  }
  
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Only administrators can perform this action" });
  }
  next();
};

// Middleware to check if user has access to shop
const requireShopAccess = async (req: any, res: any, next: any) => {
  // Demo mode bypass for testing
  if (process.env.DEMO_MODE === 'true') {
    return next();
  }
  
  const shopId = parseInt(req.params.shopId || req.body.shopId);
  if (!shopId) {
    return res.status(400).json({ error: "Shop ID is required" });
  }

  const shop = await storage.getShop(shopId);
  if (!shop) {
    return res.status(404).json({ error: "Shop not found" });
  }

  // Require authentication (bypass in demo mode)
  if (process.env.DEMO_MODE !== 'true' && !req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Admin users can access all shops (or demo mode)
  if (process.env.DEMO_MODE === 'true' || (req.user && req.user.isAdmin)) {
    return next();
  }

  // For non-admin users, check if they have access to this shop
  if (req.user) {
    const user = await storage.getUser(req.user.id);
    if (!user?.shopIds?.includes(shopId)) {
      return res.status(403).json({ error: "You don't have access to this shop" });
    }
  }

  next();
};

export function registerRoutes(app: Express): Server {
  // Health check endpoint for Docker
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Debug endpoint to check environment and status
  app.get("/api/debug", async (req, res) => {
    try {
      const debugInfo: any = {
        timestamp: new Date().toISOString(),
        status: "running",
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
          DATABASE_URL: process.env.DATABASE_URL ? 'SET ✅' : 'MISSING ❌',
          SESSION_SECRET: process.env.SESSION_SECRET ? 'SET ✅' : 'MISSING ❌',
          PUBLIC_URL: process.env.PUBLIC_URL || 'NOT SET',
          NEON_DISABLE_WEBSOCKETS: process.env.NEON_DISABLE_WEBSOCKETS
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        database: {
          status: 'unknown'
        }
      };

      // Test database connection
      try {
        const users = await storage.getAllUsers();
        debugInfo.database = {
          status: 'connected ✅',
          userCount: users.length
        };
      } catch (dbError) {
        debugInfo.database = {
          status: 'error ❌',
          error: dbError instanceof Error ? dbError.message : String(dbError)
        };
      }

      res.status(200).json(debugInfo);
    } catch (error) {
      res.status(500).json({ 
        error: 'Debug endpoint failed', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

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
        businessMode: req.body.businessMode || 'shop',
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
  if (process.env.DEMO_MODE !== 'true' && !req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    // In demo mode, act as admin
    if (process.env.DEMO_MODE === 'true' || (req.user && req.user.isAdmin)) {
      const shops = await storage.getAllShops();
      return res.json(shops);
    }
    
    // For non-admin users, get their assigned shops
    const user = await storage.getUser(req.user!.id);
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
        address: req.body.address || null,
        businessMode: req.body.businessMode || existingShop.businessMode || 'shop'
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

  app.delete("/api/shops/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const confirmationName = req.body.confirmationName;

      // Check if shop exists
      const existingShop = await storage.getShop(id);
      if (!existingShop) {
        return res.status(404).json({ error: "Shop not found" });
      }

      // Check if shop has any data that would be deleted
      const shopCategories = await storage.getCategories(id);
      const shopOrders = await storage.getOrders(id);
      const shopProducts = await storage.getProducts(id);
      const hasData = shopCategories.length > 0 || shopOrders.length > 0 || shopProducts.length > 0;

      if (hasData) {
        // Shop has data - require confirmation
        if (!confirmationName) {
          const productCount = shopProducts.length;
          return res.status(400).json({
            error: "Shop contains data that will be permanently deleted",
            requiresConfirmation: true,
            shopName: existingShop.name,
            dataToBeDeleted: {
              categories: shopCategories.length,
              products: productCount,
              orders: shopOrders.length
            },
            message: `This shop contains ${shopCategories.length} categories, ${productCount} products, and ${shopOrders.length} orders. All data will be permanently deleted. Type the shop name "${existingShop.name}" to confirm deletion.`
          });
        }

        // Verify confirmation name matches exactly
        if (confirmationName !== existingShop.name) {
          return res.status(400).json({ 
            error: "Shop name confirmation does not match",
            message: `Please type the exact shop name "${existingShop.name}" to confirm deletion.`
          });
        }

        // Confirmed - proceed with cascade deletion
        const deletedShop = await storage.deleteShop(id, true);
        if (!deletedShop) {
          return res.status(500).json({ error: "Failed to delete shop" });
        }

        res.json({ 
          success: true, 
          message: "Shop and all related data have been permanently deleted", 
          shop: deletedShop,
          cascadeDelete: true
        });
      } else {
        // Shop is empty - safe to delete without confirmation
        const deletedShop = await storage.deleteShop(id, false);
        if (!deletedShop) {
          return res.status(500).json({ error: "Failed to delete shop" });
        }

        res.json({ 
          success: true, 
          message: "Empty shop deleted successfully", 
          shop: deletedShop,
          cascadeDelete: false
        });
      }
    } catch (error) {
      console.error('Error deleting shop:', error);
      res.status(500).json({ error: 'Failed to delete shop' });
    }
  });

  // Categories routes
  app.get("/api/shops/:shopId/categories", requireShopAccess, async (req, res) => {
    const categories = await storage.getCategories(parseInt(req.params.shopId));
    res.json(categories);
  });

  app.post("/api/shops/:shopId/categories", requireShopAccess, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        shopId: parseInt(req.params.shopId)
      });
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error('Category creation error:', error);
      res.status(400).json({ 
        error: "Invalid category data",
        details: error instanceof Error ? error.message : String(error)
      });
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

  // Add items to existing order (must be before /orders/:id routes)
  app.post("/api/shops/:shopId/orders/:id/items", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const orderId = parseInt(req.params.id);

      // Check if the order exists and belongs to the shop
      const existingOrder = await storage.getOrder(orderId);
      if (!existingOrder || existingOrder.shopId !== shopId) {
        return res.status(404).json({ error: "Order not found" });
      }

      const itemsData = z.array(insertOrderItemSchema).parse(
        req.body.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      );

      const updatedOrder = await storage.addItemsToOrder(orderId, itemsData);
      const items = await storage.getOrderItems(orderId);
      
      res.json({ ...updatedOrder, items });
    } catch (error) {
      console.error('Error adding items to order:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to add items to order",
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

  // Complete payment for restaurant orders
  app.patch("/api/shops/:shopId/orders/:id/complete-payment", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const orderId = parseInt(req.params.id);
      const { status, paymentMethod, completedAt } = req.body;

      // Check if the order exists and belongs to the shop
      const existingOrder = await storage.getOrder(orderId);
      if (!existingOrder || existingOrder.shopId !== shopId) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Update order status to completed
      const updatedOrder = await storage.updateOrder(orderId, {
        status: status || 'completed',
        paymentMethod: paymentMethod || 'cash',
        completedAt: completedAt ? new Date(completedAt) : new Date()
      });

      if (!updatedOrder) {
        return res.status(500).json({ error: "Failed to complete payment" });
      }

      // If the order has a table, mark it as available for cleaning
      if (existingOrder.tableId) {
        await storage.updateTable(existingOrder.tableId, { status: 'cleaning' });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error completing payment:', error);
      res.status(500).json({ error: "Failed to complete payment" });
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

  // Restaurant Tables routes
  app.get("/api/shops/:shopId/tables", requireShopAccess, async (req, res) => {
    try {
      const tables = await storage.getTables(parseInt(req.params.shopId));
      res.json(tables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      res.status(500).json({ error: 'Failed to fetch tables' });
    }
  });

  app.post("/api/shops/:shopId/tables", requireShopAccess, async (req, res) => {
    try {
      const tableData = insertTableSchema.parse({
        ...req.body,
        shopId: parseInt(req.params.shopId)
      });
      const table = await storage.createTable(tableData);
      res.status(201).json(table);
    } catch (error) {
      console.error('Table creation error:', error);
      res.status(400).json({ error: "Invalid table data" });
    }
  });

  app.patch("/api/shops/:shopId/tables/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const tableId = parseInt(req.params.id);

      const existingTable = await storage.getTable(tableId);
      if (!existingTable || existingTable.shopId !== shopId) {
        return res.status(404).json({ error: "Table not found" });
      }

      const table = await storage.updateTable(tableId, req.body);
      if (!table) {
        return res.status(500).json({ error: "Failed to update table" });
      }

      res.json(table);
    } catch (error) {
      console.error('Table update error:', error);
      res.status(400).json({ error: "Invalid table data" });
    }
  });

  app.delete("/api/shops/:shopId/tables/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const tableId = parseInt(req.params.id);

      const existingTable = await storage.getTable(tableId);
      if (!existingTable || existingTable.shopId !== shopId) {
        return res.status(404).json({ error: "Table not found" });
      }

      const deletedTable = await storage.deleteTable(tableId);
      if (!deletedTable) {
        return res.status(500).json({ error: "Failed to delete table" });
      }

      res.json({ success: true, message: "Table deleted successfully" });
    } catch (error) {
      console.error('Table deletion error:', error);
      res.status(500).json({ error: "Failed to delete table" });
    }
  });

  // Reservations routes
  app.get("/api/shops/:shopId/reservations", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const reservations = await storage.getReservations(shopId, date);
      res.json(reservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      res.status(500).json({ error: 'Failed to fetch reservations' });
    }
  });

  app.post("/api/shops/:shopId/reservations", requireShopAccess, async (req, res) => {
    try {
      const reservationData = insertReservationSchema.parse({
        ...req.body,
        shopId: parseInt(req.params.shopId),
        reservationTime: new Date(req.body.reservationTime)
      });
      const reservation = await storage.createReservation(reservationData);
      
      // If a table was assigned to this reservation, mark it as reserved
      if (reservation.tableId) {
        await storage.updateTable(reservation.tableId, { status: 'reserved' });
      }
      
      res.status(201).json(reservation);
    } catch (error) {
      console.error('Reservation creation error:', error);
      res.status(400).json({ error: "Invalid reservation data" });
    }
  });

  app.patch("/api/shops/:shopId/reservations/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const reservationId = parseInt(req.params.id);

      const existingReservation = await storage.getReservation(reservationId);
      if (!existingReservation || existingReservation.shopId !== shopId) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      const updateData = { ...req.body };
      if (req.body.reservationTime) {
        updateData.reservationTime = new Date(req.body.reservationTime);
      }

      const reservation = await storage.updateReservation(reservationId, updateData);
      if (!reservation) {
        return res.status(500).json({ error: "Failed to update reservation" });
      }

      // Handle table status changes based on reservation status
      if (req.body.status) {
        if (existingReservation.tableId) {
          if (req.body.status === 'seated') {
            // Mark table as occupied when guests are seated
            await storage.updateTable(existingReservation.tableId, { status: 'occupied' });
          } else if (req.body.status === 'cancelled' || req.body.status === 'no_show') {
            // Mark table as available when reservation is cancelled or no-show
            await storage.updateTable(existingReservation.tableId, { status: 'available' });
          }
        }
      }

      res.json(reservation);
    } catch (error) {
      console.error('Reservation update error:', error);
      res.status(400).json({ error: "Invalid reservation data" });
    }
  });

  app.delete("/api/shops/:shopId/reservations/:id", requireShopAccess, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const reservationId = parseInt(req.params.id);

      const existingReservation = await storage.getReservation(reservationId);
      if (!existingReservation || existingReservation.shopId !== shopId) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      // If reservation had a table assigned, mark it as available
      if (existingReservation.tableId) {
        await storage.updateTable(existingReservation.tableId, { status: 'available' });
      }

      const deletedReservation = await storage.deleteReservation(reservationId);
      if (!deletedReservation) {
        return res.status(500).json({ error: "Failed to delete reservation" });
      }

      res.json({ success: true, message: "Reservation deleted successfully" });
    } catch (error) {
      console.error('Reservation deletion error:', error);
      res.status(500).json({ error: "Failed to delete reservation" });
    }
  });

  // Kitchen Tickets routes
  app.get("/api/shops/:shopId/kitchen/tickets", requireShopAccess, async (req, res) => {
    try {
      const tickets = await storage.getKitchenTickets(parseInt(req.params.shopId));
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching kitchen tickets:', error);
      res.status(500).json({ error: 'Failed to fetch kitchen tickets' });
    }
  });

  app.post("/api/shops/:shopId/kitchen/tickets", requireShopAccess, async (req, res) => {
    try {
      const ticketData = insertKitchenTicketSchema.parse({
        ...req.body,
        estimatedCompletion: req.body.estimatedCompletion ? new Date(req.body.estimatedCompletion) : undefined
      });
      const ticket = await storage.createKitchenTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error('Kitchen ticket creation error:', error);
      res.status(400).json({ error: "Invalid kitchen ticket data" });
    }
  });

  app.patch("/api/shops/:shopId/kitchen/tickets/:id", requireShopAccess, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const updateData = { ...req.body };
      
      if (req.body.estimatedCompletion) {
        updateData.estimatedCompletion = new Date(req.body.estimatedCompletion);
      }
      if (req.body.status === 'served' && !updateData.completedAt) {
        updateData.completedAt = new Date();
      }

      const ticket = await storage.updateKitchenTicket(ticketId, updateData);
      if (!ticket) {
        return res.status(404).json({ error: "Kitchen ticket not found" });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Kitchen ticket update error:', error);
      res.status(400).json({ error: "Invalid kitchen ticket data" });
    }
  });

  // Staff Roles routes
  app.get("/api/shops/:shopId/staff-roles", requireShopAccess, async (req, res) => {
    try {
      const roles = await storage.getStaffRoles(parseInt(req.params.shopId));
      res.json(roles);
    } catch (error) {
      console.error('Error fetching staff roles:', error);
      res.status(500).json({ error: 'Failed to fetch staff roles' });
    }
  });

  app.post("/api/shops/:shopId/staff-roles", requireShopAccess, async (req, res) => {
    try {
      const roleData = insertStaffRoleSchema.parse({
        ...req.body,
        shopId: parseInt(req.params.shopId)
      });
      const role = await storage.createStaffRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      console.error('Staff role creation error:', error);
      res.status(400).json({ error: "Invalid staff role data" });
    }
  });

  // Enhanced orders routes for restaurant workflow
  app.post("/api/shops/:shopId/orders/dine-in", requireShopAccess, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body.order,
        shopId: parseInt(req.params.shopId),
        orderType: "dine_in"
      });
      const itemsData = z.array(insertOrderItemSchema).parse(
        req.body.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          courseNumber: item.courseNumber || 1,
          specialRequests: item.specialRequests,
          preparationTime: item.preparationTime
        }))
      );

      const order = await storage.createOrder(orderData, itemsData);

      if (!order) {
        return res.status(500).json({ error: "Failed to create order" });
      }

      // If order is for a table, mark table as occupied
      if (orderData.tableId) {
        await storage.updateTable(orderData.tableId, { status: 'occupied' });
      }

      // Process items based on whether they require kitchen preparation
      const kitchenItems = [];
      const nonKitchenItems = [];
      
      for (const item of itemsData) {
        const product = await storage.getProduct(item.productId);
        if (product && product.requiresKitchen === true) {
          kitchenItems.push(item);
        } else {
          nonKitchenItems.push(item);
        }
      }
      
      // Immediately mark non-kitchen items as "served" since they can be delivered right away
      if (nonKitchenItems.length > 0) {
        for (const item of nonKitchenItems) {
          await storage.updateOrderItemStatus(order.id, item.productId, "served");
        }
      }
      
      // Create kitchen ticket only if order has items that require kitchen preparation
      if (kitchenItems.length > 0) {
        const ticketNumber = `T${order.id}-${Date.now().toString().slice(-4)}`;
        await storage.createKitchenTicket({
          orderId: order.id,
          ticketNumber,
          status: "new",
          priority: "normal"
        });
      }

      const items = await storage.getOrderItems(order.id);
      res.status(201).json({ ...order, items });
    } catch (error) {
      console.error('Dine-in order creation error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid order data"
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
      // In demo mode, ensure we have a valid user ID
      let userId = req.user?.id;
      if (!userId) {
        // Create a temporary user for the test if none exists
        const tempUser = await storage.createUser({
          username: "test-user",
          password: "test-password"
        });
        userId = tempUser.id;
      }
      
      const testShop = await storage.createShop({
        name: "Test Shop",
        address: null,
        businessMode: "shop",
        createdById: userId
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

      // Step 6: Test shop deletion functionality
      console.log('✓ Testing shop deletion...');
      
      // Test force delete (should succeed and clean up all data)
      const deletedShop = await storage.deleteShop(testShopId!, true);
      if (!deletedShop) {
        throw new Error("Force delete failed");
      }
      console.log('✓ Force delete successfully removed shop and all data');
      
      // Verify all data was deleted
      const remainingCategories = await storage.getCategories(testShopId!);
      const remainingProducts = await storage.getProducts(testShopId!);
      const remainingOrders = await storage.getOrders(testShopId!);
      
      if (remainingCategories.length > 0 || remainingProducts.length > 0 || remainingOrders.length > 0) {
        throw new Error("Force delete did not clean up all data");
      }
      console.log('✓ Verified all shop data was properly cleaned up');

      res.json({
        success: true,
        message: "All system tests passed successfully! Created and verified: shop, category, product, order, and shop deletion with cascade cleanup. All test data has been cleaned up."
      });
    } catch (error) {
      console.error('System test error:', error);

      // Attempt to clean up any remaining test data
      try {
        // Use force delete to clean up everything if shop still exists
        if (testShopId) {
          const existingShop = await storage.getShop(testShopId);
          if (existingShop) {
            await storage.deleteShop(testShopId, true);
          }
        }
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


  // Start analytics updates
  process.nextTick(() => {
    try {

    } catch (error) {
      console.error('Failed to start analytics updates:', error);
    }
  });

  return httpServer;
}
