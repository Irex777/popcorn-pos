// Catch all uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { setupAuth } from "./auth";
import { runStartupMigrations } from "./migrations";

import { sessionMiddleware } from "./session";
import { getAppConfig, findAvailablePort, validatePort } from "@shared/config";
import { portAnnouncer } from "./port-announcer";

// Get configuration
const config = getAppConfig();

// Add startup logging
console.log('🚀 Starting Popcorn POS server...');
console.log('📋 Environment check:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - PORT:', config.ports.server);
console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  - SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Missing');
console.log('  - BASE_URL:', config.baseUrl);
console.log('  - API_URL:', config.apiUrl);

// Write startup info to file for debugging
import { writeFileSync } from 'fs';
try {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'MISSING',
      PUBLIC_URL: process.env.PUBLIC_URL
    }
  };
  writeFileSync('/tmp/startup-debug.json', JSON.stringify(debugInfo, null, 2));
  console.log('📄 Debug info written to /tmp/startup-debug.json');
} catch (e) {
  console.log('Failed to write debug file:', e instanceof Error ? e.message : String(e));
}

const app = express();

// Trust first proxy
app.set('trust proxy', 1);

// Disable express default error handling HTML pages
app.set('env', process.env.NODE_ENV || 'development');

// Configure CORS before any middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CLIENT_URL || process.env.PUBLIC_URL || false)
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup session middleware before authentication
app.use(sessionMiddleware);

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
    
    // Initialize database tables first
    console.log('🔄 Initializing database tables...');
    try {
      await storage.initializeDatabase();
      console.log('✅ Database tables initialized successfully');
    } catch (initError) {
      console.error('💥 Database initialization failed:', initError);
      throw new Error(`Database initialization failed: ${initError instanceof Error ? initError.message : String(initError)}`);
    }
    
    // Run startup migrations
    await runStartupMigrations();
    
    // Test database connection
    console.log('🔄 Testing database connection...');
    
    // Try to get users with detailed error handling
    let users;
    try {
      users = await storage.getAllUsers();
      console.log('✅ Database query successful, found', users.length, 'users');
    } catch (dbError) {
      console.error('💥 Database query failed:', dbError);
      console.error('Database error stack:', dbError instanceof Error ? dbError.stack : String(dbError));
      throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }
    
    if (users.length === 0) {
      console.log('🔄 No users found, creating default admin...');
      
      let hashedPassword;
      try {
        hashedPassword = await hashPassword("admin123");
        console.log('✅ Password hashed successfully');
      } catch (hashError) {
        console.error('💥 Password hashing failed:', hashError);
        throw new Error(`Password hashing failed: ${hashError instanceof Error ? hashError.message : String(hashError)}`);
      }
      
      const defaultAdmin = {
        username: "admin",
        password: hashedPassword,
        isAdmin: true,
      };
      
      try {
        await storage.createUser(defaultAdmin);
        console.log("✅ Default admin account created (admin/admin123)");
      } catch (createError) {
        console.error('💥 User creation failed:', createError);
        throw new Error(`User creation failed: ${createError instanceof Error ? createError.message : String(createError)}`);
      }
    } else {
      log("✅ Users already exist, skipping default admin creation");
    }
  } catch (error) {
    console.error("❌ Error creating default admin:", error);
    console.error("Full error stack:", error instanceof Error ? error.stack : String(error));
    throw error; // Re-throw to prevent server from starting with DB issues
  }
}

(async () => {
  try {
    console.log('🔧 Registering routes...');
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

    // Create default admin account before starting server (skip if DB unavailable)
    console.log('👤 Setting up default admin...');
    try {
      await createDefaultAdmin();
    } catch (error) {
      console.error('⚠️ Warning: Could not create default admin, continuing anyway:', error instanceof Error ? error.message : String(error));
      console.log('🚀 Server will start without database initialization');
    }

    console.log('📁 Setting up file serving...');
    if (app.get("env") === "development") {
      log("Starting in development mode with Vite middleware");
      await setupVite(app, server, config.ports.server);
    } else {
      log("Starting in production mode with static file serving");
      serveStatic(app);
    }
  

    let actualPort: number;
    
    try {
      // Try to find an available port starting with the preferred port
      actualPort = await findAvailablePort(config.ports.server, config.ports.fallbackPorts);
      console.log(`🔍 Found available port: ${actualPort}`);
      
      if (actualPort !== config.ports.server) {
        console.log(`⚠️ Preferred port ${config.ports.server} was not available, using ${actualPort}`);
      }
    } catch (error) {
      console.error('❌ Failed to find available port:', error);
      process.exit(1);
    }

    const startServer = () => {
      server.listen(actualPort).on('error', (err: NodeJS.ErrnoException) => {
        console.error('❌ Server error:', err);
        process.exit(1);
      }).on('listening', () => {
        const addr = server.address();
        const listeningPort = typeof addr === 'object' && addr ? addr.port : actualPort;
        
        // Announce the port prominently
        portAnnouncer.announcePort(listeningPort);
        
        log(`Server listening on port ${listeningPort}`);
        

      });
    };
    
    console.log('🚀 Starting server...');
    startServer();
  
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();