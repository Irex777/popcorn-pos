import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Use the current stable version
});

export async function createPaymentIntent(amount: number, currency: string) {
  try {
    // Convert the amount to the smallest currency unit (cents/hellers)
    const unitAmount = Math.round(amount * 100);
    console.log('Creating payment intent:', { amount: unitAmount, currency });

    if (typeof currency !== 'string') {
      throw new Error('Currency must be a string');
    }

    if (!currency || currency.length !== 3) {
      throw new Error('Invalid currency code format');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: unitAmount,
      currency: currency.toLowerCase(), // Stripe expects lowercase currency codes
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