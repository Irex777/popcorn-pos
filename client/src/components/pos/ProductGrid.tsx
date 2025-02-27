import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { useAtom } from "jotai";
import { cartAtom } from "@/lib/store";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [cart, setCart] = useAtom(cartAtom);
  const [currency] = useAtom(currencyAtom);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const categories = [...new Set(products?.map(p => p.category) || [])];

  const filteredProducts = activeCategory
    ? products?.filter(p => p.category === activeCategory)
    : products;

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
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-full h-8 w-20 flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div 
        className="flex gap-2 overflow-x-auto pb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          whileTap={buttonTapAnimation}
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            activeCategory === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/80 hover:bg-secondary text-foreground/80 hover:text-foreground'
          }`}
        >
          {t('common.all')}
        </motion.button>
        {categories.map(category => (
          <motion.button
            key={category}
            whileTap={buttonTapAnimation}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/80 hover:bg-secondary text-foreground/80 hover:text-foreground'
            }`}
          >
            {category}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4"
      >
        {filteredProducts?.map((product) => (
          <motion.button
            key={product.id}
            variants={item}
            onClick={() => addToCart(product)}
            whileTap={buttonTapAnimation}
            layoutId={`product-${product.id}`}
            className="bg-card hover:bg-accent active:bg-accent/90 rounded-lg p-4 text-left transition-colors w-full border shadow-sm"
          >
            <div className="flex flex-col h-full justify-between">
              <span className="font-medium">{product.name}</span>
              <span className="text-sm font-medium mt-2 text-primary">
                {formatCurrency(Number(product.price), currency)}
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}