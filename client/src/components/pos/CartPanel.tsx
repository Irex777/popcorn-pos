import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { cartAtom } from "@/lib/store";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CheckoutDialog from "./CheckoutDialog";

export default function CartPanel() {
  const [cart, setCart] = useAtom(cartAtom);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const updateQuantity = (productId: number, delta: number) => {
    setCart(current =>
      current.map(item => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0
            ? { ...item, quantity: newQuantity }
            : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <div className="py-4">
      <div className="max-h-[200px] overflow-y-auto mb-4">
        <AnimatePresence>
          {cart.map(item => (
            <motion.div
              key={item.product.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="bg-primary/10 hover:bg-primary/20 rounded-full p-1"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-medium min-w-[20px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="bg-primary/10 hover:bg-primary/20 rounded-full p-1"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="font-medium">{item.product.name}</span>
              </div>
              <span className="text-sm font-medium">
                ${(Number(item.product.price) * item.quantity).toFixed(2)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium">Total</span>
        <span className="font-medium">${total.toFixed(2)}</span>
      </div>
      <Button 
        className="w-full" 
        size="lg"
        disabled={cart.length === 0}
        onClick={() => setIsCheckoutOpen(true)}
      >
        Pay ${total.toFixed(2)}
      </Button>
      <CheckoutDialog 
        open={isCheckoutOpen} 
        onOpenChange={setIsCheckoutOpen}
        total={total}
      />
    </div>
  );
}