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
### 7. Database Connection Issues in Coolify:

**Problem:** `getaddrinfo EAI_AGAIN <hostname>` error
**Cause:** Application and database containers cannot communicate

**Solutions (try in order):**

**Option 1 - Use Service Name:**
```bash
DATABASE_URL=postgresql://popcorn_user:PoPcorn@234@popcorn-pos-db:5432/popcorn_pos
```

**Option 2 - Deploy in Same Stack/Project:**
1. In Coolify, create a new "Project" 
2. Deploy BOTH your app AND database in the same project
3. Use the database service name as hostname

**Option 3 - Use Docker Compose (Recommended):**
Create `docker-compose.yml` in your app:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://popcorn_user:PoPcorn@234@postgres:5432/popcorn_pos
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: popcorn_pos
      POSTGRES_USER: popcorn_user
      POSTGRES_PASSWORD: PoPcorn@234
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Option 4 - Use External Database:**
Instead of Coolify's PostgreSQL, use an external service like:
- Neon.tech
- Supabase
- Railway
- PlanetScale

**Option 5 - Check Network Configuration:**
In Coolify dashboard:
1. Go to your app's "Network" settings
2. Ensure it can connect to the database service
3. Check if both services are in the same network

### 8. Quick Fix Commands:

**Test DNS resolution from your app container:**
```bash
# In Coolify app logs/terminal
nslookup cmz5fjtvxu000qp3qr3jvp52rvi
nslookup popcorn-pos-db
ping cmz5fjtvxu000qp3qr3jvp52rvi
```

**Check if services are in same network:**
```bash
docker network ls
docker inspect <network-name>
```
