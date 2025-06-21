#!/bin/bash

echo "🚀 Testing Popcorn POS Docker Compose Setup"
echo "==========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Validate docker-compose.yml
echo "📋 Validating docker-compose.yml..."
if docker-compose config > /dev/null 2>&1; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "❌ Docker Compose configuration has errors"
    docker-compose config
    exit 1
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test database connection
echo "🔌 Testing database connection..."
if docker-compose exec -T postgres pg_isready -U popcorn_user -d popcorn_pos > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

# Test application health
echo "🏥 Testing application health..."
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "✅ Application is responding"
    
    # Test debug endpoint
    echo "🐛 Testing debug endpoint..."
    curl -s http://localhost:3002/api/debug | jq '.database.status // "unknown"' 2>/dev/null || echo "Debug endpoint response received"
else
    echo "❌ Application is not responding"
fi

echo ""
echo "🎯 Test Results:"
echo "- Application: http://localhost:3002"
echo "- Debug endpoint: http://localhost:3002/api/debug"
echo "- Database: localhost:5432"
echo ""
echo "📊 View logs with: docker-compose logs -f"
echo "🛑 Stop services with: docker-compose down"
echo "🗑️  Clean up with: docker-compose down -v"
