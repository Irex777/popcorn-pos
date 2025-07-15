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
    businessMode: z.enum(["shop", "restaurant"]).default("shop"),
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
});

// Add shopId to orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
});

// OrderItems 
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
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
  });

export const insertOrderSchema = createInsertSchema(orders)
  .omit({ id: true, createdAt: true });

export const insertOrderItemSchema = createInsertSchema(orderItems)
  .omit({ id: true, orderId: true });

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
