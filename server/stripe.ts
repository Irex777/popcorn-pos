import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-02-24',
});

export async function createPaymentIntent(amount: number, currency: string) {
  try {
    // Convert the amount to the smallest currency unit (cents/hellers)
    const unitAmount = Math.round(amount * 100);
    console.log('Creating payment intent:', { amount: unitAmount, currency });

    if (typeof currency !== 'string') {
      throw new Error('Currency must be a string');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: unitAmount,
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: {
        integration_check: 'accept_a_payment',
      }
    });

    console.log('Payment intent created:', paymentIntent.id);
    return { clientSecret: paymentIntent.client_secret };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}