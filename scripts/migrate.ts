import { config } from 'dotenv';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    // Read the migration SQL file
    const sql = fs.readFileSync(
      join(__dirname, '../migrations/003_add_user_shops.sql'),
      'utf8'
    );

    // Begin transaction
    await pool.query('BEGIN');

    try {
      // Execute migration
      await pool.query(sql);
      
      // If successful, commit
      await pool.query('COMMIT');
      console.log('✅ Migration completed successfully');
    } catch (error) {
      // If error, rollback
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();
