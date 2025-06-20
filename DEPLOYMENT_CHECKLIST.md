# Deployment Checklist ✅

## Pre-Deployment
- [ ] Have PostgreSQL database ready
- [ ] Generate strong SESSION_SECRET (32+ characters)
- [ ] Get Stripe keys (if using payments)
- [ ] Choose your domain/subdomain

## Coolify Setup
- [ ] Create new Docker service
- [ ] Connect Git repository
- [ ] Set environment variables
- [ ] Set port to 3002
- [ ] Deploy

## Post-Deployment
- [ ] Access app at your domain
- [ ] Login with admin/admin123
- [ ] Change default password immediately
- [ ] Create your first shop
- [ ] Test core functionality

## Environment Variables Template
```
NODE_ENV=production
PORT=3002
DATABASE_URL=postgres://user:password@host:5432/database
SESSION_SECRET=your-super-secure-random-string-here
PUBLIC_URL=https://your-pos-domain.com
NEON_DISABLE_WEBSOCKETS=true
STRIPE_SECRET_KEY=sk_live_your_stripe_key_here
```

## Done! 🎉
Your Popcorn POS is ready for production deployment on Coolify.
