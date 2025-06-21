#!/usr/bin/env node

console.log('🚀 Starting PostgreSQL connection test...');

const { Client } = require('pg');

const connectionString = 'postgresql://popcorn_user:PoPcorn@234@cmz5fjtvxu000qp3qr3jvp52rvi:5432/popcorn_pos';

console.log('📡 Testing connection to:', connectionString.replace(/:[^:]*@/, ':****@'));

const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
});

console.log('⏳ Attempting connection...');

client.connect()
    .then(() => {
        console.log('✅ SUCCESS - Connected!');
        return client.query('SELECT NOW()');
    })
    .then((result) => {
        console.log('📅 Database time:', result.rows[0].now);
        return client.end();
    })
    .then(() => {
        console.log('🎉 Connection test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.log('❌ FAILED:', error.code, error.message);
        console.log('Full error:', error);
        process.exit(1);
    });

// Safety timeout
setTimeout(() => {
    console.log('⏱️  Test timed out after 10 seconds');
    process.exit(1);
}, 10000);
