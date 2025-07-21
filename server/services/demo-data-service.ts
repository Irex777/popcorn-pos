import { db } from '../db.js';
import { shops, categories, products, orders, orderItems, tables, users, userShops } from '../../shared/schema.js';
import { DemoDataConfig, getDemoData, SHOP_DEMO_DATA, RESTAURANT_DEMO_DATA } from '../../shared/demo-data.js';
import { eq, and } from 'drizzle-orm';

export class DemoDataService {
  /**
   * Creates a demo shop or restaurant with populated data
   */
  static async createDemoShop(config: DemoDataConfig, createdById: number) {
    const transaction = await db.transaction(async (tx) => {
      try {
        // 1. Create the shop
        const [newShop] = await tx.insert(shops).values({
          name: config.name,
          address: config.address || (config.type === 'shop' ? 'Demo Cafe Location' : 'Demo Restaurant Location'),
          businessMode: config.type,
          createdById
        }).returning();

        const shopId = newShop.id;

        // 2. Assign creator to the shop
        await tx.insert(userShops).values({
          userId: createdById,
          shopId
        });

        // 3. Get demo data for the specified type
        const demoData = getDemoData(config);

        // 4. Create categories
        const createdCategories = await tx.insert(categories).values(
          demoData.categories.map(cat => ({
            name: cat.name,
            description: cat.description,
            color: cat.color,
            shopId
          }))
        ).returning();

        // 5. Create products
        const createdProducts = await tx.insert(products).values(
          demoData.products.map(product => ({
            name: product.name,
            price: product.price,
            categoryId: createdCategories[product.categoryIndex].id,
            imageUrl: product.imageUrl,
            stock: product.initialStock || 0,
            requiresKitchen: product.requiresKitchen || false,
            shopId
          }))
        ).returning();

        // 6. Create tables (for restaurants only)
        let createdTables: any[] = [];
        if (config.type === 'restaurant' && 'tables' in demoData) {
          createdTables = await tx.insert(tables).values(
            demoData.tables.map(table => ({
              number: table.tableNumber.toString(),
              capacity: table.capacity,
              section: table.section,
              xPosition: table.x || 0,
              yPosition: table.y || 0,
              status: 'available' as const,
              shopId
            }))
          ).returning();
        }

        // 7. Create historical orders if requested
        if (config.includeHistory) {
          await this.createHistoricalOrders(tx, demoData.orders, createdProducts, shopId, createdTables);
        }

        console.log(`✅ Created demo ${config.type}: "${config.name}" with ${createdCategories.length} categories, ${createdProducts.length} products${config.includeHistory ? `, and ${demoData.orders.length} historical orders` : ''}`);

        return {
          shop: newShop,
          categoriesCount: createdCategories.length,
          productsCount: createdProducts.length,
          tablesCount: config.type === 'restaurant' && 'tables' in demoData ? demoData.tables.length : 0,
          ordersCount: config.includeHistory ? demoData.orders.length : 0
        };

      } catch (error) {
        console.error('Error creating demo shop:', error);
        throw error;
      }
    });

    return transaction;
  }

