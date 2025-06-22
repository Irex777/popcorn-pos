# Database Connection Troubleshooting

## Current Issue
The application is experiencing database connection timeouts with the error:
```
Connection terminated due to connection timeout
```

## Immediate Status
✅ **Server now starts even with database issues**
- The application will now start and be accessible at https://pos.airwrk.org
- Database initialization is skipped if the connection fails
- This allows you to access the application while fixing the database

## Root Cause Analysis

The database connection timeout suggests one of these issues:

### 1. Network Connectivity Issues (Most Likely)
- The application container cannot reach the PostgreSQL database
- Firewall rules blocking the connection
- Network routing issues in Coolify

### 2. Database Server Configuration
- PostgreSQL service not running or accessible
- Wrong host/port configuration
- Database service not properly exposed

### 3. Authentication Issues
- Incorrect credentials in DATABASE_URL
- User permissions not set correctly

## Verification Steps

### Check Current DATABASE_URL Format
The DATABASE_URL should be in this format:
```
postgresql://username:password@host:port/database_name
```

Current configuration (from logs):
- Username: `popcorn_user`
- Password: `PoPcorn@234`
- Database: `popcorn_pos`
- Port: 5432

### Expected DATABASE_URL
```
postgresql://popcorn_user:PoPcorn@234@[COOLIFY_DB_HOST]:5432/popcorn_pos
```

## Coolify-Specific Solutions

### 1. Check Service Names
In Coolify, services typically communicate using internal service names:
- Database service name: `popcorn-db` (or similar)
- DATABASE_URL should use internal service name: `postgresql://popcorn_user:PoPcorn@234@popcorn-db:5432/popcorn_pos`

### 2. Verify Database Service
1. Check if PostgreSQL service is running in Coolify dashboard
2. Verify service logs for PostgreSQL container
3. Ensure database service started before application

### 3. Network Configuration
1. Ensure both services are in the same network
2. Check if database service exposes port 5432 internally
3. Verify no network policies blocking communication

## Quick Fixes to Try

### Option 1: Update DATABASE_URL
Update the DATABASE_URL environment variable in Coolify to use the internal service name:
```
postgresql://popcorn_user:PoPcorn@234@[DATABASE_SERVICE_NAME]:5432/popcorn_pos
```

### Option 2: Check Database Service Logs
Look at the PostgreSQL service logs in Coolify to see if:
- The database is accepting connections
- There are authentication errors
- The service is properly initialized

### Option 3: Test Database Connection
Connect to the application container and test database connectivity:
```bash
# Test if database host is reachable
nslookup [DATABASE_HOST]
telnet [DATABASE_HOST] 5432

# Test PostgreSQL connection
psql postgresql://popcorn_user:PoPcorn@234@[DATABASE_HOST]:5432/popcorn_pos
```

## Next Steps

1. **Verify the DATABASE_URL** in Coolify environment variables
2. **Check PostgreSQL service status** in Coolify dashboard
3. **Review service networking** configuration
4. **Check database service logs** for connection attempts

## Application Status

The application will now start successfully and serve the web interface even with database connection issues. Once the database connection is fixed, the application will:

1. Automatically create the default admin user (admin/admin123)
2. Initialize all required database tables
3. Be fully functional

## Testing Access

Try accessing the application at: https://pos.airwrk.org

You should now see either:
- ✅ The application login page (if database connects)
- ✅ A partially functional interface (if database still fails but server starts)

The server logs will show whether the database connection succeeded or was skipped.
