import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { cartAtom } from "@/lib/store";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { Plus, Minus, UtensilsCrossed, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import RestaurantCheckoutDialog from "./RestaurantCheckoutDialog";
import { useTranslation } from "react-i18next";
import type { Table, Order, OrderItem } from "@shared/schema";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

interface RestaurantCartPanelProps {
  preSelectedTable?: Table | null;
  editingOrder?: OrderWithItems | null;
  onOrderPlaced?: () => void;
}

// Animation configurations
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

export default function RestaurantCartPanel({ preSelectedTable, editingOrder, onOrderPlaced }: RestaurantCartPanelProps = {}) {
  const { t } = useTranslation();
  const [cart, setCart] = useAtom(cartAtom);
  const [currency] = useAtom(currencyAtom);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [swipingItem, setSwipingItem] = useState<number | null>(null);

  const updateQuantity = (productId: number, delta: number) => {
    setCart(current => {
      const updatedCart = current.map(item => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      return updatedCart;
    });
  };

  const removeItem = (productId: number) => {
    setCart(current => current.filter(item => item.product.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

  return (
    <div className="py-1">
      {cart.length > 0 ? (
        <div className="max-h-[40vh] md:max-h-[calc(100vh-160px)] overflow-y-auto mb-2">
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
                onDragStart={() => setSwipingItem(item.product.id)}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = offset.x * velocity.x;
                  if (swipe < swipeConfidenceThreshold && offset.x < swipeThreshold) {
                    removeItem(item.product.id);
                  }
                  setSwipingItem(null);
                }}
                className={`relative bg-background flex items-center justify-between py-1 touch-pan-y transition-all duration-200 ${
                  swipingItem === item.product.id ? 'bg-red-50 dark:bg-red-900/20 scale-95' : ''
                }`}
                initial={{ x: 0 }}
                animate={{ x: 0 }}
                whileDrag={{ cursor: "grabbing" }}
                style={{ cursor: "grab" }}
              >
                <div className="flex items-center gap-3">
                  <motion.span 
                    className="font-medium text-xl min-w-[32px] text-center bg-primary/10 rounded-full px-3 py-1"
                    key={item.quantity}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {item.quantity}
                  </motion.span>
                  <span className="font-medium text-sm md:text-base">{item.product.name}</span>
                </div>
                <motion.span 
                  className="text-base md:text-lg font-medium"
                  {...bounceAnimation}
                  key={item.quantity * Number(item.product.price)}
                >
                  {formatCurrency(Number(item.product.price) * item.quantity, currency)}
                </motion.span>
                {swipingItem === item.product.id && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none">
                    <Trash2 className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
          </AnimatePresence>
          <div className="text-xs text-muted-foreground text-center mb-2 md:hidden">
            {t('cart.swipeHint', 'Swipe left to remove items')}
          </div>
        </div>
      ) : null}

      <div className="space-y-2 md:space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-xl">{t('common.total')}</span>
          <motion.span 
            className="font-medium text-2xl"
            key={total}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {formatCurrency(total, currency)}
          </motion.span>
        </div>
        <Button 
          className="w-full py-7" 
          size="lg"
          disabled={cart.length === 0}
          onClick={() => setIsCheckoutOpen(true)}
        >
          <span className="text-xl">
            {editingOrder ? t('restaurant.addItemsToOrder') : t('restaurant.placeOrder')} {formatCurrency(total, currency)}
          </span>
        </Button>
      </div>

      <RestaurantCheckoutDialog 
        isOpen={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        preSelectedTable={preSelectedTable}
        editingOrder={editingOrder}
        onOrderPlaced={onOrderPlaced}
      />
    </div>
  );
}