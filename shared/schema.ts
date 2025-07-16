import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Shops model
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  businessMode: text("business_mode").notNull().default("shop"), // "shop" or "restaurant"
  createdAt: timestamp("created_at").defaultNow(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
});

// Stripe settings
export const stripeSettings = pgTable("stripe_settings", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id).notNull().unique(),
  publishableKey: text("publishable_key"),
  secretKey: text("secret_key"),
  enabled: boolean("enabled").notNull().default(false),
});

export const insertStripeSettingsSchema = createInsertSchema(stripeSettings)
  .omit({ id: true })
  .extend({
    publishableKey: z.string().optional(),
    secretKey: z.string().optional(),
  });

export type StripeSettings = typeof stripeSettings.$inferSelect;
export type InsertStripeSettings = z.infer<typeof insertStripeSettingsSchema>;

export const insertShopSchema = createInsertSchema(shops)
  .extend({
    name: z.string().min(1, "Shop name is required"),
    address: z.string().nullable(),
    // HOTFIX: Make businessMode optional until database migration is applied
    businessMode: z.enum(["shop", "restaurant"]).optional().default("shop"),
  })
  .omit({ id: true, createdAt: true });

// User model and schema
// User-Shop relations
export const userShops = pgTable("user_shops", {
  userId: integer("user_id").references(() => users.id).notNull(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  language: text("language").notNull().default('cs'),
  currency: text("currency").notNull().default('CZK'),
  createdAt: timestamp("created_at").defaultNow(),
  // Restaurant-specific fields
  roleId: integer("role_id").references(() => staffRoles.id),
  isActive: boolean("is_active").notNull().default(true),
});

// Add types for user shops
export type UserShop = typeof userShops.$inferSelect;
export type InsertUserShop = typeof userShops.$inferInsert;

export const insertUserSchema = createInsertSchema(users)
  .extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .omit({ id: true, createdAt: true, isAdmin: true });

// User preferences schema
export const userPreferencesSchema = z.object({
  language: z.string().min(1, "Language is required"),
  currency: z.string().min(1, "Currency is required"),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// Export user types with shopIds
export type User = typeof users.$inferSelect & { shopIds?: number[] };
export type InsertUser = z.infer<typeof insertUserSchema>;

// Add shopId to categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#94A3B8"),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
});

// Add shopId to products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  imageUrl: text("image_url").notNull().default(''),
  stock: integer("stock").notNull().default(0),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  requiresKitchen: boolean("requires_kitchen").notNull().default(false),
});

// Add shopId to orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  // Restaurant-specific fields
  tableId: integer("table_id").references(() => tables.id),
  serverId: integer("server_id").references(() => users.id),
  orderType: text("order_type").notNull().default("dine_in"), // 'dine_in', 'takeout', 'delivery'
  guestCount: integer("guest_count").notNull().default(1),
  specialInstructions: text("special_instructions"),
  courseTiming: text("course_timing"), // JSON for course timing
  paymentMethod: text("payment_method"), // 'cash', 'card', 'online'
  completedAt: timestamp("completed_at")
});

// OrderItems 
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  // Restaurant-specific fields
  status: text("status").notNull().default("pending"), // 'pending', 'preparing', 'ready', 'served'
  courseNumber: integer("course_number").notNull().default(1),
  specialRequests: text("special_requests"),
  preparationTime: integer("preparation_time"), // estimated minutes
});

// Update schemas
export const insertCategorySchema = createInsertSchema(categories)
  .omit({ id: true });

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true })
  .extend({
    name: z.string().min(1, "Name is required"),
    price: z.string().or(z.number()).transform(val => Number(val).toFixed(2)),
    categoryId: z.number().int().positive("Category is required"),
    imageUrl: z.string().default(''),
    stock: z.number().int().min(0, "Stock cannot be negative"),
    requiresKitchen: z.boolean().default(false),
  });

