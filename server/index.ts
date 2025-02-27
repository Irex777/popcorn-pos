import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { setupAuth } from "./auth";

const app = express();

// Disable express default error handling HTML pages
app.set('env', process.env.NODE_ENV || 'development');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup authentication before registering routes
setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Create default admin account if no users exist
async function createDefaultAdmin() {
  try {
    log("Starting default admin creation check...");
    const users = await storage.getAllUsers();
    if (users.length === 0) {
      const defaultAdmin = {
        username: "admin",
        password: await hashPassword("admin123"),
      };
      await storage.createUser(defaultAdmin);
      log("Default admin account created");
    } else {
      log("Users already exist, skipping default admin creation");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
}

(async () => {
  const server = await registerRoutes(app);

  // Global error handler - ensure JSON responses
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ error: message });
  });

  // API 404 handler - only for /api routes
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Create default admin account before starting server
  await createDefaultAdmin();

  if (app.get("env") === "development") {
    log("Starting in development mode with Vite middleware");
    await setupVite(app, server);
  } else {
    log("Starting in production mode with static file serving");
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();