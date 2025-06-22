# Docker Deployment Guide

This guide explains how to deploy the Popcorn POS application using Docker and Coolify.

## Prerequisites

- Docker and Docker Compose installed
- A PostgreSQL database (can be external like Neon, or hosted on Coolify)
- Stripe account for payment processing (optional)

## Environment Variables

Configure the following environment variables in Coolify:

### Required Variables
- `NODE_ENV=production`
- `PORT=3002`
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random string for session encryption
- `PUBLIC_URL` - Your app's public URL (e.g., https://pos.yourdomain.com)

### Optional Variables
- `STRIPE_SECRET_KEY` - For payment processing
- `NEON_DISABLE_WEBSOCKETS=true` - If using Neon database
- `CLIENT_URL` - If different from PUBLIC_URL

## Coolify Deployment Steps

1. **Create a new project** in Coolify
2. **Connect your Git repository** containing this code
3. **Set the build pack** to Docker
4. **Configure environment variables** as listed above
5. **Set the port** to 3002
6. **Deploy** the application

## Database Setup

### Option 1: External Database (Recommended)
Use a managed PostgreSQL service like:
- Neon (https://neon.tech)
- Supabase (https://supabase.com)
- Railway (https://railway.app)
- PlanetScale MySQL (requires schema changes)

### Option 2: Coolify PostgreSQL
1. Create a PostgreSQL service in Coolify
2. Note the connection details
3. Use the internal connection string for DATABASE_URL

## Database Migrations

The application uses Drizzle ORM. To run migrations:

```bash
# If you need to push schema changes
npm run db:push
```

## Health Checks

The application includes a health check endpoint at `/api/health` that Coolify can use to monitor the application status.

## Default Admin Account

On first startup, if no users exist, the application creates:
- Username: `admin`
- Password: `admin123`

**Important:** Change this password immediately after first login!

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify DATABASE_URL format: `postgres://user:password@host:port/database`
   - Ensure database allows connections from your Coolify instance

2. **Session Issues**
   - Ensure SESSION_SECRET is set and consistent across deployments
   - SESSION_SECRET should be a long, random string

3. **CORS Issues**
   - Set PUBLIC_URL to match your domain
   - If using a separate frontend, set CLIENT_URL appropriately

4. **Build Failures**
   - Ensure all environment variables are set during build
   - Check Docker build logs in Coolify

### Logs

View application logs in Coolify dashboard to diagnose issues.

## Security Considerations

1. Use strong, unique SESSION_SECRET
2. Use HTTPS in production (Coolify handles this)
3. Keep Stripe keys secure
4. Change default admin password
5. Regularly update dependencies

## Scaling

For high-traffic deployments:
1. Use external database with connection pooling
2. Consider Redis for session storage
3. Use CDN for static assets
4. Monitor resource usage in Coolify
