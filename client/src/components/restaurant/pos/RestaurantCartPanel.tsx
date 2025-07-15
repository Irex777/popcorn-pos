import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { cartAtom } from "@/lib/store";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { Plus, Minus, UtensilsCrossed } from "lucide-react";
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

export default function RestaurantCartPanel({ preSelectedTable, editingOrder }: RestaurantCartPanelProps = {}) {
  const { t } = useTranslation();
  const [cart, setCart] = useAtom(cartAtom);
  const [currency] = useAtom(currencyAtom);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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

  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const total = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-full flex flex-col bg-background cart-panel" data-testid="cart">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            {t('restaurant.restaurantOrder')}
          </h2>
          <div className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? t('restaurant.item') : t('restaurant.items')}
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('restaurant.addItemsToStart')}</p>
            </motion.div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                drag="x"
                dragConstraints={{ left: -200, right: 0 }}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold && offset.x < swipeThreshold) {
                    removeItem(item.product.id);
                  }
                }}
                className="bg-card border rounded-lg p-3 mb-3 cursor-grab active:cursor-grabbing cart-item"
                data-testid="cart-item"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.product.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Number(item.product.price), currency)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={bounceAnimation}
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
                    >
                      <Minus className="h-4 w-4" />
                    </motion.button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={bounceAnimation}
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    {t('restaurant.swipeLeftToRemove')}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(Number(item.product.price) * item.quantity, currency)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {cart.length > 0 && (
        <div className="border-t p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">{t('common.total')}</span>
            <span className="text-xl font-bold">
              {formatCurrency(total, currency)}
            </span>
          </div>
          <Button 
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full"
            size="lg"
          >
            {editingOrder ? t('restaurant.addItemsToOrder') : t('restaurant.sendToKitchen')}
          </Button>
        </div>
      )}

      <RestaurantCheckoutDialog 
        isOpen={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        preSelectedTable={preSelectedTable}
        editingOrder={editingOrder}
      />
    </div>
  );
}