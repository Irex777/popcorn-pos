import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { useAtom } from "jotai";
import { cartAtom, type CartItem } from "@/lib/store";
import { Plus, Minus } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ProductGrid() {
  const [cart, setCart] = useAtom(cartAtom);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const getItemQuantity = (productId: number) => {
    const item = cart.find(item => item.product.id === productId);
    return item?.quantity || 0;
  };

  const updateQuantity = (product: Product, delta: number) => {
    setCart(current => {
      const existingItem = current.find(item => item.product.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + delta;
        if (newQuantity <= 0) {
          return current.filter(item => item.product.id !== product.id);
        }
        return current.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      if (delta > 0) {
        return [...current, { product, quantity: 1 }];
      }
      return current;
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg p-4">
            <div className="h-8 bg-muted-foreground/20 rounded mb-2" />
            <div className="h-6 w-1/2 bg-muted-foreground/20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4"
    >
      {products?.map((product) => {
        const quantity = getItemQuantity(product.id);
        return (
          <motion.div key={product.id} variants={item}>
            <div className="bg-card rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm font-medium">
                  ${Number(product.price).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                {quantity > 0 ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(product, -1)}
                      className="bg-primary/10 hover:bg-primary/20 rounded-full p-1"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-medium min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product, 1)}
                      className="bg-primary/10 hover:bg-primary/20 rounded-full p-1"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => updateQuantity(product, 1)}
                    className="bg-primary/10 hover:bg-primary/20 rounded-full p-1"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}