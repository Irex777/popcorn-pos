import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { type Product, type Category } from "@shared/schema";
import { useAtom } from "jotai";
import { cartAtom } from "@/lib/store";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingAnimation, LoadingGrid } from "@/components/ui/loading-animation";
import { useShop } from "@/lib/shop-context";

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
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const { currentShop } = useShop();

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [`/api/shops/${currentShop?.id}/products`],
    enabled: !!currentShop
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: [`/api/shops/${currentShop?.id}/categories`],
    enabled: !!currentShop
  });

  const filteredProducts = activeCategory
    ? products?.filter(p => p.categoryId === activeCategory)
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

  if (!currentShop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t('common.selectShop')}</p>
      </div>
    );
  }

  if (productsLoading || categoriesLoading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-muted rounded-full h-8 w-16 flex-shrink-0"
              />
            ))}
          </motion.div>
        </div>
        <LoadingGrid />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <motion.div 
        className="flex gap-2 overflow-x-auto pb-2 categories-filter -mx-4 px-4 safe-area-x"
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
        {categories?.map(category => (
          <motion.button
            key={category.id}
            whileTap={buttonTapAnimation}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/80 hover:bg-secondary text-foreground/80 hover:text-foreground'
            }`}
          >
            {category.name}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 md:gap-4 product-grid"
        data-testid="product-grid"
      >
        {filteredProducts?.map((product) => (
          <motion.button
            key={product.id}
            variants={item}
            onClick={() => addToCart(product)}
            whileTap={buttonTapAnimation}
            layoutId={`product-${product.id}`}
            className="bg-card hover:bg-accent active:bg-accent/90 rounded-lg p-3 text-left transition-colors w-full border shadow-sm min-h-[80px] product"
          >
            <div className="flex flex-col h-full justify-between">
              <span className="font-medium text-sm md:text-base line-clamp-2">{product.name}</span>
              <span className="text-sm md:text-base font-medium mt-2 text-primary">
                {formatCurrency(Number(product.price), currency)}
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}