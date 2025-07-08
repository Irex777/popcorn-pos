import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { type Category } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema } from "@shared/schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useTranslation } from "react-i18next";
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

interface CategoryDialogProps {
  category?: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CategoryDialog({ category, open, onOpenChange }: CategoryDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { currentShop } = useShop();

  const form = useForm({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      color: category?.color || "#94A3B8",
      shopId: currentShop?.id
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!currentShop) {
        throw new Error("No shop selected");
      }

      const response = await apiRequest(
        category ? 'PATCH' : 'POST',
        category ? `/api/shops/${currentShop.id}/categories/${category.id}` : `/api/shops/${currentShop.id}/categories`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop?.id}/categories`] });
      toast({
        title: category ? t("categories.updated") : t("categories.created"),
        description: category ? t("categories.updateSuccess") : t("categories.createSuccess")
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: category ? t("categories.updateError") : t("categories.createError"),
        variant: "destructive"
      });
    }
  });

  if (!currentShop) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? t("categories.editCategory") : t("categories.createNewCategory")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('categories.name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('categories.description')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('categories.color')}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input type="color" {...field} className="w-12 h-10 p-1" />
                      <Input {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (category ? t("categories.updating") : t("categories.creating")) : (category ? t("categories.updateCategory") : t("categories.createCategory"))}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Categories() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { currentShop } = useShop();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: [`/api/shops/${currentShop?.id}/categories`],
    enabled: !!currentShop
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!currentShop) {
        throw new Error("No shop selected");
      }
      const response = await apiRequest('DELETE', `shops/${currentShop.id}/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop?.id}/categories`] });
      toast({
        title: t("categories.deleted"),
        description: t("categories.deleteSuccess")
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("categories.deleteError"),
        variant: "destructive"
      });
    }
  });

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
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card rounded-lg p-4 h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t('categories.title')}</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('categories.addCategory')}
        </Button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {categories?.map((category) => (
          <motion.div
            key={category.id}
            variants={item}
            className="bg-card rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingCategory(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(t("categories.confirmDelete"))) {
                      deleteMutation.mutate(category.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <CategoryDialog
        category={editingCategory || undefined}
        open={Boolean(editingCategory)}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      />
      <CategoryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}