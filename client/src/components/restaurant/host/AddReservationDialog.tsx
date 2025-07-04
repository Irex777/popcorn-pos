import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

import type { InsertReservation } from "@shared/schema";

interface AddReservationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddReservationDialog({ isOpen, onOpenChange }: AddReservationDialogProps) {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    partySize: "",
    reservationDate: "",
    reservationTime: "",
  });

  const createReservationMutation = useMutation({
    mutationFn: async (reservationData: InsertReservation) => {
      if (!currentShop?.id) throw new Error(t('common.shop.noAssigned'));
      
      const response = await fetch(`/api/shops/${currentShop.id}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('restaurant.createReservationError'));
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('restaurant.reservationCreated'),
        description: t('restaurant.reservationCreatedSuccess', { customerName: formData.customerName }),
      });
      queryClient.invalidateQueries({ queryKey: ["reservations", currentShop?.id] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('restaurant.createReservationError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName.trim()) {
      toast({
        title: t('settings.validationError'),
        description: t('restaurant.customerNameRequired'),
        variant: "destructive",
      });
      return;
    }

    if (!formData.partySize) {
      toast({
        title: t('settings.validationError'), 
        description: t('restaurant.partySizeRequired'),
        variant: "destructive",
      });
      return;
    }

    if (!formData.reservationDate || !formData.reservationTime) {
      toast({
        title: t('settings.validationError'),
        description: t('restaurant.dateTimeRequired'),
        variant: "destructive",
      });
      return;
    }

    const reservationDateTime = new Date(`${formData.reservationDate}T${formData.reservationTime}`);
    
    if (reservationDateTime <= new Date()) {
      toast({
        title: t('settings.validationError'),
        description: t('restaurant.futureReservationRequired'),
        variant: "destructive",
      });
      return;
    }

    const reservationData: InsertReservation = {
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim() || undefined,
      partySize: parseInt(formData.partySize),
      reservationTime: reservationDateTime,
      shopId: currentShop!.id,
      status: "confirmed",
    };

    await createReservationMutation.mutateAsync(reservationData);
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      partySize: "",
      reservationDate: "",
      reservationTime: "",
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  // Get today's date as minimum date (allow same-day reservations)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  
  // Get current time for minimum time validation
  const currentTime = today.toTimeString().slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('restaurant.newReservation')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customerName">{t('restaurant.customerName')} *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder={t('restaurant.customerNamePlaceholder')}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="customerPhone">{t('restaurant.phoneNumber')}</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              placeholder={t('restaurant.phoneNumberPlaceholder')}
              type="tel"
            />
          </div>
          
          <div>
            <Label htmlFor="partySize">{t('restaurant.partySize')} *</Label>
            <Input
              id="partySize"
              type="number"
              value={formData.partySize}
              onChange={(e) => setFormData(prev => ({ ...prev, partySize: e.target.value }))}
              placeholder={t('restaurant.partySizePlaceholder')}
              min="1"
              max="100"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="reservationDate">{t('restaurant.reservationDate')} *</Label>
            <Input
              id="reservationDate"
              type="date"
              value={formData.reservationDate}
              onChange={(e) => setFormData(prev => ({ ...prev, reservationDate: e.target.value }))}
              min={minDate}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="reservationTime">{t('restaurant.reservationTime')} *</Label>
            <Input
              id="reservationTime"
              type="time"
              value={formData.reservationTime}
              onChange={(e) => setFormData(prev => ({ ...prev, reservationTime: e.target.value }))}
              min={formData.reservationDate === minDate ? currentTime : undefined}
              required
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={createReservationMutation.isPending}
              className="flex-1"
            >
              {createReservationMutation.isPending ? t('common.creating') : t('restaurant.createReservation')}
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