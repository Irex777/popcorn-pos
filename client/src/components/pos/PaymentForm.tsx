import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useElements, useStripe, PaymentElement } from "@stripe/react-stripe-js";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency, Currency } from "@/lib/settings";
import { useTranslation } from "react-i18next";

interface PaymentFormProps {
  amount: number;
  currency: Currency;
  onSuccess: () => void;
  clientSecret: string;
}

export default function PaymentForm({ amount, currency, onSuccess, clientSecret }: PaymentFormProps) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      });

      if (submitError || !paymentIntent) {
        setError(submitError?.message || t('checkout.paymentFailed'));
        toast({
          title: t('checkout.error'),
          description: submitError?.message,
          variant: "destructive",
        });
      } else if (paymentIntent.status === 'succeeded') {
        toast({
          title: t('checkout.paymentSuccessful'),
          description: t('checkout.thankYou'),
        });
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(t('checkout.unexpectedError'));
      toast({
        title: t('checkout.error'),
        description: t('checkout.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="flex justify-center items-center p-4">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t('checkout.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PaymentElement />

      <div className="pt-4 border-t">
        <div className="flex justify-between font-medium">
          <span>{t('common.total')}</span>
          <span>{formatCurrency(amount, currency)}</span>
        </div>
      </div>

      <Button 
        type="submit"
        className="w-full mt-4 bg-primary hover:opacity-90 transition-opacity text-white"
        disabled={processing}
      >
        {processing ? (
          <LoadingAnimation />
        ) : (
          `${t('checkout.pay')} ${formatCurrency(amount, currency)}`
        )}
      </Button>
    </form>
  );
}
