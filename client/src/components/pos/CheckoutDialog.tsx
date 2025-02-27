import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { cartAtom } from "@/lib/store";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { stripePromise, createPaymentIntent } from "@/lib/stripe";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
}

function CheckoutForm({ total, onSuccess }: { total: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
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
          title: "Payment failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        onSuccess();
        toast({
          title: "Payment successful",
          description: "Your order has been processed"
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: "An unexpected error occurred",
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
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}`}
      </Button>
    </form>
  );
}

export default function CheckoutDialog({ open, onOpenChange, total }: CheckoutDialogProps) {
  const [cart, setCart] = useAtom(cartAtom);
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string>();

  useEffect(() => {
    if (open && total > 0) {
      createPaymentIntent(total)
        .then(data => setClientSecret(data.clientSecret))
        .catch(error => {
          console.error('Error creating payment intent:', error);
          toast({
            title: "Error",
            description: "Failed to initialize payment",
            variant: "destructive"
          });
          onOpenChange(false);
        });
    }
  }, [open, total, toast, onOpenChange]);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        order: {
          total: total.toFixed(2),
          status: "completed"
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
        title: "Order completed",
        description: "Thank you for your purchase!"
      });
      setCart([]);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to process order. Please try again.",
        variant: "destructive"
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {cart.map(item => (
              <div key={item.product.id} className="flex justify-between">
                <span>
                  {item.product.name} x {item.quantity}
                </span>
                <span>
                  ${(Number(item.product.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          {clientSecret ? (
            <div className="mt-6">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm 
                  total={total} 
                  onSuccess={checkoutMutation.mutate}
                />
              </Elements>
            </div>
          ) : (
            <div className="mt-6">
              <LoadingAnimation />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}