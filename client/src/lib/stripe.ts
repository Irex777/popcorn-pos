import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the publishable key
// Note: This is your *publishable* key, not the secret key
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Helper function to create a payment intent
export async function createPaymentIntent(amount: number, currency: string) {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
}