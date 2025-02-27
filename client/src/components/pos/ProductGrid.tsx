import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { useAtom } from "jotai";
import { cartAtom } from "@/lib/store";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Coffee, CakeSlice } from "lucide-react";

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

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'drinks':
      return <Coffee className="h-8 w-8 mb-2 text-primary" />;
    case 'bakery':
      return <CakeSlice className="h-8 w-8 mb-2 text-primary" />;
    default:
      return null;
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
      <div className="space-y-6">
        <div className="flex gap-3 overflow-x-auto pb-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-full h-12 w-24 flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-xl h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex gap-3 overflow-x-auto pb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          whileTap={buttonTapAnimation}
          onClick={() => setActiveCategory(null)}
          className={`px-6 py-3 rounded-full text-base font-medium whitespace-nowrap transition-all ${
            activeCategory === null
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-primary/10 hover:bg-primary/20'
          }`}
        >
          {t('common.all')}
        </motion.button>
        {categories.map(category => (
          <motion.button
            key={category}
            whileTap={buttonTapAnimation}
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-3 rounded-full text-base font-medium whitespace-nowrap transition-all ${
              activeCategory === category
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-primary/10 hover:bg-primary/20'
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
        className="grid grid-cols-2 md:grid-cols-3 gap-6"
      >
        {filteredProducts?.map((product) => (
          <motion.button
            key={product.id}
            variants={item}
            onClick={() => addToCart(product)}
            whileTap={buttonTapAnimation}
            layoutId={`product-${product.id}`}
            className="bg-card hover:bg-card/90 active:bg-card/80 rounded-xl p-6 text-left transition-all hover:shadow-lg hover:-translate-y-1 w-full relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent group-hover:from-primary/10" />
            <div className="relative flex flex-col h-full justify-between">
              <div>
                {getCategoryIcon(product.category)}
                <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {product.category}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(Number(product.price), currency)}
                </span>
                {product.stock < 10 && (
                  <span className="text-sm text-destructive">
                    {product.stock} {t('common.units')}
                  </span>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}