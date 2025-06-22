# Database Connection Fix Guide

## Current Issue
The application is running successfully, but cannot connect to the PostgreSQL database. Error:
```
getaddrinfo EAI_AGAIN cmz5fjtvxu000qp3qr3jvp52rvi
```

This is a **DNS resolution error** - the database hostname cannot be found.

## Solution Steps

### 1. Check Database Service in Coolify

Go to your Coolify dashboard and:
1. Look for the PostgreSQL database service
2. Ensure it's **running** (green status)
3. Check the **connection details**

### 2. Common Database Hostname Formats in Coolify

The database hostname should be one of these formats:
- `postgres-service-name` (if in same stack)
- `postgres-service-name.stack-name` 
- Full internal hostname like `cmz5fjtvxu000qp3qr3jvp52rvi`

### 3. Update DATABASE_URL Environment Variable

Current DATABASE_URL format:
```
postgresql://popcorn_user:PoPcorn@234@cmz5fjtvxu000qp3qr3jvp52rvi:5432/popcorn_pos
```

**Option A: Use Service Name**
```
postgresql://popcorn_user:PoPcorn@234@postgres:5432/popcorn_pos
```

**Option B: Use Localhost (if on same container)**
```
postgresql://popcorn_user:PoPcorn@234@localhost:5432/popcorn_pos
```

**Option C: Use Correct Internal Hostname**
Check the actual hostname in Coolify database service settings.

### 4. Test Database Connection

Run this command locally to test (update the DATABASE_URL):
```bash
node test-db-connection.js
```

### 5. Update Environment Variables in Coolify

1. Go to your application in Coolify
2. Click on **"Secrets"** or **"Environment Variables"**
3. Update the `DATABASE_URL` with the correct hostname
4. **Redeploy** the application

### 6. Alternative: Create Database Manually

If the PostgreSQL service doesn't exist:

1. In Coolify, add a new **PostgreSQL service**
2. Set these credentials:
   - Username: `popcorn_user`
   - Password: `PoPcorn@234`
   - Database: `popcorn_pos`
3. Note the service name/hostname
4. Update DATABASE_URL accordingly

### 7. Quick Database Setup SQL

If you need to create the database and user manually:

```sql
CREATE USER popcorn_user WITH PASSWORD 'PoPcorn@234';
CREATE DATABASE popcorn_pos OWNER popcorn_user;
GRANT ALL PRIVILEGES ON DATABASE popcorn_pos TO popcorn_user;
```

## After Database is Fixed

Once the database connection works:

1. The application will automatically create the default admin user
2. You can login with: **admin / admin123**
3. The application will be fully functional

## Verification Steps

1. Check application logs for database success messages
2. Try logging in with admin/admin123
3. Access the POS interface
4. Verify all features work

## Current Status
- ✅ Application deployed successfully
- ✅ Frontend working (https://pos.aiwrk.org/auth)
- ✅ Server running on port 3002
- ❌ Database connection failing
- ❌ Cannot login (no users created)

The only remaining issue is the database connectivity!
