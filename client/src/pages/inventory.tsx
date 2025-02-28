import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { type Product, type Category } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EditProductDialog from "@/components/inventory/EditProductDialog";
import { Edit } from "lucide-react";
import { Plus } from "lucide-react";
import CreateProductDialog from "@/components/inventory/CreateProductDialog";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { t } = useTranslation();
  const [currency] = useAtom(currencyAtom);

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories']
  });

  const isLoading = productsLoading || categoriesLoading;

  const filteredProducts = selectedCategoryId
    ? products?.filter(p => p.categoryId === selectedCategoryId)
    : products;

  const getCategoryName = (categoryId: number) => {
    return categories?.find(c => c.id === categoryId)?.name || t('common.unknown');
  };

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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t('inventory.title')}</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('inventory.addProduct')}
        </Button>
      </div>

      <motion.div 
        className="flex gap-2 overflow-x-auto pb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          whileTap={buttonTapAnimation}
          onClick={() => setSelectedCategoryId(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            selectedCategoryId === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 hover:bg-primary/20'
          }`}
        >
          {t('common.all')}
        </motion.button>
        {categories?.map(category => (
          <motion.button
            key={category.id}
            whileTap={buttonTapAnimation}
            onClick={() => setSelectedCategoryId(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedCategoryId === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/10 hover:bg-primary/20'
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
                  <p className="text-sm text-muted-foreground">
                    {getCategoryName(product.categoryId)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    {formatCurrency(Number(product.price), currency)}
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
                <span className="text-sm text-muted-foreground">{t('inventory.stock')}</span>
                <Badge variant={product.stock > 10 ? "outline" : "destructive"}>
                  {product.stock} {t('inventory.units')}
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
      <CreateProductDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}