import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Use the current stable version
});

// Minimum amounts per currency in smallest units (e.g., cents)
const MINIMUM_AMOUNTS: Record<string, number> = {
  usd: 50, // $0.50
  eur: 50, // €0.50
  gbp: 30, // £0.30
  czk: 1500, // 15 CZK
  // Add other currencies as needed
};

interface PaymentIntentParams {
  amount: number;
  currency: string;
}

export async function createPaymentIntent({ amount, currency }: PaymentIntentParams) {
  try {
    if (typeof currency !== 'string') {
      throw new Error('Currency must be a string');
    }

    if (!currency || currency.length !== 3) {
      throw new Error('Invalid currency code format');
    }

    const lowerCaseCurrency = currency.toLowerCase();
    const minimumAmount = MINIMUM_AMOUNTS[lowerCaseCurrency] || 50;

    if (amount < minimumAmount) {
      throw new Error(`Amount must be at least ${minimumAmount/100} ${currency.toUpperCase()}`);
    }

    console.log('Creating payment intent:', { amount, currency: lowerCaseCurrency });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: lowerCaseCurrency,
      payment_method_types: ['card'],
      metadata: {
        integration_check: 'accept_a_payment',
      }
    });

    console.log('Payment intent created:', paymentIntent.id);
    return { clientSecret: paymentIntent.client_secret };
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    // If it's a Stripe error, get the specific error message
    if (error.type === 'StripeError') {
      throw new Error(error.raw?.message || error.message);
    }
    throw error;
  }
}