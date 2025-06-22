# Deploy Popcorn POS with Docker Compose on Coolify

## What This Setup Does

This `docker-compose.yml` configuration:
- ✅ **Runs both your app AND PostgreSQL together**
- ✅ **Ensures they're on the same network** (can communicate)
- ✅ **Uses the correct database credentials**
- ✅ **Includes health checks for both services**
- ✅ **Provides persistent database storage**

## Key Changes Made

1. **DATABASE_URL** now points to `postgres:5432` (the service name)
2. **PostgreSQL service** matches your exact credentials:
   - Database: `popcorn_pos`
   - User: `popcorn_user` 
   - Password: `PoPcorn@234`
3. **Health checks** ensure database is ready before app starts
4. **Persistent volume** keeps your data safe

## How to Deploy on Coolify

### Option 1: Deploy as Docker Compose Project

1. **In Coolify Dashboard:**
   - Click "New Resource"
   - Select "Docker Compose"
   - Choose your repository
   - Coolify will automatically detect the `docker-compose.yml`

2. **Set Environment Variables:**
   ```bash
   SESSION_SECRET=your-super-secure-session-secret-key-minimum-32-characters
   PUBLIC_URL=https://pos.aiwrk.org
   STRIPE_SECRET_KEY=sk_live_your_key_here
   ```

3. **Deploy:** Coolify will build and start both services together

### Option 2: Replace Your Current Separate Services

1. **Delete your current PostgreSQL service** in Coolify
2. **Update your app** to use this Docker Compose setup
3. **Deploy** - now everything runs together

## Expected Results

After deployment:
- ✅ Visit https://pos.aiwrk.org/api/debug
- ✅ Should show: `"database": {"status": "connected ✅"}`
- ✅ Login with `admin`/`admin123` should work
- ✅ Full POS functionality enabled

## Local Testing

You can test this setup locally first:

```bash
# Test the setup locally
docker-compose up --build

# Check the debug endpoint
curl http://localhost:3002/api/debug

# Should show database connected!
```

## Advantages of This Approach

1. **Guaranteed Connectivity:** App and database are on same network
2. **Simplified Deployment:** One deployment instead of two separate services
3. **Better Health Checks:** Database must be ready before app starts
4. **Consistent Environment:** Same setup works locally and in production
5. **No More DNS Issues:** Uses Docker service names instead of random IDs

## Migration Notes

- Your existing data will be lost when switching from separate services
- The admin user (`admin`/`admin123`) will be recreated automatically
- All tables and data will be fresh

This should completely solve your database connectivity issues!
