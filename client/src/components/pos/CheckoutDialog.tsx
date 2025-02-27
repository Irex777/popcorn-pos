import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { cartAtom } from "@/lib/store";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
}

export default function CheckoutDialog({ open, onOpenChange, total }: CheckoutDialogProps) {
  const [cart, setCart] = useAtom(cartAtom);
  const { toast } = useToast();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      // Format the order data according to the schema
      const orderData = {
        order: {
          total: total.toFixed(2), // Ensure total is formatted as string with 2 decimal places
          status: "pending" // Changed from "completed" to match initial state
        },
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: Number(item.product.price).toFixed(2) // Ensure price is formatted as string with 2 decimal places
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
        </div>
        <Button 
          className="w-full"
          onClick={() => checkoutMutation.mutate()}
          disabled={checkoutMutation.isPending}
        >
          {checkoutMutation.isPending ? "Processing..." : "Complete Order"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}