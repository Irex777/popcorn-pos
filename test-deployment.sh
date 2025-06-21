#!/bin/bash

echo "🧪 Testing Popcorn POS Deployment"
echo "================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Application URL
URL="https://pos.airwrk.org"

echo "📍 Testing URL: $URL"
echo

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
HEALTH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$URL/api/health")
HEALTH_BODY=$(echo $HEALTH_RESPONSE | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
HEALTH_STATUS=$(echo $HEALTH_RESPONSE | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "Response: $HEALTH_BODY"
else
    echo -e "${RED}❌ Health check failed (Status: $HEALTH_STATUS)${NC}"
    echo "Response: $HEALTH_BODY"
fi
echo

# Test 2: Debug Endpoint
echo "2️⃣ Testing Debug Endpoint..."
DEBUG_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$URL/api/debug")
DEBUG_BODY=$(echo $DEBUG_RESPONSE | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
DEBUG_STATUS=$(echo $DEBUG_RESPONSE | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$DEBUG_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Debug endpoint accessible${NC}"
    echo "Response: $DEBUG_BODY" | jq . 2>/dev/null || echo "Response: $DEBUG_BODY"
else
    echo -e "${RED}❌ Debug endpoint failed (Status: $DEBUG_STATUS)${NC}"
    echo "Response: $DEBUG_BODY"
fi
echo

# Test 3: Main Application
echo "3️⃣ Testing Main Application..."
MAIN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$URL")
MAIN_STATUS=$(echo $MAIN_RESPONSE | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$MAIN_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Main application accessible${NC}"
else
    echo -e "${RED}❌ Main application failed (Status: $MAIN_STATUS)${NC}"
fi
echo

# Test 4: API User endpoint (should return 401 if not authenticated)
echo "4️⃣ Testing API User Endpoint..."
USER_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$URL/api/user")
USER_STATUS=$(echo $USER_RESPONSE | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$USER_STATUS" -eq 401 ]; then
    echo -e "${GREEN}✅ API user endpoint working (returns 401 as expected)${NC}"
elif [ "$USER_STATUS" -eq 200 ]; then
    echo -e "${YELLOW}⚠️ API user endpoint returns 200 (user might be logged in)${NC}"
else
    echo -e "${RED}❌ API user endpoint failed (Status: $USER_STATUS)${NC}"
fi
echo

echo "🏁 Test Results Summary:"
if [ "$HEALTH_STATUS" -eq 200 ] && [ "$DEBUG_STATUS" -eq 200 ] && [ "$MAIN_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Application appears to be working correctly!${NC}"
    echo
    echo "🔗 You can now access the application at: $URL"
    echo "👤 Default login: admin / admin123"
else
    echo -e "${RED}❌ Some tests failed. Check the logs above for details.${NC}"
fi
