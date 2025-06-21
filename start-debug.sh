#!/bin/bash

echo "=== CONTAINER STARTUP DEBUG ==="
echo "Timestamp: $(date)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Working directory: $(pwd)"
echo "Files in /app:"
ls -la /app/ || echo "Cannot list /app"
echo "Files in /app/dist:"
ls -la /app/dist/ || echo "Cannot list /app/dist"
echo "Environment variables:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: ${DATABASE_URL:+SET}"
echo "SESSION_SECRET: ${SESSION_SECRET:+SET}"
echo "PUBLIC_URL: $PUBLIC_URL"
echo "=== STARTING APPLICATION ==="

# Start the application
exec node dist/index.js
