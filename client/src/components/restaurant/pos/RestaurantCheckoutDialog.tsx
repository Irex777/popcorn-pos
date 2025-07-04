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
}

export default function RestaurantCheckoutDialog({ isOpen, onOpenChange, preSelectedTable, editingOrder }: RestaurantCheckoutDialogProps) {
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
  const [detectedExistingOrder, setDetectedExistingOrder] = useState<OrderWithItems | null>(null);

  const total = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

  // Fetch orders to check for existing orders on selected table
  const { data: orders = [] } = useQuery({
    queryKey: [`/api/shops/${currentShop?.id}/orders`],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/orders`);
      if (!response.ok) throw new Error(t('restaurant.fetchOrdersError'));
      return response.json();
    },
    enabled: !!currentShop?.id,
  });

  // Effect to detect existing order when table is selected
  useEffect(() => {
    if (selectedTable && orders.length > 0 && !editingOrder) {
      const existingOrder = orders.find((order: OrderWithItems) => 
        order.tableId === selectedTable.id && 
        order.status !== 'completed' && 
        order.status !== 'cancelled'
      );
      setDetectedExistingOrder(existingOrder || null);
    } else {
      setDetectedExistingOrder(null);
    }
  }, [selectedTable, orders, editingOrder]);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!currentShop?.id) throw new Error(t('common.shop.noAssigned'));
      
      if (editingOrder || detectedExistingOrder) {
        // Adding items to existing order
        const targetOrder = editingOrder || detectedExistingOrder;
        const itemsData = {
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price.toString(),
            courseNumber: 1, // Default to first course
          }))
        };

        const endpoint = `/api/shops/${currentShop.id}/orders/${targetOrder!.id}/items`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemsData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || t('restaurant.addItemsError'));
        }

        return response.json();
      } else {
        // Creating new order
        const orderData = {
          order: {
            total: total.toString(),
            status: "pending",
            shopId: currentShop.id,
            tableId: selectedTable?.id,
            orderType,
            guestCount,
            specialInstructions: specialInstructions || undefined,
          },
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price.toString(),
            courseNumber: 1, // Default to first course
          }))
        };

        const endpoint = orderType === "dine_in" 
          ? `/api/shops/${currentShop.id}/orders/dine-in`
          : `/api/shops/${currentShop.id}/orders`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || t('restaurant.createOrderError'));
        }

        return response.json();
      }
    },
    onSuccess: () => {
      if (editingOrder || detectedExistingOrder) {
        const targetOrder = editingOrder || detectedExistingOrder;
        toast({
          title: t('restaurant.itemsAdded'),
          description: t('restaurant.itemsAddedSuccess', { orderId: targetOrder!.id }),
        });
      } else {
        toast({
          title: t('restaurant.orderCreated'),
          description: t('restaurant.orderCreatedSuccess', { orderType: t(`restaurant.${orderType}`) }),
        });
      }
      setCart([]);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-tickets"] });
      
      // Update table status if dine-in
      if (orderType === "dine_in" && selectedTable) {
        queryClient.invalidateQueries({ queryKey: ["tables"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: (editingOrder || detectedExistingOrder) ? t('restaurant.addItemsError') : t('restaurant.orderFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitOrder = async () => {
    if (!editingOrder && !detectedExistingOrder && orderType === "dine_in" && !selectedTable) {
      toast({
        title: t('restaurant.tableRequired'),
        description: t('restaurant.tableRequiredDescription'),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await createOrderMutation.mutateAsync();
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedTable(preSelectedTable || null);
    setOrderType("dine_in");
    setGuestCount(1);
    setSpecialInstructions("");
    setDetectedExistingOrder(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingOrder 
              ? `${t('restaurant.addItemsToOrder')} #${editingOrder.id}` 
              : detectedExistingOrder 
                ? `${t('restaurant.addItemsToOrder')} #${detectedExistingOrder.id}`
                : t('restaurant.restaurantOrder')
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {detectedExistingOrder && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="font-medium">{t('restaurant.existingOrderDetected')}</div>
              </div>
              <div className="text-sm text-orange-700 mt-1">
                {t('restaurant.existingOrderDescription', { tableNumber: selectedTable?.number, orderId: detectedExistingOrder.id })}
              </div>
            </div>
          )}
          
          {!editingOrder && !detectedExistingOrder && (
            <>
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
                    allowOccupiedTables={!editingOrder}
                  />
                </div>
              )}

              {/* Guest Count */}
              <GuestCounter value={guestCount} onChange={setGuestCount} />
            </>
          )}

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">{t('restaurant.specialInstructionsOptional')}</Label>
            <Textarea
              id="instructions"
              placeholder={t('restaurant.specialInstructionsPlaceholder')}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <h3 className="font-semibold">{t('restaurant.orderSummary')}</h3>
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.product.name}</span>
                <span>{formatCurrency(Number(item.product.price) * item.quantity, currency)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>{t('common.total')}</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSubmitOrder}
              disabled={isProcessing || cart.length === 0}
              className="flex-1"
            >
              {isProcessing 
                ? t('restaurant.processing') 
                : (editingOrder || detectedExistingOrder) 
                  ? t('restaurant.addItemsToOrder')
                  : t('restaurant.sendToKitchen')
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}