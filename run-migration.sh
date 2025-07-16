#!/bin/bash
# Quick migration script to run the business_mode hotfix

echo "Running business_mode migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Run the migration
psql "$DATABASE_URL" -f migrations/HOTFIX_004_add_business_mode_production.sql

echo "Migration completed!"