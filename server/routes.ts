import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all products
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  // Get all orders
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

  // Create new order
  app.post("/api/orders", async (req, res) => {
    try {
      console.log('Received order data:', req.body); // Add logging

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
      console.error('Order validation error:', error); // Add logging
      res.status(400).json({ error: "Invalid order data", details: error });
    }
  });

  // Get order details
  app.get("/api/orders/:id", async (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = await storage.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const items = await storage.getOrderItems(orderId);
    res.json({ order, items });
  });

  const httpServer = createServer(app);
  return httpServer;
}