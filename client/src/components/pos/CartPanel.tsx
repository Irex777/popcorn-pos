import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { cartAtom } from "@/lib/store";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CheckoutDialog from "./CheckoutDialog";
import { useTranslation } from "react-i18next";

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

const swipeConfidenceThreshold = 10000;
const swipeThreshold = -100;

export default function CartPanel() {
  const { t } = useTranslation();
  const [cart, setCart] = useAtom(cartAtom);
  const [currency] = useAtom(currencyAtom);
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

  const removeItem = (productId: number) => {
    setCart(current => current.filter(item => item.product.id !== productId));
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <div className="py-3 md:py-6">
      <div className="max-h-[30vh] md:max-h-[calc(100vh-200px)] overflow-y-auto mb-3 md:mb-4">
        <AnimatePresence>
          {cart.map(item => (
            <motion.div
              key={item.product.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              layout
              layoutId={`cart-item-${item.product.id}`}
              className="relative mb-2"
            >
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                dragDirectionLock
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = offset.x * velocity.x;
                  if (swipe < swipeConfidenceThreshold && offset.x < swipeThreshold) {
                    removeItem(item.product.id);
                  }
                }}
                className="relative bg-background flex items-center justify-between py-2 touch-pan-y"
                initial={{ x: 0 }}
                animate={{ x: 0 }}
                whileDrag={{ cursor: "grabbing" }}
                style={{ cursor: "grab" }}
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="flex items-center gap-2"
                    {...bounceAnimation}
                  >
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="bg-primary/10 hover:bg-primary/20 rounded-full p-3 transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <motion.span 
                      className="font-medium text-lg min-w-[24px] text-center"
                      key={item.quantity}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {item.quantity}
                    </motion.span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="bg-primary/10 hover:bg-primary/20 rounded-full p-3 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </motion.div>
                  <span className="font-medium text-base">{item.product.name}</span>
                </div>
                <motion.span 
                  className="text-base font-medium"
                  {...bounceAnimation}
                  key={item.quantity * Number(item.product.price)}
                >
                  {formatCurrency(Number(item.product.price) * item.quantity, currency)}
                </motion.span>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-lg">{t('common.total')}</span>
          <motion.span 
            className="font-medium text-xl"
            key={total}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {formatCurrency(total, currency)}
          </motion.span>
        </div>
        <Button 
          className="w-full py-6" 
          size="lg"
          disabled={cart.length === 0}
          onClick={() => setIsCheckoutOpen(true)}
        >
          <span className="text-lg">{t('common.pay')} {formatCurrency(total, currency)}</span>
        </Button>
      </div>

      <CheckoutDialog 
        open={isCheckoutOpen} 
        onOpenChange={setIsCheckoutOpen}
        total={total}
      />
    </div>
  );
}