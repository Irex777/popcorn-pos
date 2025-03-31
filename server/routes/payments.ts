import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';
 
const router = Router();

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Shop access middleware
const requireShopAccess = async (req: any, res: any, next: any) => {
  const shopId = parseInt(req.params.shopId || req.body.shopId);
  if (!shopId) {
    return res.status(400).json({ error: "Shop ID is required" });
  }

  const shop = await storage.getShop(shopId);
  if (!shop) {
    return res.status(404).json({ error: "Shop not found" });
  }

  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  next();
};

// Ensure Stripe settings exist for a shop
async function ensureStripeSettings(shopId: number) {
  let settings = await storage.getStripeSettings(shopId);
  if (!settings) {
    settings = await storage.updateStripeSettings({
      shopId,
      publishableKey: null,
      // Don't expose secretKey in response
      secretKey: null,
      enabled: false
    });
  }
  return settings;
}

// Get stripe settings endpoint
router.get('/shops/:shopId/stripe-settings', requireAuth, requireShopAccess, async (req: Request, res: Response) => {
  try {
    const shopId = parseInt(req.params.shopId);
    const settings = await ensureStripeSettings(shopId);
    
    // Don't expose secretKey in response
    const { secretKey, ...safeSettings } = settings;
    res.json(safeSettings);
  } catch (error) {
    console.error('Error fetching stripe settings:', error);
    res.status(500).json({ 
      message: 'Failed to fetch Stripe settings' 
    });
  }
});

// Payment intent creation endpoint
router.post('/create-payment-intent', [requireAuth, requireShopAccess], async (req: Request, res: Response) => {
  const { amount, currency: currencyInput, shopId } = req.body;

  try {
    console.log('Payment intent request received:', {
      amount,
      currency: currencyInput,
      shopId,
      authenticated: req.isAuthenticated()
    });

    // Validate required fields
    if (!amount || !currencyInput || !shopId) {
      console.error('Missing required fields:', { 
        amount, 
        currency: currencyInput, 
        shopId,
        type: { amount: typeof amount, currency: typeof currencyInput, shopId: typeof shopId }
      });
      return res.status(400).json({
        message: `Missing required fields: ${!amount ? 'amount,' : ''} ${!currencyInput ? 'currency,' : ''} ${!shopId ? 'shopId' : ''}`.trim()
      });
    }

    // Validate currency format
    const currency = String(currencyInput).toLowerCase();
    const validCurrencies = ['usd', 'eur', 'gbp', 'jpy', 'czk', 'pln'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({ 
        message: `Unsupported currency: ${currency}. Must be one of: ${validCurrencies.join(', ')}` 
      });
    }

    // Check if amount is valid
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        message: 'Invalid amount. Must be a positive number.'
      });
    }

    // Check Stripe configuration
    const stripeSettings = await ensureStripeSettings(shopId);
    if (!stripeSettings?.enabled || !stripeSettings?.publishableKey) {
      console.error('Stripe not configured for shop:', { 
        shopId, 
        enabled: stripeSettings?.enabled, 
        hasKey: !!stripeSettings?.publishableKey 
      });
      return res.status(400).json({
        message: `Stripe is not properly configured for this shop. ${!stripeSettings ? 'No settings found.' : !stripeSettings.enabled ? 'Stripe is disabled.' : 'Missing publishable key.'}`
      });
    }

    // Get shop-specific Stripe credentials
    const settings = await ensureStripeSettings(shopId);
    if (!settings?.secretKey?.startsWith('sk_test_') || settings.secretKey.length < 30) {
      console.error('Invalid Stripe secret key for shop:', shopId);
      return res.status(400).json({
        message: 'Invalid Stripe configuration for this shop'
      });
    }

    // Initialize Stripe with shop-specific key
    const shopStripe = new Stripe(settings.secretKey, {
      apiVersion: '2025-02-24.acacia'
    });

    console.log('Creating payment intent...', { amount, currency, shopId });

    // Create payment intent with strict card-only configuration
    const paymentIntent = await shopStripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
          setup_future_usage: 'off_session'
        }
      },
      metadata: {
        shopId
      },
      confirmation_method: 'automatic'
    });

    console.log('Payment intent created:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret
    }); 

    res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: settings.publishableKey
    });
  } catch (err: any) {
    console.error('Error creating payment intent:', { 
      error: err.stack,
      type: err.type,
      raw: err.raw 
    });
    res.status(400).json({
      error: err.message || 'Failed to create checkout session'
    });
  }
});

export default router;
