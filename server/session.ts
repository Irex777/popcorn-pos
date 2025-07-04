import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

const store = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

export const sessionMiddleware = session({
  name: 'pos_session_id',
  secret: process.env.SESSION_SECRET || 'a-fallback-very-secure-secret-key-32-chars',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site in production only
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  store: store,
  proxy: true
});

