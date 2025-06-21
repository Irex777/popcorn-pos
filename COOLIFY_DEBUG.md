# Coolify Deployment Debugging

## Quick Checklist

### 1. Environment Variables Required:
```bash
NODE_ENV=production
PORT=3002
DATABASE_URL=postgres://user:password@host:5432/database
SESSION_SECRET=your-secure-secret-minimum-32-chars
PUBLIC_URL=https://your-domain.com
```

### 2. Optional Variables:
```bash
NEON_DISABLE_WEBSOCKETS=true
STRIPE_SECRET_KEY=sk_live_your_key
CLIENT_URL=https://your-domain.com
```

### 3. Check Logs for These Messages:
- ✅ "🚀 Starting Popcorn POS server..."
- ✅ "📋 Environment check:"
- ✅ "✅ Users already exist" or "✅ Default admin account created"
- ✅ "Starting in production mode with static file serving"
- ✅ "Server listening on port 3002"

### 4. Common Issues:

**No logs after build:**
- Check if DATABASE_URL is accessible from container
- Verify SESSION_SECRET is set and long enough
- Check if port 3002 is properly exposed

**Container exits immediately:**
- Database connection failed
- Missing required environment variables
- Build artifacts missing (dist/public folder)

**Health check fails:**
- App not responding on port 3002
- /api/health endpoint not accessible
- Container resource limits

### 5. Debug Commands:
```bash
# Check if container is running
docker ps

# View container logs
docker logs <container-id>

# Connect to container
docker exec -it <container-id> sh

# Check if build artifacts exist
ls -la /app/dist/public/
```

### 6. Test Health Endpoint:
After deployment, test: `https://your-domain.com/api/health`
Should return: `{"status":"healthy","timestamp":"..."}`
