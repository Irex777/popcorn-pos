import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { cartAtom } from "@/lib/store";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { stripePromise } from "@/lib/stripe";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useTranslation } from "react-i18next";
import { CreditCard, Banknote } from "lucide-react";
import { useShop } from "@/lib/shop-context";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
}

type PaymentMethod = 'card' | 'cash';

function CheckoutForm({ total, onSuccess }: { total: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [currency] = useAtom(currencyAtom);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: t('checkout.error'),
        description: t('checkout.paymentSystemNotReady'),
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-complete`,
        },
        redirect: 'if_required',
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          toast({
            title: t('checkout.paymentFailed'),
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: t('checkout.paymentFailed'),
            description: t('checkout.unexpectedError'),
            variant: "destructive"
          });
        }
      } else {
        onSuccess();
        toast({
          title: t('checkout.paymentSuccessful'),
          description: t('checkout.orderProcessed')
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: t('checkout.paymentFailed'),
        description: error.message || t('checkout.unexpectedError'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
          wallets: {
            applePay: 'auto',
            googlePay: 'auto'
          }
        }}
      />
      <Button
        type="submit"
        className="w-full mt-4"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? t('checkout.processing') : `${t('checkout.pay')} ${formatCurrency(total, currency)}`}
      </Button>
    </form>
  );
}

export default function CheckoutDialog({ open, onOpenChange, total }: CheckoutDialogProps) {
  const [cart, setCart] = useAtom(cartAtom);
  const [currency] = useAtom(currencyAtom);
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const { t } = useTranslation();
  const { currentShop } = useShop();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!currentShop) {
        throw new Error("No shop selected");
      }

      const orderData = {
        order: {
          total: total.toFixed(2),
          status: "completed",
          paymentMethod,
          shopId: currentShop.id
        },
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: Number(item.product.price).toFixed(2)
        }))
      };

      const response = await apiRequest(
        'POST',
        `/api/shops/${currentShop.id}/orders`,
        orderData
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('checkout.orderProcessingFailed'));
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('checkout.orderCompleted'),
        description: t('checkout.thankYou')
      });
      setCart([]);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      toast({
        title: t('checkout.error'),
        description: error instanceof Error ? error.message : t('checkout.orderProcessingFailed'),
        variant: "destructive"
      });
    }
  });

  const initializeCardPayment = async () => {
    if (!open || !currentShop) return;

    // If cart has items but total is below minimum, show appropriate message
    if (cart.length > 0 && total <= 0) {
      toast({
        title: t('checkout.error'),
        description: "Card payments are not available for orders with zero total amount. Please check item prices.",
        variant: "destructive"
      });
      setPaymentMethod('cash');
      return;
    }

    setIsLoading(true);
    setStripeError(undefined);

    try {
      const amountInSmallestUnit = Math.round(total * 100);
      console.log('Initializing payment with currency:', currency.code, 'amount:', amountInSmallestUnit, 'shopId:', currentShop.id);

      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInSmallestUnit,
          currency: currency.code,
          shopId: currentShop.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        // Check if it's a minimum amount error
        if (error.error && error.error.includes("Amount must be at least")) {
          toast({
            title: t('checkout.minimumAmount'),
            description: `${error.error}. Please use cash payment for smaller amounts.`,
            variant: "destructive"
          });
          setPaymentMethod('cash');
          return;
        } else {
          throw new Error(error.error || 'Failed to create payment intent');
        }
      }

      const data = await response.json();
      console.log('Payment intent response:', data);

      if (!data.clientSecret) {
        throw new Error('No client secret received from the server');
      }

      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      setStripeError(error.message || t('checkout.initializationFailed'));
      toast({
        title: t('checkout.error'),
        description: error.message || t('checkout.paymentInitializationFailed'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (paymentMethod === 'card') {
      initializeCardPayment();
    } else {
      setClientSecret(undefined);
      setStripeError(undefined);
    }
  }, [paymentMethod, open, total, currency.code, currentShop?.id]);

  if (!currentShop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('checkout.error')}</DialogTitle>
            <DialogDescription>{t('checkout.noShopSelected')}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('checkout.title')}</DialogTitle>
          <DialogDescription>
            {t('checkout.selectPaymentMethod')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setPaymentMethod('card')}
                disabled={total <= 0}
              >
                <CreditCard className="h-4 w-4" />
                {t('checkout.card')}
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-4 w-4" />
                {t('checkout.cash')}
              </Button>
            </div>

            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between">
                  <span>
                    {item.product.name} x {item.quantity}
                  </span>
                  <span>
                    {formatCurrency(Number(item.product.price) * item.quantity, currency)}
                  </span>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between font-medium">
                  <span>{t('common.total')}</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>

            {paymentMethod === 'card' ? (
              isLoading ? (
                <div className="mt-6">
                  <LoadingAnimation />
                </div>
              ) : clientSecret ? (
                <div className="mt-6">
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: 'var(--primary)',
                          colorBackground: 'var(--background)',
                          colorText: 'var(--foreground)',
                          colorDanger: 'var(--destructive)',
                          fontFamily: 'var(--font-sans)',
                          borderRadius: 'var(--radius)',
                          spacingUnit: '4px'
                        }
                      },
                      paymentMethodCreation: 'manual',
                      payment_method_types: ['card', 'apple_pay', 'google_pay'],
                      paymentMethodConfiguration: {
                        applePay: 'auto',
                        googlePay: 'auto'
                      }
                    }}
                  >
                    <CheckoutForm
                      total={total}
                      onSuccess={checkoutMutation.mutate}
                    />
                  </Elements>
                </div>
              ) : (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  {stripeError || t('checkout.initializationFailed')}
                </div>
              )
            ) : (
              <Button
                className="w-full mt-6"
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? (
                  t('checkout.processing')
                ) : (
                  `${t('checkout.completeCashPayment')} (${formatCurrency(total, currency)})`
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}