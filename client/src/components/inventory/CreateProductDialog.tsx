import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Category, type InsertProduct, insertProductSchema } from "@shared/schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShop } from "@/lib/shop-context";

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateProductDialog({ open, onOpenChange }: CreateProductDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { currentShop } = useShop();

  const { data: categories } = useQuery<Category[]>({
    queryKey: [`/api/shops/${currentShop?.id}/categories`],
    enabled: !!currentShop
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      price: "0",
      categoryId: undefined,
      imageUrl: "",
      stock: 0,
      shopId: currentShop?.id
    }
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      if (!currentShop) {
        throw new Error("No shop selected");
      }

      // Ensure all required fields are present and properly formatted
      const formattedData = {
        ...data,
        name: data.name.trim(),
        price: Number(data.price).toFixed(2),
        categoryId: Number(data.categoryId),
        imageUrl: data.imageUrl?.trim() || '',
        stock: Number(data.stock),
        shopId: currentShop.id
      };

      console.log('Sending product data:', formattedData);

      const response = await apiRequest(
        'POST',
        `/api/shops/${currentShop.id}/products`,
        formattedData
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('inventory.createError'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop?.id}/products`] });
      toast({
        title: t('inventory.productCreated'),
        description: t('inventory.productCreateSuccess')
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Create product error:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('inventory.createError'),
        variant: "destructive"
      });
    }
  });

  if (!currentShop) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('inventory.createProduct')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => createProductMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('inventory.productName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('inventory.price')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={e => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('inventory.category')}</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('inventory.selectCategory')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('inventory.imageUrl')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/image.jpg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('inventory.initialStock')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={createProductMutation.isPending}
            >
              {createProductMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {createProductMutation.isPending ? t('common.creating') : t('common.create')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}