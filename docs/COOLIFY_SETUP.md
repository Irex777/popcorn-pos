# Coolify Configuration for Popcorn POS

## Quick Setup Instructions

1. **Create new resource** in Coolify → Docker Image
2. **Set Git repository** to your repo URL  
3. **Configure these environment variables:**

```bash
NODE_ENV=production
PORT=3002
DATABASE_URL=postgres://user:pass@host:5432/dbname
SESSION_SECRET=your-long-random-secret-here
PUBLIC_URL=https://your-domain.com
NEON_DISABLE_WEBSOCKETS=true
STRIPE_SECRET_KEY=sk_live_your_stripe_key
```

4. **Set exposed port** to `3002`
5. **Deploy**

## Database Options

**Option A: External Database (Recommended)**
- Use Neon, Supabase, or Railway
- Set `DATABASE_URL` to connection string

**Option B: Coolify PostgreSQL**  
- Add PostgreSQL service in same project
- Use internal connection string

## Default Login
- Username: `admin`
- Password: `admin123`
- **Change immediately after first login!**

## Health Check
Application includes `/api/health` endpoint for monitoring.

## Troubleshooting
- Check logs in Coolify dashboard
- Ensure all environment variables are set
- Verify database connectivity
