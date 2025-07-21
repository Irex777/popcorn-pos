import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { cartAtom } from "@/lib/store";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { useShop } from "@/lib/shop-context";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Banknote, UtensilsCrossed, Receipt } from "lucide-react";
import TableSelector from "../shared/TableSelector";
import OrderTypeSelector from "../shared/OrderTypeSelector";
import GuestCounter from "../shared/GuestCounter";
import type { Table, Order, OrderItem } from "@shared/schema";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

interface RestaurantCheckoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedTable?: Table | null;
  editingOrder?: OrderWithItems | null;
  onOrderPlaced?: () => void;
}

export default function RestaurantCheckoutDialog({ isOpen, onOpenChange, preSelectedTable, editingOrder, onOrderPlaced }: RestaurantCheckoutDialogProps) {
  const { t } = useTranslation();
  const [cart, setCart] = useAtom(cartAtom);
  const [currency] = useAtom(currencyAtom);
  const { currentShop } = useShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTable, setSelectedTable] = useState<Table | null>(preSelectedTable || null);
  const [orderType, setOrderType] = useState<"dine_in" | "takeout" | "delivery">("dine_in");
  const [guestCount, setGuestCount] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"order_details" | "payment">("order_details");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTable(preSelectedTable || null);
      setOrderType("dine_in");
      setGuestCount(1);
      setSpecialInstructions("");
      setStep("order_details");
      setPaymentMethod('cash');
    }
  }, [isOpen, preSelectedTable]);

  const total = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

  const sendToKitchenMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 Starting order creation...');
      console.log('Current shop:', currentShop);
      console.log('Selected table:', selectedTable);
      console.log('Order type:', orderType);
      console.log('Cart:', cart);
      
      if (!currentShop?.id) throw new Error(t('common.shop.noAssigned'));
      if (!selectedTable && orderType === "dine_in") {
        throw new Error(t('restaurant.selectTableRequired'));
      }

      // If we're editing an existing order, add items to it instead of creating new order
      console.log('🔍 Checking if editing existing order:', editingOrder);
      if (editingOrder) {
        const response = await fetch(`/api/shops/${currentShop.id}/orders/${editingOrder.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            items: cart.map(item => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.price.toString()
            }))
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || t('restaurant.orderUpdateFailed'));
        }

        return response.json();
      } else {
        console.log('📝 Creating new order...');
        // Check if there's an existing pending order for this table
        console.log('🔍 Checking for existing pending orders for table:', selectedTable?.id);
        if (selectedTable) {
          const existingOrderResponse = await fetch(`/api/shops/${currentShop.id}/orders?tableId=${selectedTable.id}&status=pending`, {
            credentials: "include"
          });
          console.log('📥 Existing order check response:', existingOrderResponse.status);
          if (existingOrderResponse.ok) {
            const existingOrders = await existingOrderResponse.json();
            console.log('🔍 Found existing orders:', existingOrders.length);
            if (existingOrders.length > 0) {
              // Add to existing order
              const existingOrder = existingOrders[0];
              const response = await fetch(`/api/shops/${currentShop.id}/orders/${existingOrder.id}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  items: cart.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price.toString()
                  }))
                }),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || t('restaurant.orderUpdateFailed'));
              }

              return response.json();
            }
          }
        }

        // Create new order if no existing order found
        console.log('✨ Creating brand new order...');
        const orderData = {
          order: {
            total: total.toString(),
            status: "pending", // Kitchen orders start as pending
            orderType,
            tableId: selectedTable?.id,
            guestCount: orderType === "dine_in" ? guestCount : undefined,
            specialInstructions: specialInstructions.trim() || undefined,
            shopId: currentShop.id
          },
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price.toString()
          }))
        };

        console.log('📤 Sending order to:', `/api/shops/${currentShop.id}/orders/dine-in`);
        console.log('📦 Order data:', orderData);
        
        const response = await fetch(`/api/shops/${currentShop.id}/orders/dine-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(orderData),
        });

        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
          const error = await response.json();
          console.error('❌ Order creation failed:', error);
          throw new Error(error.error || t('restaurant.orderSendFailed'));
        }

        const result = await response.json();
        console.log('✅ Order created successfully:', result);
        return result;
      }
    },
    onSuccess: () => {
      toast({
        title: editingOrder ? t('restaurant.itemsAddedToOrder') : t('restaurant.orderPlaced'),
        description: editingOrder ? t('restaurant.itemsAddedSuccess') : t('restaurant.orderPlacedSuccess')
      });
      setCart([]);
      onOpenChange(false);
      onOrderPlaced?.(); // Close parent dialog
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop.id}/orders`] });
      queryClient.invalidateQueries({ queryKey: [`kitchen-tickets`, currentShop.id] });
      if (selectedTable) {
        queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop.id}/tables`] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('restaurant.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const payOrderMutation = useMutation({
    mutationFn: async () => {
      if (!currentShop?.id) throw new Error(t('common.shop.noAssigned'));
      if (!selectedTable && orderType === "dine_in") {
        throw new Error(t('restaurant.selectTableRequired'));
      }

      const orderData = {
        order: {
          total: total.toString(),
          status: "completed", // Paid orders are completed
          orderType,
          tableId: selectedTable?.id,
          guestCount: orderType === "dine_in" ? guestCount : undefined,
          specialInstructions: specialInstructions.trim() || undefined,
          paymentMethod,
          shopId: currentShop.id
        },
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price.toString()
        }))
      };

      const response = await fetch(`/api/shops/${currentShop.id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('checkout.orderProcessingFailed'));
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('checkout.orderCompleted'),
        description: t('checkout.thankYou')
      });
      setCart([]);
      onOpenChange(false);
      onOrderPlaced?.(); // Close parent dialog
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop.id}/orders`] });
      queryClient.invalidateQueries({ queryKey: [`kitchen-tickets`, currentShop.id] });
      if (selectedTable) {
        queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop.id}/tables`] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('checkout.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canProceed = cart.length > 0 && (orderType !== "dine_in" || selectedTable);

  if (step === "payment") {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('checkout.title')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {/* Payment Method Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setPaymentMethod('card')}
                  disabled={total <= 0}
                >
                  <CreditCard className="h-4 w-4" />
                  {t('checkout.card')}
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className="h-4 w-4" />
                  {t('checkout.cash')}
                </Button>
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between">
                    <span>
                      {item.product.name} x {item.quantity}
                    </span>
                    <span>
                      {formatCurrency(Number(item.product.price) * item.quantity, currency)}
                    </span>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between font-medium">
                    <span>{t('common.total')}</span>
                    <span>{formatCurrency(total, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("order_details")}
                >
                  {t('common.back')}
                </Button>
                <Button
                  className="flex-1 bg-primary hover:opacity-90 transition-opacity text-white"
                  onClick={() => payOrderMutation.mutate()}
                  disabled={payOrderMutation.isPending || cart.length === 0}
                >
                  {payOrderMutation.isPending ? (
                    t('checkout.processing')
                  ) : (
                    `${t('checkout.completeCashPayment')} (${formatCurrency(total, currency)})`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] h-fit max-h-[80vh] overflow-y-auto p-4 !min-h-0 !gap-2"
        style={{ height: 'auto', minHeight: '0', gap: '8px' }}
      >
        <DialogHeader>
          <DialogTitle>{editingOrder ? t('restaurant.editOrder') : t('restaurant.newOrder')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
            {/* Order Type */}
            <div className="space-y-2">
              <Label>{t('restaurant.orderType')}</Label>
              <OrderTypeSelector value={orderType} onValueChange={setOrderType} />
            </div>

            {/* Table Selection (only for dine-in) */}
            {orderType === "dine_in" && (
              <div className="space-y-2">
                <Label>{t('restaurant.table')}</Label>
                <TableSelector 
                  selectedTable={selectedTable} 
                  onTableSelect={setSelectedTable}
                  allowOccupiedTables={true}
                />
              </div>
            )}

            {/* Guest Count (only for dine-in) */}
            {orderType === "dine_in" && (
              <div className="space-y-2">
                <Label>{t('restaurant.guestCount')}</Label>
                <GuestCounter value={guestCount} onChange={setGuestCount} />
              </div>
            )}

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label>{t('restaurant.specialInstructions')}</Label>
              <Textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder={t('restaurant.specialInstructionsPlaceholder')}
                rows={2}
              />
            </div>

            {/* Order Summary */}
            <div className="space-y-2">
              <Separator />
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} x {item.quantity}
                    </span>
                    <span>
                      {formatCurrency(Number(item.product.price) * item.quantity, currency)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex justify-between font-medium">
                    <span>{t('common.total')}</span>
                    <span>{formatCurrency(total, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-primary hover:opacity-90 text-white gap-2"
                onClick={() => sendToKitchenMutation.mutate()}
                disabled={!canProceed || sendToKitchenMutation.isPending}
              >
                <UtensilsCrossed className="h-4 w-4" />
                {sendToKitchenMutation.isPending ? (
                  t('restaurant.placingOrder')
                ) : (
                  `${t('restaurant.placeOrder')} (${formatCurrency(total, currency)})`
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setStep("payment")}
                disabled={!canProceed}
              >
                <Receipt className="h-4 w-4" />
                {t('restaurant.payNow')}
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}