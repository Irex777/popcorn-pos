# Database Connection Fix Guide

## Current Issue
The application cannot connect to PostgreSQL due to DNS resolution failure for hostname: `cmz5fjtvxu000qp3qr3jvp52rvi`

## Quick Fix Steps in Coolify

### 1. Check PostgreSQL Service Status
1. Navigate to your Coolify dashboard
2. Go to your PostgreSQL service
3. Verify the service status is "Running" (green)
4. Note the exact hostname/connection details

### 2. Verify DATABASE_URL Format
The DATABASE_URL should be in this format:
```
postgresql://popcorn_user:PoPcorn@234@cmz5fjtvxu000qp3qr3jvp52rvi:5432/popcorn_pos
```

### 3. Check Network Configuration
- Ensure both services (app + database) are in the same Docker network
- Verify internal DNS resolution is working

### 4. Test Database Connection
You can test the connection using the debug endpoint once the domain works:
```
curl https://pos.airwrk.org/api/debug
```

## Alternative: Use External PostgreSQL
If internal connectivity continues to fail, you can:
1. Use a managed PostgreSQL service (like Supabase, Railway, or Neon)
2. Update the DATABASE_URL to point to the external service
3. Ensure the external service allows connections from Coolify

## Expected Success Indicators
Once database connectivity is restored, you should see in logs:
- "✅ Default admin account created (admin/admin123)"
- Or "✅ Users already exist, skipping default admin creation"
- No more "EAI_AGAIN" errors

## Current Application Status
✅ **The application itself is working perfectly!**
- Server is running on port 3002
- Health checks are responding
- Static files are being served
- All code is compiled and functional

The only issue is the database connection, which is a configuration matter in Coolify.
