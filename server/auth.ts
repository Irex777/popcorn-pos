import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: storage.sessionStore
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Wrap async route handlers to ensure proper error handling
  const asyncHandler = (fn: (req: any, res: any, next: any) => Promise<any>) => {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Login failed" });
        }
        return res.json({ id: user.id, username: user.username });
      });
    })(req, res, next);
  });

  app.post("/api/register", asyncHandler(async (req, res) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await hashPassword(req.body.password);
    const user = await storage.createUser({
      username: req.body.username,
      password: hashedPassword,
    });

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed after registration" });
      }
      return res.status(201).json({ id: user.id, username: user.username });
    });
  }));

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({
      id: req.user.id,
      username: req.user.username,
      isAdmin: req.user.isAdmin,
    });
  });

  app.post("/api/change-password", asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { currentPassword, newPassword } = req.body;

    const isValidPassword = await comparePasswords(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUserPassword(user.id, hashedPassword);

    res.json({ message: "Password updated successfully" });
  }));

  // Add endpoint for creating new users (admin only)
  app.post("/api/users", asyncHandler(async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Only administrators can create new users" });
    }

    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await hashPassword(req.body.password);
    const user = await storage.createUser({
      username: req.body.username,
      password: hashedPassword,
      isAdmin: false, // New users created by admins are not admins themselves
    });

    return res.status(201).json({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    });
  }));

  // Add endpoint for listing users (admin only)
  app.get("/api/users", asyncHandler(async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Only administrators can view user list" });
    }

    const users = await storage.getAllUsers();
    return res.json(users.map(user => ({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    })));
  }));

  // Add endpoint for updating users (admin only)
  app.patch("/api/users/:id", asyncHandler(async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Only administrators can modify users" });
    }

    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates: { username?: string; password?: string } = {};

    if (req.body.username) {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "Username already exists" });
      }
      updates.username = req.body.username;
    }

    if (req.body.password) {
      updates.password = await hashPassword(req.body.password);
    }

    const updatedUser = await storage.updateUser(userId, updates);
    return res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      isAdmin: updatedUser.isAdmin,
    });
  }));
}