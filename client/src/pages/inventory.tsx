import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { type Product } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EditProductDialog from "@/components/inventory/EditProductDialog";
import { Edit } from "lucide-react";

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

export default function Inventory() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const categories = [...new Set(products?.map(p => p.category) || [])];
  const filteredProducts = activeCategory
    ? products?.filter(p => p.category === activeCategory)
    : products;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-full h-8 w-20 flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card rounded-lg p-4 h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Inventory</h2>

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
              : 'bg-primary/10 hover:bg-primary/20'
          }`}
        >
          All
        </motion.button>
        {categories.map(category => (
          <motion.button
            key={category}
            whileTap={buttonTapAnimation}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeCategory === category
                ? 'bg-primary text-primary-foreground'
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
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {filteredProducts?.map((product) => (
          <motion.div
            key={product.id}
            variants={item}
            className="bg-card rounded-lg p-4"
          >
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {product.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    ${Number(product.price).toFixed(2)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingProduct(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Stock</span>
                <Badge variant={product.stock > 10 ? "outline" : "destructive"}>
                  {product.stock} units
                </Badge>
              </div>
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-md"
                />
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={true}
          onOpenChange={(open) => !open && setEditingProduct(null)}
        />
      )}
    </div>
  );
}