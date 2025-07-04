import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InsertTable } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface AddTableDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddTableDialog({ isOpen, onOpenChange }: AddTableDialogProps) {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    number: "",
    capacity: "",
    section: "",
  });

  const createTableMutation = useMutation({
    mutationFn: async (tableData: InsertTable) => {
      if (!currentShop?.id) throw new Error(t('common.shop.noAssigned'));
      
      const response = await fetch(`/api/shops/${currentShop.id}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tableData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('restaurant.createTableError'));
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('restaurant.tableCreated'),
        description: t('restaurant.tableCreatedSuccess', { tableNumber: formData.number }),
      });
      queryClient.invalidateQueries({ queryKey: ["tables", currentShop?.id] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('restaurant.createTableError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.number.trim()) {
      toast({
        title: t('settings.validationError'),
        description: t('restaurant.tableNumberRequired'),
        variant: "destructive",
      });
      return;
    }

    if (!formData.capacity) {
      toast({
        title: t('settings.validationError'), 
        description: t('restaurant.tableCapacityRequired'),
        variant: "destructive",
      });
      return;
    }

    const tableData: InsertTable = {
      number: formData.number.trim(),
      capacity: parseInt(formData.capacity),
      section: formData.section.trim() || undefined,
      shopId: currentShop!.id,
      status: "available",
    };

    await createTableMutation.mutateAsync(tableData);
  };

  const resetForm = () => {
    setFormData({
      number: "",
      capacity: "",
      section: "",
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('restaurant.addTable')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tableNumber">{t('restaurant.tableNumber')} *</Label>
            <Input
              id="tableNumber"
              value={formData.number}
              onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
              placeholder={t('restaurant.tableNumberPlaceholder')}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="capacity">{t('restaurant.capacity')} *</Label>
            <Select
              value={formData.capacity}
              onValueChange={(value) => setFormData(prev => ({ ...prev, capacity: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t('restaurant.selectCapacity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">{t('restaurant.seats', { count: 2 })}</SelectItem>
                <SelectItem value="4">{t('restaurant.seats', { count: 4 })}</SelectItem>
                <SelectItem value="6">{t('restaurant.seats', { count: 6 })}</SelectItem>
                <SelectItem value="8">{t('restaurant.seats', { count: 8 })}</SelectItem>
                <SelectItem value="10">{t('restaurant.seats', { count: 10 })}</SelectItem>
                <SelectItem value="12">{t('restaurant.seats', { count: 12 })}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="section">{t('restaurant.sectionOptional')}</Label>
            <Input
              id="section"
              value={formData.section}
              onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
              placeholder={t('restaurant.sectionPlaceholder')}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={createTableMutation.isPending}
              className="flex-1"
            >
              {createTableMutation.isPending ? t('common.creating') : t('restaurant.addTable')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}