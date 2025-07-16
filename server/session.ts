import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { sql } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

// Database session store for production
class DatabaseSessionStore extends session.Store {
  private tableName = 'sessions';

  constructor() {
    super();
    this.initSessionTable();
  }

  private async initSessionTable() {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS sessions (
          session_id TEXT PRIMARY KEY,
          session_data TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Create index for cleanup
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)
      `);
      
      console.log('✅ Database session store initialized');
    } catch (error) {
      console.error('❌ Error initializing session table:', error);
    }
  }

  async get(sessionId: string, callback: (err?: any, session?: any) => void) {
    try {
      const result = await db.execute(sql`
        SELECT session_data FROM sessions 
        WHERE session_id = ${sessionId} 
        AND expires_at > NOW()
      `);
      
      if (result.rows.length === 0) {
        return callback(null, null);
      }
      
      const sessionData = JSON.parse(result.rows[0].session_data as string);
      callback(null, sessionData);
    } catch (error) {
      callback(error);
    }
  }

  async set(sessionId: string, sessionData: any, callback?: (err?: any) => void) {
    try {
      const expiresAt = new Date(Date.now() + (sessionData.cookie?.maxAge || 24 * 60 * 60 * 1000));
      const dataString = JSON.stringify(sessionData);
      
      await db.execute(sql`
        INSERT INTO sessions (session_id, session_data, expires_at)
        VALUES (${sessionId}, ${dataString}, ${expiresAt})
        ON CONFLICT (session_id) DO UPDATE SET
          session_data = ${dataString},
          expires_at = ${expiresAt}
      `);
      
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  async destroy(sessionId: string, callback?: (err?: any) => void) {
    try {
      await db.execute(sql`
        DELETE FROM sessions WHERE session_id = ${sessionId}
      `);
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  async clear(callback?: (err?: any) => void) {
    try {
      await db.execute(sql`DELETE FROM sessions`);
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  async length(callback: (err?: any, length?: number) => void) {
    try {
      const result = await db.execute(sql`SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()`);
      callback(null, Number(result.rows[0].count));
    } catch (error) {
      callback(error);
    }
  }

  // Cleanup expired sessions
  async cleanup() {
    try {
      const result = await db.execute(sql`
        DELETE FROM sessions WHERE expires_at <= NOW()
      `);
      console.log(`🧹 Cleaned up ${result.rowCount} expired sessions`);
    } catch (error) {
      console.error('❌ Error cleaning up sessions:', error);
    }
  }
}

// Choose store based on environment
const store = process.env.NODE_ENV === 'production' 
  ? new DatabaseSessionStore()
  : new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

// Setup periodic cleanup for database store
if (process.env.NODE_ENV === 'production' && store instanceof DatabaseSessionStore) {
  setInterval(() => {
    store.cleanup();
  }, 60 * 60 * 1000); // Clean up every hour
}

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

