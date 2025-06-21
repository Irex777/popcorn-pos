#!/usr/bin/env node

// Test database connection script
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://popcorn_user:PoPcorn@234@cmz5fjtvxu000qp3qr3jvp52rvi:5432/popcorn_pos';

console.log('🔍 Testing database connection...');
console.log('Database URL format:', DATABASE_URL.replace(/:[^:]*@/, ':****@'));

const client = new Client({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
});

async function testConnection() {
  try {
    console.log('📡 Attempting to connect...');
    await client.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('🕐 Database time:', result.rows[0].current_time);
    
    // Test if users table exists
    try {
      const usersResult = await client.query('SELECT COUNT(*) FROM users');
      console.log('👥 Users table exists with', usersResult.rows[0].count, 'users');
    } catch (error) {
      console.log('⚠️ Users table does not exist or is not accessible');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    try {
      await client.end();
      console.log('🔌 Connection closed');
    } catch (error) {
      console.log('Warning: Error closing connection:', error.message);
    }
  }
}

testConnection();
