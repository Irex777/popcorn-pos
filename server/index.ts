import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { setupAuth } from "./auth";
import { setupWebSocket, startAnalyticsUpdates } from "./websocket";

const app = express();

// Disable express default error handling HTML pages
app.set('env', process.env.NODE_ENV || 'development');

// Configure CORS before any middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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

// Update createDefaultAdmin function
async function createDefaultAdmin() {
  try {
    log("Starting default admin creation check...");
    const users = await storage.getAllUsers();
    if (users.length === 0) {
      const defaultAdmin = {
        username: "admin",
        password: await hashPassword("admin123"),
        isAdmin: true, // Make the default user an admin
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

  // API 404 handler - only for /api routes
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Global error handler - ensure JSON responses
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ error: message });
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

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  
  let wsInitialized = false;
  
  const startServer = (attempt: number = 0) => {
    const currentPort = port + attempt;
    server.listen(currentPort).on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        if (attempt < 10) {
          log(`Port ${currentPort} is already in use, trying port ${currentPort + 1}`);
          startServer(attempt + 1);
        } else {
          console.error('Failed to find an available port after 10 attempts');
        }
      } else {
        console.error('Server error:', err);
      }
    }).on('listening', () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : currentPort;
      log(`Server listening on port ${actualPort}`);
      
      try {
        if (wsInitialized) {
          return;
        }
        wsInitialized = true;
        setupWebSocket(server);
        // Start analytics updates
        startAnalyticsUpdates();
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    });
  };
  
  startServer();
})();
