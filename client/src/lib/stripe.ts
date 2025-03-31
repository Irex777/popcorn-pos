import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripeInstance: Promise<Stripe | null> | null = null;

export function initializeStripe(publishableKey: string | null) {
  if (publishableKey) {
    stripeInstance = loadStripe(publishableKey);
    return stripeInstance;
  }
  stripeInstance = null;
  return null;
}

export function getStripe() {
  return stripeInstance;
}

// Helper function to create a payment intent
export async function createPaymentIntent(amount: number, currency: string, shopId: number) {
  const response = await fetch(`/api/shops/${shopId}/stripe-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency, shopId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to initialize Stripe');
  }

  const settings = await response.json();
  
  // Initialize Stripe with the publishable key from the response
  if (settings.publishableKey) {
    await initializeStripe(settings.publishableKey);
    
    // Now create the actual payment intent
    return fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, shopId }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to create payment intent');
      return res.json();
    });
  }

  throw new Error('Stripe is not properly configured for this shop');
}
