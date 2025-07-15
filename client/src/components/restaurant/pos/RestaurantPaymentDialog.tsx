import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useShop } from "@/lib/shop-context";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/settings";
import { currencyAtom } from "@/lib/settings";
import { useAtom } from "jotai";
import { CreditCard, Banknote, CheckCircle } from "lucide-react";
import type { Order, OrderItem } from "@shared/schema";

interface RestaurantPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order & { items: OrderItem[] };
  tableNumber?: string;
}

export default function RestaurantPaymentDialog({ 
  isOpen, 
  onOpenChange, 
  order, 
  tableNumber 
}: RestaurantPaymentDialogProps) {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const { toast } = useToast();
  const [currency] = useAtom(currencyAtom);
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const completePaymentMutation = useMutation({
    mutationFn: async ({ orderId, method }: { orderId: number; method: string }) => {
      if (!currentShop?.id) throw new Error(t('common.shop.noAssigned'));
      
      console.log('Attempting payment completion:', { shopId: currentShop.id, orderId, method });
      
      const response = await fetch(`/api/shops/${currentShop.id}/orders/${orderId}/complete-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'completed',
          paymentMethod: method,
          completedAt: new Date().toISOString()
        })
      });
      
      console.log('Payment API response:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment API error details:', errorText);
        throw new Error(`${t('checkout.paymentFailed')}: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('checkout.paymentCompleted'),
        description: t('checkout.orderPaidSuccess', { orderId: order.id }),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop?.id}/orders`] });
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop?.id}/tables`] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: t('checkout.paymentFailed'),
        description: error instanceof Error ? error.message : t('checkout.paymentProcessingError'),
        variant: "destructive",
      });
    }
  });

  const handleCompletePayment = async () => {
    setIsProcessing(true);
    try {
      await completePaymentMutation.mutateAsync({ 
        orderId: order.id, 
        method: paymentMethod 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('restaurant.processPayment')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{t('common.order')} #{order.id}</span>
              {tableNumber && (
                <Badge variant="outline">{t('restaurant.table')} {tableNumber}</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('restaurant.guests', { count: order.guestCount })}
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">{t('restaurant.orderItems')}</h3>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.product?.name || t('common.unknown')}</span>
                  <span>{formatCurrency(Number(item.price) * item.quantity, currency)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-bold">
            <span>{t('common.total')}</span>
            <span>{formatCurrency(Number(order.total), currency)}</span>
          </div>

          <Separator />

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold">{t('checkout.selectPaymentMethod')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="flex items-center gap-2"
              >
                <Banknote className="h-4 w-4" />
                {t('checkout.cash')}
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {t('checkout.card')}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleCompletePayment}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                t('restaurant.processing')
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('checkout.completePayment')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}