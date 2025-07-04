# Port Management Guide

This document explains how the Popcorn POS application handles port configuration and ensures client-server communication works reliably across different environments.

## Overview

The application uses a centralized port configuration system that:
- Automatically detects available ports
- Provides fallback options when preferred ports are in use
- Ensures client and server are always aware of the correct ports
- Works consistently across development and production environments

## Configuration Files

### 1. Shared Configuration (`shared/config.ts`)
Central configuration that both client and server use:
- Defines default ports (server: 3003, client: 5173)
- Provides fallback port ranges
- Handles environment-specific settings
- Offers client-side port detection

### 2. Environment Variables (`.env`)
```bash
# Server configuration
NODE_ENV=development
PORT=3003                    # Preferred server port
PUBLIC_URL=http://localhost:3003

# Optional port overrides
PREFERRED_PORT=3003
FALLBACK_PORTS=3004,3005,3006,3007
```

### 3. Client API Configuration (`client/src/lib/api.ts`)
- Automatically detects current port in browser
- Constructs correct API URLs
- Provides debugging utilities
- Handles development vs production differences

## Port Detection Logic

### Server-Side
1. Reads preferred port from `PORT` environment variable (default: 3003)
2. Uses `findAvailablePort()` to check if preferred port is available
3. Falls back to predefined ports: [3004, 3005, 3006, 3007, 3008, 3009, 3010]
4. Updates environment variables with actual port used
5. Logs clear information about which port is being used

### Client-Side
1. In development: Uses relative URLs (same port as server via Vite proxy)
2. In production: Detects current browser port and constructs full URLs
3. Provides debugging information via `logPortInfo()`

## Usage

### Starting the Server

#### Option 1: Standard Start
```bash
npm run dev
```
Uses the port specified in `.env` or falls back automatically.

#### Option 2: Smart Start (Recommended)
```bash
npm run dev:smart
```
Uses the enhanced startup script that:
- Checks port availability before starting
- Provides clear feedback about port selection
- Handles graceful shutdown

#### Option 3: Specific Port
```bash
PORT=3005 npm run dev
```
Forces a specific port (will fail if not available).

### Debugging Port Issues

#### Check Current Configuration
In the browser console:
```javascript
// Import the debug function
import { logPortInfo } from '@/lib/api';

// Log current port configuration
logPortInfo();
```

This will show:
- Current URL and detected port
- API base URL being used
- Environment detection (dev/prod)
- Full configuration object

#### Server Logs
The server provides detailed logging:
```
🔍 Found available port: 3003
✅ Starting on preferred port 3003
🌐 Application available at: http://localhost:3003
```

Or if port is in use:
```
⚠️ Preferred port 3003 was not available, using 3004
🌐 Application available at: http://localhost:3004
```

## Development vs Production

### Development Mode
- Client and server run on the same port
- Vite middleware serves the client
- API requests use relative URLs (`/api/user`)
- Hot module replacement works seamlessly

### Production Mode
- Client may be served from CDN or different port
- API requests use full URLs (`https://api.example.com/api/user`)
- Configuration respects `PUBLIC_URL` environment variable

## Troubleshooting

### Common Issues

#### 1. "Port already in use" errors
**Solution**: Use the smart start script or check what's using the port:
```bash
# Check what's using port 3003
lsof -ti:3003

# Kill processes on port 3003
kill -9 $(lsof -ti:3003)

# Or use the smart start script
npm run dev:smart
```

#### 2. Client can't connect to server
**Symptoms**: 401 errors, "Failed to fetch" errors

**Debug steps**:
1. Check browser console for port information
2. Verify server is running on expected port
3. Check if ports match between client and server

**Solution**:
```bash
# Stop all processes
pkill -f "tsx server/index.ts"

# Start with smart script
npm run dev:smart
```

#### 3. Authentication not persisting
**Symptoms**: User gets logged out on page refresh

**Cause**: Usually port mismatch between login and subsequent requests

**Solution**: Ensure consistent port usage with the smart start script.

### Advanced Debugging

#### Check Port Availability
```javascript
// In Node.js environment
import { findAvailablePort } from '@shared/config';

const port = await findAvailablePort(3003, [3004, 3005, 3006]);
console.log('Available port:', port);
```

#### Monitor Port Changes
The server logs all port-related decisions, so check the console output for:
- Port detection results
- Fallback port usage
- Environment variable updates

## Best Practices

1. **Always use the smart start script** (`npm run dev:smart`) for development
2. **Check server logs** for port information when debugging
3. **Use the client debug utilities** to verify port detection
4. **Set explicit PORT in production** environments
5. **Monitor port conflicts** in team environments

## Configuration Examples

### Development Team Setup
```bash
# .env.local for different team members
# Developer 1
PORT=3003

# Developer 2  
PORT=3004

# Developer 3
PORT=3005
```

### Production Deployment
```bash
# Production .env
NODE_ENV=production
PORT=8080
PUBLIC_URL=https://pos.example.com
```

### Docker Setup
```dockerfile
# Dockerfile
EXPOSE 3003
ENV PORT=3003
ENV PUBLIC_URL=http://localhost:3003
```

## API Reference

### Configuration Functions

#### `getAppConfig()`
Returns complete application configuration including ports, URLs, and environment settings.

#### `getClientConfig()`
Browser-safe version that detects current port and constructs URLs.

#### `findAvailablePort(preferredPort, fallbackPorts)`
Finds the first available port from the provided list.

#### `validatePort(port)`
Validates if a port number is valid (1-65535).

### Client Utilities

#### `apiFetch(endpoint, options)`
Enhanced fetch wrapper that automatically constructs correct URLs.

#### `getPortInfo()`
Returns current port detection information.

#### `logPortInfo()`
Logs detailed port configuration to console.

This port management system ensures reliable client-server communication regardless of port conflicts or environment differences.