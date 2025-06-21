import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

console.log('🔄 Initializing database connection...');

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('✅ DATABASE_URL is set');

// Create pool with better error handling and configuration for production
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout
  statement_timeout: 10000,
  query_timeout: 10000,
  // SSL configuration - disable for internal Docker connections
  ssl: false,
});

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('💥 Unexpected error on idle client:', err);
  process.exit(-1);
});

pool.on('connect', (client) => {
  console.log('🔗 Connected to database');
});

console.log('🔧 Creating Drizzle database client...');

// Create the database client with correct syntax
export const db = drizzle(pool, { schema });
console.log('✅ Drizzle database client created successfully');
