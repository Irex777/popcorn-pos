# Fix Database Connection - Action Required

## The Problem
Your Popcorn POS app is running perfectly at https://pos.aiwrk.org, but it can't connect to the PostgreSQL database because the hostname `cmz5fjtvxu000qp3qr3jvp52rvi` cannot be resolved.

## Quick Fix Steps

### 1. Go to Coolify Dashboard
1. Open your Coolify dashboard
2. Navigate to your PostgreSQL database service
3. Look for the **Connection Details** or **Environment Variables** section

### 2. Find the Correct Database Hostname
Look for one of these:
- **Internal hostname** (might be different from `cmz5fjtvxu000qp3qr3jvp52rvi`)
- **Service name** (usually just `postgres` or `postgresql`)
- **Network alias** 

### 3. Update DATABASE_URL Environment Variable

In Coolify, go to your **Popcorn POS application** settings:

1. Find **Environment Variables**
2. Update the `DATABASE_URL` variable

**Current (broken):**
```
postgresql://popcorn_user:PoPcorn@234@cmz5fjtvxu000qp3qr3jvp52rvi:5432/popcorn_pos
```

**Try these options (in order):**

**Option 1 - Use simple service name:**
```
postgresql://popcorn_user:PoPcorn@234@postgres:5432/popcorn_pos
```

**Option 2 - Use postgresql as hostname:**
```
postgresql://popcorn_user:PoPcorn@234@postgresql:5432/popcorn_pos
```

**Option 3 - Use the database container name from Coolify:**
```
postgresql://popcorn_user:PoPcorn@234@[ACTUAL_DB_CONTAINER_NAME]:5432/popcorn_pos
```

### 4. Restart the Application
After updating the environment variable, restart your Popcorn POS application in Coolify.

### 5. Test the Connection
Visit https://pos.aiwrk.org/api/debug to see if the database connection is now working.

## Expected Success
Once fixed, you should see:
- ✅ Database connection: Connected
- ✅ Login with admin/admin123 should work
- ✅ Full POS functionality enabled

## Need Help?
If none of the hostname options work, check the Coolify logs for your PostgreSQL service to see what hostname/network it's actually using.
