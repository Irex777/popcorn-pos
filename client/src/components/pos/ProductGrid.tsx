import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { useAtom } from "jotai";
import { cartAtom } from "@/lib/store";

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

const buttonTapAnimation = {
  scale: 0.95,
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 15
  }
};

export default function ProductGrid() {
  const [cart, setCart] = useAtom(cartAtom);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const addToCart = (product: Product) => {
    setCart(current => {
      const existingItem = current.find(item => item.product.id === product.id);
      if (existingItem) {
        return current.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
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
      {products?.map((product) => (
        <motion.button
          key={product.id}
          variants={item}
          onClick={() => addToCart(product)}
          whileTap={buttonTapAnimation}
          layoutId={`product-${product.id}`}
          className="bg-card hover:bg-card/90 active:bg-card/80 rounded-lg p-4 text-left transition-colors w-full"
        >
          <div className="flex flex-col h-full justify-between">
            <span className="font-medium">{product.name}</span>
            <span className="text-sm font-medium mt-2">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}