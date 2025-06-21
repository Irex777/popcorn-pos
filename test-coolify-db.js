#!/usr/bin/env node

/**
 * Test Coolify PostgreSQL Connection
 * Based on the exact settings from your Coolify dashboard
 */

const { Client } = require('pg');

// Exact connection details from your Coolify dashboard
const connectionConfig = {
    host: 'cmz5fjtvxu000qp3qr3jvp52rvi',
    port: 5432,
    database: 'popcorn_pos',
    user: 'popcorn_user',
    password: 'PoPcorn@234',
    connectionTimeoutMillis: 10000,
};

const connectionString = `postgresql://popcorn_user:PoPcorn@234@cmz5fjtvxu000qp3qr3jvp52rvi:5432/popcorn_pos`;

console.log('🔍 Testing Coolify PostgreSQL Connection');
console.log('=========================================');
console.log(`Host: ${connectionConfig.host}`);
console.log(`Port: ${connectionConfig.port}`);
console.log(`Database: ${connectionConfig.database}`);
console.log(`User: ${connectionConfig.user}`);
console.log(`Password: ${'*'.repeat(connectionConfig.password.length)}`);
console.log('');

async function testConnection() {
    console.log('📡 Testing connection...');
    
    const client = new Client(connectionConfig);

    try {
        console.log('⏳ Attempting to connect...');
        await client.connect();
        console.log('✅ SUCCESS - Connected to PostgreSQL!');
        
        // Test basic query
        const result = await client.query('SELECT NOW(), version()');
        console.log(`📅 Database time: ${result.rows[0].now}`);
        console.log(`🐘 PostgreSQL version: ${result.rows[0].version.split(',')[0]}`);
        
        // Test if our database exists and has tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log(`📋 Tables in database (${tablesResult.rows.length}):`);
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
        await client.end();
        
        console.log('\n🎉 Database connection is working perfectly!');
        console.log('💡 Your DATABASE_URL should be:');
        console.log(`   ${connectionString}`);
        
        return true;
        
    } catch (error) {
        console.log(`❌ FAILED - ${error.code}: ${error.message}`);
        
        if (error.code === 'EAI_AGAIN') {
            console.log('\n🔧 DNS Resolution Error Solutions:');
            console.log('   1. The PostgreSQL service might not be running');
            console.log('   2. The hostname might have changed');
            console.log('   3. Network connectivity issue');
            console.log('\n💡 Check in Coolify:');
            console.log('   - Is the PostgreSQL service running (green status)?');
            console.log('   - Has the hostname changed?');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n🔧 Connection Refused Solutions:');
            console.log('   - PostgreSQL service is not running');
            console.log('   - Port 5432 is not accessible');
        } else if (error.code === 'ENOTFOUND') {
            console.log('\n🔧 Host Not Found Solutions:');
            console.log('   - Hostname is incorrect');
            console.log('   - DNS resolution failing');
        }
        
        return false;
    }
}

async function main() {
    const success = await testConnection();
    
    if (!success) {
        console.log('\n❌ Connection failed. Next steps:');
        console.log('1. Check PostgreSQL service status in Coolify');
        console.log('2. Verify the hostname hasn\'t changed');
        console.log('3. Restart the PostgreSQL service if needed');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}
