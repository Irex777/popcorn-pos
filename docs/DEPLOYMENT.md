# Popcorn POS Deployment Guide

This guide provides comprehensive instructions for deploying the Popcorn POS application using Docker and Coolify.

## 1. Pre-Deployment Checklist

- [ ] **PostgreSQL Database**: Have a PostgreSQL database ready. You can use a managed service like Neon or Supabase, or host one within Coolify.
- [ ] **Session Secret**: Generate a strong, random string (32+ characters) for the `SESSION_SECRET`.
- [ ] **Stripe Keys**: If you plan to use payment processing, have your Stripe secret key (`sk_live_...`) available.
- [ ] **Domain Name**: Choose the domain or subdomain where you will host the application (e.g., `pos.yourdomain.com`).

## 2. Environment Variables

You will need to configure the following environment variables in your deployment environment (e.g., Coolify).

```bash
# REQUIRED
NODE_ENV=production
PORT=3002
DATABASE_URL=postgres://user:password@host:5432/database
SESSION_SECRET=your-super-secure-random-string-here
PUBLIC_URL=https://your-pos-domain.com

# OPTIONAL
STRIPE_SECRET_KEY=sk_live_your_stripe_key_here
NEON_DISABLE_WEBSOCKETS=true # Required if using a Neon database
```

## 3. Coolify Deployment Steps

1.  **Create New Resource**: In your Coolify dashboard, create a new resource of type **Docker Image**.
2.  **Connect Git Repository**: Set the Git repository to your Popcorn POS fork.
3.  **Configure Environment Variables**: Add the environment variables listed above.
4.  **Expose Port**: Set the exposed port to `3002`.
5.  **Deploy**: Start the deployment.

## 4. Database Setup

### Option A: External Database (Recommended)

Use a managed PostgreSQL service for better scalability and reliability.
*   **Neon**: [neon.tech](https://neon.tech)
*   **Supabase**: [supabase.com](https://supabase.com)
*   **Railway**: [railway.app](https://railway.app)

Set the `DATABASE_URL` environment variable to the connection string provided by your database host.

### Option B: Coolify-Hosted PostgreSQL

1.  Add a new PostgreSQL service within your Coolify project.
2.  Coolify will provide an internal connection string. Use this value for the `DATABASE_URL` environment variable in your Popcorn POS application service.

## 5. Post-Deployment Checklist

- [ ] **Access Application**: Open your `PUBLIC_URL` in a browser.
- [ ] **Initial Login**: Log in with the default credentials:
    *   **Username**: `admin`
    *   **Password**: `admin123`
- [ ] **Change Default Password**: Immediately navigate to settings and change the administrator password.
- [ ] **Create a Shop**: Set up your first shop to begin using the POS.
- [ ] **Test Core Functionality**: Create a product, process a test order, and check the analytics.

## 6. Important Operations

### Database Migrations

The application uses Drizzle ORM for database management. If you make schema changes, you may need to push them to your database.

```bash
# Connect to your production environment and run:
npm run db:push
```

### Health Checks

Coolify can monitor your application's health using the built-in health check endpoint:

`/api/health`

## 7. Troubleshooting

*   **Database Connection Failed**:
    *   Double-check your `DATABASE_URL`.
    *   Ensure your database server is accessible from your Coolify instance (check firewall rules).
*   **Session Issues / Being Logged Out**:
    *   Verify that `SESSION_SECRET` is set and is a long, random string.
*   **CORS Errors**:
    *   Ensure `PUBLIC_URL` is set correctly to the domain you are using.
*   **Build Failures**:
    *   Check the build logs in Coolify for errors. Ensure all required environment variables are present during the build phase.

## 8. Security Best Practices

*   Use a strong, unique `SESSION_SECRET`.
*   Always use HTTPS in production (Coolify can handle this automatically).
*   Keep your `STRIPE_SECRET_KEY` and `DATABASE_URL` secure.
*   Change the default admin password immediately after deployment.
*   Regularly update application dependencies to patch security vulnerabilities.
