import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { cartAtom } from "@/lib/store";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CheckoutDialog from "./CheckoutDialog";

const bounceAnimation = {
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.3,
      times: [0, 0.5, 1],
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  }
};

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
              layout
              layoutId={`cart-item-${item.product.id}`}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="flex items-center gap-2"
                  {...bounceAnimation}
                >
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
                </motion.div>
                <span className="font-medium">{item.product.name}</span>
              </div>
              <motion.span 
                className="text-sm font-medium"
                {...bounceAnimation}
              >
                ${(Number(item.product.price) * item.quantity).toFixed(2)}
              </motion.span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium">Total</span>
        <motion.span 
          className="font-medium"
          {...bounceAnimation}
        >
          ${total.toFixed(2)}
        </motion.span>
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