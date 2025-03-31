import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useElements, useStripe, PaymentElement } from "@stripe/react-stripe-js";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency, Currency } from "@/lib/settings";

interface PaymentFormProps {
  amount: number;
  currency: Currency;
  onSuccess: () => void;
  clientSecret: string;
}

export default function PaymentForm({ amount, currency, onSuccess, clientSecret }: PaymentFormProps) {
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
        setError(submitError?.message || 'Payment failed');
        toast({
          title: "Payment Error",
          description: submitError?.message,
          variant: "destructive",
        });
      } else if (paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful",
          description: "Thank you for your payment",
        });
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred');
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred",
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
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PaymentElement />

      <div className="pt-4 border-t">
        <div className="flex justify-between font-medium">
          <span>Total</span>
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
          `Pay ${formatCurrency(amount, currency)}`
        )}
      </Button>
    </form>
  );
}
