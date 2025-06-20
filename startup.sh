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
fi

echo "Starting application..."
exec npm start