export const insertOrderSchema = createInsertSchema(orders)
  .omit({ id: true, createdAt: true })
  .extend({
    orderType: z.enum(["dine_in", "takeout", "delivery"]).default("dine_in"),
    guestCount: z.number().int().min(1).default(1),
    tableId: z.number().int().optional(),
    serverId: z.number().int().optional(),
    specialInstructions: z.string().optional(),
    courseTiming: z.string().optional(),
  });

export const insertOrderItemSchema = createInsertSchema(orderItems)
  .omit({ id: true, orderId: true })
  .extend({
    status: z.enum(["pending", "preparing", "ready", "served"]).default("pending"),
    courseNumber: z.number().int().min(1).default(1),
    specialRequests: z.string().optional(),
    preparationTime: z.number().int().optional(),
  });

// Export types
export type Shop = typeof shops.$inferSelect;
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export const updateProductStockSchema = z.object({
  stock: z.number().min(0, "Stock cannot be negative"),
});

export type UpdateProductStock = z.infer<typeof updateProductStockSchema>;

// Restaurant Tables
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: text("number").notNull(),
  capacity: integer("capacity").notNull(),
  section: text("section"),
  status: text("status").notNull().default("available"), // 'available', 'occupied', 'reserved', 'cleaning'
  xPosition: integer("x_position"),
  yPosition: integer("y_position"),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reservations
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  partySize: integer("party_size").notNull(),
  reservationTime: timestamp("reservation_time").notNull(),
  status: text("status").notNull().default("confirmed"), // 'confirmed', 'seated', 'cancelled', 'no_show'
  tableId: integer("table_id").references(() => tables.id),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Kitchen Tickets
export const kitchenTickets = pgTable("kitchen_tickets", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  ticketNumber: text("ticket_number").notNull(),
  status: text("status").notNull().default("new"), // 'new', 'preparing', 'ready', 'served'
  priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  estimatedCompletion: timestamp("estimated_completion"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Staff Roles
export const staffRoles = pgTable("staff_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'host', 'server', 'kitchen', 'manager', 'cashier'
  permissions: text("permissions").notNull(), // JSON array of permissions
  shopId: integer("shop_id").references(() => shops.id).notNull(),
});

// Restaurant table schemas
export const insertTableSchema = createInsertSchema(tables)
  .omit({ id: true, createdAt: true })
  .extend({
    number: z.string().min(1, "Table number is required"),
    capacity: z.number().int().min(1, "Capacity must be at least 1"),
    status: z.enum(["available", "occupied", "reserved", "cleaning"]).default("available"),
    section: z.string().optional(),
    xPosition: z.number().int().optional(),
    yPosition: z.number().int().optional(),
  });

export const insertReservationSchema = createInsertSchema(reservations)
  .omit({ id: true, createdAt: true })
  .extend({
    customerName: z.string().min(1, "Customer name is required"),
    customerPhone: z.string().optional(),
    partySize: z.number().int().min(1, "Party size must be at least 1"),
    reservationTime: z.date(),
    status: z.enum(["confirmed", "seated", "cancelled", "no_show"]).default("confirmed"),
    tableId: z.number().int().optional(),
  });

export const insertKitchenTicketSchema = createInsertSchema(kitchenTickets)
  .omit({ id: true, createdAt: true, completedAt: true })
  .extend({
    ticketNumber: z.string().min(1, "Ticket number is required"),
    status: z.enum(["new", "preparing", "ready", "served"]).default("new"),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    estimatedCompletion: z.date().optional(),
  });

export const insertStaffRoleSchema = createInsertSchema(staffRoles)
  .omit({ id: true })
  .extend({
    name: z.string().min(1, "Role name is required"),
    permissions: z.string().min(1, "Permissions are required"),
  });

// Export restaurant types
export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type KitchenTicket = typeof kitchenTickets.$inferSelect;
export type InsertKitchenTicket = z.infer<typeof insertKitchenTicketSchema>;
export type StaffRole = typeof staffRoles.$inferSelect;
export type InsertStaffRole = z.infer<typeof insertStaffRoleSchema>;