  /**
   * Creates historical orders for demo data
   */
  private static async createHistoricalOrders(
    tx: any,
    demoOrders: any[],
    createdProducts: any[],
    shopId: number,
    createdTables: any[] = []
  ) {
    for (const demoOrder of demoOrders) {
      // Calculate order date based on createdDaysAgo
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - demoOrder.createdDaysAgo);
      orderDate.setHours(
        Math.floor(Math.random() * 12) + 8, // Random hour between 8-20
        Math.floor(Math.random() * 60), // Random minute
        0, 0
      );

      // Calculate total amount
      const totalAmount = demoOrder.items.reduce((sum: number, item: any) => {
        const product = createdProducts[item.productIndex];
        return sum + (product.price * item.quantity);
      }, 0);

      // Map table ID if this is a dine-in order
      let actualTableId = null;
      if (demoOrder.orderType === 'dine_in' && demoOrder.tableId && createdTables.length > 0) {
        // Find the created table that matches the demo table number
        const matchingTable = createdTables.find(table => 
          parseInt(table.number) === demoOrder.tableId
        );
        if (matchingTable) {
          actualTableId = matchingTable.id;
        }
      }

      // Create the order
      const [createdOrder] = await tx.insert(orders).values({
        orderType: demoOrder.orderType,
        tableId: actualTableId,
        guestCount: demoOrder.guestCount,
        specialInstructions: demoOrder.specialInstructions,
        status: demoOrder.status,
        paymentMethod: demoOrder.paymentMethod,
        total: totalAmount,
        createdAt: orderDate,
        shopId
      }).returning();

      // Create order items
      const orderItemsData = demoOrder.items.map((item: any) => ({
        orderId: createdOrder.id,
        productId: createdProducts[item.productIndex].id,
        quantity: item.quantity,
        price: createdProducts[item.productIndex].price,
        specialRequests: item.specialRequests
      }));

      await tx.insert(orderItems).values(orderItemsData);
    }
  }

  /**
   * Enhanced shop deletion with comprehensive data cleanup
   */
  static async deleteShopWithData(shopId: number) {
    const transaction = await db.transaction(async (tx) => {
      try {
        console.log(`🗑️ Starting comprehensive deletion of shop ${shopId}...`);

        // 1. Delete order items first (references orders and products)
        const deletedOrderItems = await tx.delete(orderItems)
          .where(eq(orderItems.orderId, 
            // Subquery to get order IDs for this shop
            tx.select({ id: orders.id }).from(orders).where(eq(orders.shopId, shopId))
          ));

        // 2. Delete orders
        const deletedOrders = await tx.delete(orders)
          .where(eq(orders.shopId, shopId));

        // 3. Delete products
        const deletedProducts = await tx.delete(products)
          .where(eq(products.shopId, shopId));

        // 4. Delete categories
        const deletedCategories = await tx.delete(categories)
          .where(eq(categories.shopId, shopId));

        // 5. Delete restaurant-specific data
        let deletedTables = null;
        let deletedReservations = null;
        let deletedKitchenTickets = null;
        let deletedStaffRoles = null;

        // Check if shop has restaurant tables
        try {
          deletedTables = await tx.delete(tables)
            .where(eq(tables.shopId, shopId));
        } catch (error) {
          // Table might not exist in schema yet
          console.log('Tables deletion skipped (table may not exist)');
        }

        // TODO: Add deletion for other restaurant-specific tables when they exist:
        // - reservations
        // - kitchen_tickets 
        // - staff_roles

        // 6. Delete user-shop assignments
        const deletedUserShops = await tx.delete(userShops)
          .where(eq(userShops.shopId, shopId));

        // 7. Delete shop itself
        const deletedShop = await tx.delete(shops)
          .where(eq(shops.id, shopId));

        const deletionSummary = {
          shop: deletedShop,
          categories: deletedCategories,
          products: deletedProducts,
          orders: deletedOrders,
          orderItems: deletedOrderItems,
          tables: deletedTables,
          userShops: deletedUserShops
        };

        console.log(`✅ Shop ${shopId} and all associated data deleted successfully`);
        console.log('Deletion summary:', deletionSummary);

        return deletionSummary;

      } catch (error) {
        console.error('Error during shop deletion:', error);
        throw error;
      }
    });

    return transaction;
  }

  /**
   * Gets statistics about what data exists for a shop
   */
  static async getShopDataStats(shopId: number) {
    try {
      const [shopData] = await db.select().from(shops).where(eq(shops.id, shopId));
      
      if (!shopData) {
        throw new Error('Shop not found');
      }

      // Count related data
      const categoriesCount = await db.select().from(categories).where(eq(categories.shopId, shopId));
      const productsCount = await db.select().from(products).where(eq(products.shopId, shopId));
      const ordersCount = await db.select().from(orders).where(eq(orders.shopId, shopId));

      let tablesCount = 0;
      try {
        const tablesResult = await db.select().from(tables).where(eq(tables.shopId, shopId));
        tablesCount = tablesResult.length;
      } catch (error) {
        // Tables table might not exist
      }

      return {
        shop: shopData,
        stats: {
          categories: categoriesCount.length,
          products: productsCount.length,
          orders: ordersCount.length,
          tables: tablesCount
        }
      };

    } catch (error) {
      console.error('Error getting shop data stats:', error);
      throw error;
    }
  }

  /**
   * Validates if user can create demo shops (admin only)
   */
  static async validateDemoShopCreation(userId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isAdmin) {
      throw new Error('Only administrators can create demo shops');
    }

    return true;
  }

  /**
   * Gets available demo shop templates
   */
  static getDemoTemplates() {
    return {
      shop: {
        name: 'Demo Coffee Shop',
        description: 'A sample coffee shop with beverages, pastries, and snacks',
        features: [
          `${SHOP_DEMO_DATA.categories.length} product categories`,
          `${SHOP_DEMO_DATA.products.length} products`,
          'Simple retail/cafe setup',
          'Mix of kitchen and non-kitchen items',
          'Historical order data available'
        ]
      },
      restaurant: {
        name: 'Demo Restaurant',
        description: 'A full-service restaurant with dining tables and comprehensive menu',
        features: [
          `${RESTAURANT_DEMO_DATA.categories.length} menu categories`,
          `${RESTAURANT_DEMO_DATA.products.length} menu items`,
          `${RESTAURANT_DEMO_DATA.tables.length} dining tables`,
          'Table management system',
          'Kitchen workflow integration',
          'Dine-in, takeout, and delivery orders',
          'Historical order data available'
        ]
      }
    };
  }
}