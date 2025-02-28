import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { cartAtom } from "@/lib/store";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { stripePromise, createPaymentIntent } from "@/lib/stripe";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useTranslation } from "react-i18next";
import { CreditCard, Banknote } from "lucide-react";

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
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-complete`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: t('checkout.paymentFailed'),
          description: error.message,
          variant: "destructive"
        });
      } else {
        onSuccess();
        toast({
          title: t('checkout.paymentSuccessful'),
          description: t('checkout.orderProcessed')
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: t('checkout.paymentFailed'),
        description: t('checkout.unexpectedError'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
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

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        order: {
          total: total.toFixed(2),
          status: "completed",
          paymentMethod
        },
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: Number(item.product.price).toFixed(2)
        }))
      };

      const response = await apiRequest('POST', '/api/orders', orderData);
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
        description: t('checkout.orderProcessingFailed'),
        variant: "destructive"
      });
    }
  });

  const initializeCardPayment = async () => {
    if (open && total > 0) {
      setIsLoading(true);
      setStripeError(undefined);
      try {
        console.log('Initializing payment with currency code:', currency.code);
        const data = await createPaymentIntent(total, currency.code);
        console.log('Payment intent created:', data);
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error('Error creating payment intent:', error);
        setStripeError(error.message || t('checkout.initializationFailed'));
        toast({
          title: t('checkout.error'),
          description: t('checkout.paymentInitializationFailed'),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Initialize card payment when switching to card payment method
  React.useEffect(() => {
    if (paymentMethod === 'card') {
      initializeCardPayment();
    } else {
      setClientSecret(undefined);
      setStripeError(undefined);
    }
  }, [paymentMethod, open, total, currency.code]);

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

            {/* Order Summary */}
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

            {/* Payment Section */}
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