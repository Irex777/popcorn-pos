import Stripe from 'stripe';
import { Request, Response } from 'express';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createPaymentIntent(req: Request, res: Response) {
  const { amount, currency, shopId } = req.body;

  try {
    console.log('Creating payment intent with:', { amount, currency, shopId });

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        shopId
      },
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    });

    console.log('Payment intent created:', {
      id: paymentIntent.id,
      paymentMethods: paymentIntent.payment_method_types,
      status: paymentIntent.status
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
  } catch (err: any) {
    console.error('Error creating payment intent:', err);
    res.status(400).json({
      error: err.message
    });
  }
}