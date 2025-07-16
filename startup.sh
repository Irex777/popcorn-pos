#!/bin/sh

# Production startup script
# This script runs before the main application starts

echo "Starting Popcorn POS in production mode..."

# Check if database connection is available
echo "Checking database connection..."

# Run database migrations if they exist
if [ -d "migrations" ]; then
    echo "Running database migrations..."
    npm run db:push || echo "Migration failed or not configured"
    
    # Run hotfix migration for business_mode column
    echo "Running hotfix migration for business_mode column..."
    npm run migrate:hotfix || echo "Hotfix migration failed or already applied"
fi

echo "Starting application..."
exec npm start
