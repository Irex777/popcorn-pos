import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas with proper validation
export const insertUserSchema = createInsertSchema(users)
  .extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .omit({ id: true, createdAt: true });

// Export user types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Keep existing models
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#94A3B8"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  imageUrl: text("image_url").notNull().default(''),
  stock: integer("stock").notNull().default(0),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// Keep existing schemas
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true })
  .extend({
    name: z.string().min(1, "Name is required"),
    price: z.string().or(z.number()).transform(val => Number(val).toFixed(2)),
    categoryId: z.number().int().positive("Category is required"),
    imageUrl: z.string().default(''),
    stock: z.number().int().min(0, "Stock cannot be negative"),
  });

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true, orderId: true });

// Export existing types
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