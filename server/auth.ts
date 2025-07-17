import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sessionMiddleware } from "./session";

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Export hashPassword for use in index.ts (e.g., creating default admin)
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid stored password format");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    // Ensure buffers have the same length before comparing
    if (hashedBuf.length !== suppliedBuf.length) {
      // Use timingSafeEqual with dummy buffer to prevent timing attacks
      const dummyBuf = Buffer.alloc(hashedBuf.length);
      timingSafeEqual(hashedBuf, dummyBuf);
      return false;
    }
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false; // Treat errors as password mismatch
  }
}

// Export setupAuth for use in index.ts
export function setupAuth(app: Express): void {
  

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session()); // This uses serialize/deserialize

  // Add session debugging middleware only for API routes (useful for development)
  // Session debug middleware in development (only when DEBUG_SESSION is enabled)
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_SESSION === 'true') {
    app.use('/api', (req, res, next) => {
      console.log(`--- Session Debug (${req.method} ${req.path}) ---`);
      console.log('Session ID:', req.sessionID);
      console.log('Session data:', req.session);
      console.log('Is authenticated:', req.isAuthenticated());
      if (req.isAuthenticated()) {
        console.log('User in session (req.user):', req.user);
      } else {
         console.log('No user in session.');
      }
      console.log('Cookies:', req.headers.cookie);
      console.log('---------------------');
      next();
    });
  }

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log(`LocalStrategy: Attempting auth for user '${username}'`);
      try {
        if (!username || !password) {
          console.log("LocalStrategy: Missing username or password");
          return done(null, false, { message: "Username and password are required" });
        }

        // storage.getUserByUsername now returns the full user object with shopIds
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`LocalStrategy: User '${username}' not found`);
          return done(null, false, { message: "Invalid username or password" });
        }

        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          console.log(`LocalStrategy: Invalid password for user '${username}'`);
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log(`LocalStrategy: User '${username}' authenticated successfully${user.isAdmin ? ' as admin' : ''}`);
        // Pass the full user object fetched from storage to serializeUser via done callback
        return done(null, user);
      } catch (error) {
        console.error('LocalStrategy: Authentication error:', error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => {
    // Store only the user ID in the session
    console.log(`SerializeUser: Storing user ID ${user.id} in session. User object:`, user);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    // Fetch the full user object from storage using the ID from the session
    console.log(`DeserializeUser: Fetching user for ID ${id}`);
    try {
      const user = await storage.getUser(id); // getUser fetches full details including shopIds
      if (!user) {
        console.log(`DeserializeUser: User with ID ${id} not found. Treating as not authenticated.`);
        return done(null, false); // Return false instead of error to indicate "not authenticated"
      }
      console.log(`DeserializeUser: User ${user.username} found, attaching to req.user. User object:`, user);
      // Attach the full user object to req.user for subsequent middleware/routes
      done(null, user);
    } catch (error) {
      console.error('DeserializeUser: Error fetching user:', error);
      done(null, false); // Return false instead of error to prevent authentication errors
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("POST /api/login: Attempting login...");
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Demo mode bypass for testing
    if (process.env.DEMO_MODE === 'true') {
      console.log('POST /api/login: Demo mode active, creating demo session.');
      const demoUser = {
        id: 1,
        username: "admin",
        isAdmin: true,
        shopIds: [1],
      };
      
      // Establish session for demo user
      req.login(demoUser as any, (loginErr) => {
        if (loginErr) {
          console.error("POST /api/login: Demo mode session error:", loginErr);
          return res.status(500).json({ error: "Failed to create demo session" });
        }
        console.log('POST /api/login: Demo session established successfully.');
        return res.json(demoUser);
      });
      return;
    }

    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) {
        console.error("POST /api/login: Passport authentication error:", err);
        return res.status(500).json({ error: "An error occurred during login" });
      }
      if (!user) {
        console.log("POST /api/login: Authentication failed:", info?.message || "Invalid credentials");
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }

      // User is authenticated by LocalStrategy, now establish the session
      req.login(user, (loginErr) => { // req.login triggers serializeUser
        if (loginErr) {
          console.error("POST /api/login: req.login error (session establishment):", loginErr);
          return res.status(500).json({ error: "Failed to create login session" });
        }
        console.log(`POST /api/login: Session established for user '${user.username}'. Sending user data.`);
        // After req.login, the session is established.
        // We return the user object that was passed to req.login.
        // This object should already contain isAdmin and shopIds from the LocalStrategy's done callback.
        return res.json({
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
          shopIds: user.shopIds || []
        });
      });
    })(req, res, next); // Don't forget to call the middleware returned by passport.authenticate
  });

  // Wrap async route handlers to ensure proper error handling
  const asyncHandler = (fn: (req: any, res: any, next: any) => Promise<any>) => {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  app.post("/api/register", asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await hashPassword(password);
    // Create user (storage.createUser handles default shop assignment if needed)
    const newUser = await storage.createUser({
      username: username,
      password: hashedPassword,
      isAdmin: false, // Explicitly set new users as non-admin
    } as any);

    // Log in the newly registered user
    req.login(newUser, (err: Error | null) => { // req.login triggers serializeUser
      if (err) {
        console.error("POST /api/register: req.login error:", err);
        return res.status(500).json({ error: "Login failed after registration" });
      }
      console.log(`POST /api/register: Registration successful, session created for user '${newUser.username}'.`);
      // After req.login, the session is established. req.user is populated by deserializeUser on *subsequent* requests.
      // For the immediate response, return the data from the user object we just created and logged in.
      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        isAdmin: newUser.isAdmin,
        shopIds: newUser.shopIds || [] // Include shopIds from the created user object
      });
    });
  }));

  app.post("/api/logout", (req, res) => {
    const username = req.user?.username;
    console.log(`POST /api/logout: Attempting logout for user '${username || 'unknown'}'`);
    req.logout((err: Error | null) => {
      if (err) {
        console.error("POST /api/logout: req.logout error:", err);
        // Still attempt to destroy session even if logout fails
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("POST /api/logout: Session destruction error:", destroyErr);
          // Respond even if session destruction fails
          res.clearCookie('pos_session_id', { path: '/' }); // Use the specific cookie name
          return res.status(500).json({ error: "Logout partially failed (session not destroyed)" });
        }
        res.clearCookie('pos_session_id', { path: '/' }); // Clear the session cookie
        console.log(`POST /api/logout: User '${username || 'unknown'}' logged out, session destroyed.`);
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // Temporary endpoint to reset admin password for development
  app.post("/api/reset-admin-password", async (req, res) => {
    try {
      console.log("🔄 Resetting admin password for development...");
      
      // Get the admin user
      const adminUser = await storage.getUserByUsername("admin");
      if (!adminUser) {
        return res.status(404).json({ error: "Admin user not found" });
      }
      
      // Hash the new password
      const newPassword = await hashPassword("admin123");
      
      // Update the password
      await storage.updateUserPassword(adminUser.id, newPassword);
      
      console.log("✅ Admin password reset to 'admin123'");
      res.json({ message: "Admin password reset successfully" });
      
    } catch (error) {
      console.error("❌ Error resetting admin password:", error);
      res.status(500).json({ error: "Failed to reset admin password" });
    }
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user: Checking authentication status.");
    
    // Demo mode bypass for testing
    if (process.env.DEMO_MODE === 'true') {
      console.log('GET /api/user: Demo mode active, returning demo user.');
      return res.json({
        id: 1,
        username: "admin",
        isAdmin: true,
        shopIds: [1],
      });
    }
    
    if (!req.isAuthenticated() || !req.user) {
      console.log('GET /api/user: Not authenticated.');
      return res.status(401).json({ error: "Not authenticated" });
    }
    // req.user is populated by deserializeUser and should have the full user object
    console.log(`GET /api/user: Authenticated user '${req.user.username}' found.`);
    res.json({
      id: req.user.id,
      username: req.user.username,
      isAdmin: req.user.isAdmin,
      shopIds: req.user.shopIds || [],
    });
  });

  // Add endpoint for changing password
  app.post("/api/change-password", asyncHandler(async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Fetch user directly from storage for password comparison
    const storedUser = await storage.getUser(req.user.id);
    if (!storedUser) {
      return res.status(404).json({ error: "User not found in storage" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }

        const isValidPassword = await comparePasswords(currentPassword, storedUser.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    try {
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(storedUser.id, hashedPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update password' });
    }
  }));

  // Add endpoint for creating new users (admin only)
  app.post("/api/users", asyncHandler(async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Only administrators can create new users" });
    }

    const { username, password, shopIds } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await hashPassword(password);
    // Pass shopIds if provided
    const newUser = await storage.createUser({
      username: username,
      password: hashedPassword,
      isAdmin: false, // New users created by admins are not admins themselves
      shopIds: Array.isArray(shopIds) ? shopIds : undefined
    } as any);

    // Return the newly created user details (including assigned shops)
    const createdUserWithShops = await storage.getUser(newUser.id);
    if (!createdUserWithShops) {
       console.error(`Failed to retrieve newly created user ${newUser.id}`);
       return res.status(500).json({ error: "Failed to retrieve created user details" });
    }
    return res.status(201).json(createdUserWithShops);
  }));

  // User preferences endpoints
  app.get("/api/user/preferences", asyncHandler(async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const preferences = await storage.getUserPreferences(req.user.id);
      if (!preferences) {
        return res.status(404).json({ error: "User preferences not found" });
      }
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  }));

  app.patch("/api/user/preferences", asyncHandler(async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { language, currency } = req.body;
    
    if (!language && !currency) {
      return res.status(400).json({ error: "Language or currency is required" });
    }

    try {
      const updates: { language?: string; currency?: string } = {};
      if (language) updates.language = language;
      if (currency) updates.currency = currency;

      await storage.updateUserPreferences(req.user.id, updates);
      res.json({ message: "Preferences updated successfully" });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update preferences' });
    }
  }));
}