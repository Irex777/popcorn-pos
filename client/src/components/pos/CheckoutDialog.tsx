import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { cartAtom } from "@/lib/store";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useTranslation } from "react-i18next";
import { CreditCard, Banknote } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import PaymentForm from "./PaymentForm";

const STRIPE_NOT_CONFIGURED = 'Stripe is not properly configured for this shop';
const STRIPE_CONFIGURATION_ERROR = 'Error checking Stripe configuration';
const AMOUNT_REQUIRED = 'Amount is required';
const PAYMENT_INITIALIZATION_FAILED = 'Payment initialization failed';
 
export default function CheckoutDialog({ open, onOpenChange, total }: CheckoutDialogProps) {
  const [cart, setCart] = useAtom(cartAtom);
  const [currency] = useAtom(currencyAtom);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  
  const validateTotal = (total: number) => {
    if (total <= 0) {
      throw new Error('Total amount must be greater than 0');
    }
    return Math.round(total * 100); // Convert to cents for Stripe
  };

  const initializePayment = async () => {
    setIsLoading(true);
    try {
      const amount = validateTotal(total);
      
      const response = await apiRequest(
        'POST',
        '/api/create-payment-intent',
        {
          amount: amount,
          currency: currency.code,
          shopId: currentShop?.id
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.message === STRIPE_NOT_CONFIGURED) {
          setStripeError(STRIPE_NOT_CONFIGURED);
          setPaymentMethod('cash');
          throw new Error(STRIPE_NOT_CONFIGURED);
        } else {
          throw new Error(error.message || 'Failed to create payment intent');
        }
      }
      
      const { clientSecret: secret, publishableKey } = await response.json();
      if (!secret || !publishableKey) {
        throw new Error('Invalid payment configuration received');
      }
      
      setClientSecret(secret);
      setStripePromise(loadStripe(publishableKey));
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : PAYMENT_INITIALIZATION_FAILED;
      
      if (errorMessage !== STRIPE_NOT_CONFIGURED) {
        setStripeError(errorMessage);
      }
      
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if Stripe is configured for this shop
  useEffect(() => {
    async function checkStripeSettings(shopId: number) {
      try {
        setStripeError(null);
        const response = await apiRequest('GET', `/api/shops/${shopId}/stripe-settings`);
        if (!response.ok) throw new Error(STRIPE_CONFIGURATION_ERROR);
        const settings = await response.json();
        
        const isConfigured = settings?.enabled && !!settings?.publishableKey;
        console.log('Stripe settings:', { isConfigured, settings });
        setStripeEnabled(isConfigured);
        if (!isConfigured) {
          setPaymentMethod('cash');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : STRIPE_CONFIGURATION_ERROR;
        console.error('Failed to check Stripe settings:', errorMessage);
        setStripeEnabled(false);
        setStripeError(errorMessage);
        setPaymentMethod('cash');
      }
    }

    if (!currentShop?.id) {
      setStripeEnabled(false);
      setPaymentMethod('cash');
      return;
    }

    checkStripeSettings(currentShop.id);
  }, [currentShop?.id]);

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
              {stripeError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>{t('checkout.paymentConfigError')}</AlertTitle>
                  <AlertDescription>
                    {stripeError}
                  </AlertDescription>
                </Alert>
              )}
              
              {stripeEnabled && (
                <Button
                  type="button"
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={async () => {
    setPaymentMethod('card');
    await initializePayment();
  }}
                  disabled={total <= 0}
                >
                  <CreditCard className="h-4 w-4" />
                  {t('checkout.card')}
                </Button>
              )}
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
              clientSecret && stripePromise ? (
                <Elements 
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#006ADC'
                      }
                    }
                  }}
                >
                  <PaymentForm 
                    amount={total}
                    currency={currency}
                    clientSecret={clientSecret}
                    onSuccess={() => {
                      setCart([]);
                      onOpenChange(false);
                      toast({
                        title: t('checkout.orderCompleted'),
                        description: t('checkout.thankYou')
                      });
                    }}
                  />
                </Elements>
              ) : (
              isLoading ? (
                <div className="flex justify-center p-4">
                  <LoadingAnimation />
                </div>
              ) : (
                <Button
                  className="w-full mt-4 bg-primary hover:opacity-90 transition-opacity text-white"
                  onClick={initializePayment}
                >
                  Start Payment
                </Button>
              )
              )
            ) : (
              <Button
                className="w-full mt-4 bg-primary hover:opacity-90 transition-opacity text-white"
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

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
}

type PaymentMethod = 'card' | 'cash';
