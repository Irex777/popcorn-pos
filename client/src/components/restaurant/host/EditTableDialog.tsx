import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Table } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface EditTableDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
}

export default function EditTableDialog({ isOpen, onOpenChange, table }: EditTableDialogProps) {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    number: "",
    capacity: "",
    section: "",
    status: "available",
  });

  useEffect(() => {
    if (table) {
      setFormData({
        number: table.number,
        capacity: table.capacity.toString(),
        section: table.section || "",
        status: table.status,
      });
    }
  }, [table]);

  const updateTableMutation = useMutation({
    mutationFn: async (tableData: Partial<Table>) => {
      if (!currentShop?.id || !table?.id) throw new Error(t('common.shop.noAssigned'));
      
      const response = await fetch(`/api/shops/${currentShop.id}/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tableData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('restaurant.updateTableError'));
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('restaurant.tableUpdated'),
        description: t('restaurant.tableUpdatedSuccess', { tableNumber: formData.number }),
      });
      queryClient.invalidateQueries({ queryKey: ["tables", currentShop?.id] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('restaurant.updateTableError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async () => {
      if (!currentShop?.id || !table?.id) throw new Error(t('common.shop.noAssigned'));
      
      const response = await fetch(`/api/shops/${currentShop.id}/tables/${table.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('restaurant.deleteTableError'));
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('restaurant.tableDeleted'),
        description: t('restaurant.tableDeletedSuccess', { tableNumber: formData.number }),
      });
      queryClient.invalidateQueries({ queryKey: ["tables", currentShop?.id] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('restaurant.deleteTableError'),
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

    const tableData = {
      number: formData.number.trim(),
      capacity: parseInt(formData.capacity),
      section: formData.section.trim() || undefined,
      status: formData.status,
    };

    await updateTableMutation.mutateAsync(tableData);
  };

  const handleDelete = async () => {
    if (window.confirm(t('restaurant.confirmDeleteTable', { tableNumber: formData.number }))) {
      await deleteTableMutation.mutateAsync();
    }
  };

  const resetForm = () => {
    setFormData({
      number: "",
      capacity: "",
      section: "",
      status: "available",
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
          <DialogTitle>{t('restaurant.editTable')} {table?.number}</DialogTitle>
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

          <div>
            <Label htmlFor="status">{t('restaurant.status')}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">{t('restaurant.available')}</SelectItem>
                <SelectItem value="occupied">{t('restaurant.occupied')}</SelectItem>
                <SelectItem value="reserved">{t('restaurant.reserved')}</SelectItem>
                <SelectItem value="cleaning">{t('restaurant.cleaning')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={updateTableMutation.isPending}
              className="flex-1"
            >
              {updateTableMutation.isPending ? t('common.updating') : t('restaurant.updateTable')}
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
          
          <div className="pt-4 border-t">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteTableMutation.isPending}
              className="w-full"
            >
              {deleteTableMutation.isPending ? t('common.deleting') : t('restaurant.deleteTable')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}