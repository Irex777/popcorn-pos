#!/usr/bin/env node

/**
 * Quick Database Connection Tester
 * 
 * This script helps you test different database connection options
 * to find the correct hostname for your Coolify PostgreSQL service.
 */

const { Client } = require('pg');

const connectionOptions = [
    {
        name: "Current (failing)",
        url: "postgresql://popcorn_user:PoPcorn@234@cmz5fjtvxu000qp3qr3jvp52rvi:5432/popcorn_pos"
    },
    {
        name: "Option 1 - postgres hostname",
        url: "postgresql://popcorn_user:PoPcorn@234@postgres:5432/popcorn_pos"
    },
    {
        name: "Option 2 - postgresql hostname",
        url: "postgresql://popcorn_user:PoPcorn@234@postgresql:5432/popcorn_pos"
    },
    {
        name: "Option 3 - localhost",
        url: "postgresql://popcorn_user:PoPcorn@234@localhost:5432/popcorn_pos"
    },
    {
        name: "Option 4 - 127.0.0.1",
        url: "postgresql://popcorn_user:PoPcorn@234@127.0.0.1:5432/popcorn_pos"
    }
];

async function testConnection(option) {
    console.log(`\n🔍 Testing: ${option.name}`);
    console.log(`   URL: ${option.url.replace(/:[^:]*@/, ':****@')}`);
    
    const client = new Client({
        connectionString: option.url,
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log(`   ✅ SUCCESS - Connection established!`);
        
        const result = await client.query('SELECT NOW()');
        console.log(`   📅 Database time: ${result.rows[0].now}`);
        
        await client.end();
        return true;
    } catch (error) {
        console.log(`   ❌ FAILED - ${error.code}: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Popcorn POS Database Connection Tester');
    console.log('==========================================');
    console.log('\nTesting different database connection options...\n');

    let successCount = 0;
    
    for (const option of connectionOptions) {
        const success = await testConnection(option);
        if (success) {
            successCount++;
            console.log(`\n🎉 FOUND WORKING CONNECTION: ${option.name}`);
            console.log(`   Use this DATABASE_URL in Coolify:`);
            console.log(`   ${option.url}`);
        }
    }

    console.log('\n==========================================');
    if (successCount === 0) {
        console.log('❌ No working connections found.');
        console.log('\n💡 Next steps:');
        console.log('   1. Check if PostgreSQL service is running in Coolify');
        console.log('   2. Verify the database credentials');
        console.log('   3. Check the actual hostname/service name in Coolify');
    } else {
        console.log(`✅ Found ${successCount} working connection(s)!`);
        console.log('\n💡 Update your DATABASE_URL environment variable in Coolify');
        console.log('   and restart your application.');
    }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    console.error('\n💥 Unhandled error:', error.message);
    process.exit(1);
});

if (require.main === module) {
    main().catch(console.error);
}
