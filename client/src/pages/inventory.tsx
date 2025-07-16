import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { type Product, type Category } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EditProductDialog from "@/components/inventory/EditProductDialog";
import { Edit, Plus, Trash2, Search, X } from "lucide-react";
import CreateProductDialog from "@/components/inventory/CreateProductDialog";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { useShop } from "@/lib/shop-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useMemo } from "react";

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
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const [currency] = useAtom(currencyAtom);
  const { currentShop } = useShop();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [`/api/shops/${currentShop?.id}/products`],
    enabled: !!currentShop
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: [`/api/shops/${currentShop?.id}/categories`],
    enabled: !!currentShop
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!currentShop) throw new Error("No shop selected");
      const response = await apiRequest(
        'DELETE',
        `api/shops/${currentShop.id}/products/${productId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('inventory.deleteError'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop?.id}/products`] });
      toast({
        title: t('inventory.productDeleted'),
        description: t('inventory.productDeleteSuccess')
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const isLoading = productsLoading || categoriesLoading;

  const getCategoryName = (categoryId: number) => {
    return categories?.find(c => c.id === categoryId)?.name || t('common.unknown');
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = products;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(product.categoryId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.price.toString().includes(searchTerm)
      );
    }
    
    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(p => p.categoryId === selectedCategoryId);
    }
    
    return filtered;
  }, [products, searchTerm, selectedCategoryId, categories]);

  if (!currentShop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t('common.selectShop')}</p>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold">{t('inventory.title')}</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('inventory.addProduct')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder={t('inventory.searchPlaceholder', 'Search products, categories, or prices...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {filteredProducts.length} {t('inventory.resultsFound', 'products found')}
        </div>
      )}

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

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? t('inventory.noResultsFound', 'No products found') : t('inventory.noProducts', 'No products available')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm 
              ? t('inventory.tryDifferentSearch', 'Try adjusting your search terms or filters')
              : t('inventory.addFirstProduct', 'Add your first product to get started')
            }
          </p>
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              {t('inventory.clearSearch', 'Clear search')}
            </Button>
          )}
        </div>
      ) : (
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(t('inventory.confirmDelete'))) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
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
      )}

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