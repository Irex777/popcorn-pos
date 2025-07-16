import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Users, DollarSign, Plus, UtensilsCrossed, Eye, MapPin, Calendar, Settings, UserPlus, ClipboardList, Utensils, ShoppingBag, Truck } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/settings";
import { currencyAtom } from "@/lib/settings";
import { useAtom } from "jotai";
import type { Order, Table, OrderItem } from "@shared/schema";
import RestaurantPaymentDialog from "@/components/restaurant/pos/RestaurantPaymentDialog";
import ProductGrid from "@/components/pos/ProductGrid";
import RestaurantCartPanel from "@/components/restaurant/pos/RestaurantCartPanel";
import FloorPlanView from "@/components/restaurant/host/FloorPlanView";
import ReservationList from "@/components/restaurant/host/ReservationList";
import AddReservationDialog from "@/components/restaurant/host/AddReservationDialog";
import AddTableDialog from "@/components/restaurant/host/AddTableDialog";
import EnhancedWaitList from "@/components/restaurant/host/EnhancedWaitList";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

interface TableWithOrder extends Table {
  currentOrder?: OrderWithItems;
}

export default function Server() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("my-tables");
  const { currentShop, isRestaurantMode } = useShop();
  const { toast } = useToast();
  const [currency] = useAtom(currencyAtom);
  const queryClient = useQueryClient();
  
  // Dialog states
  const [newOrderDialogOpen, setNewOrderDialogOpen] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  const [showAddReservation, setShowAddReservation] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderWithItems | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);

  // Fetch tables for the current shop
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: [`/api/shops/${currentShop?.id}/tables`],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/tables`);
      if (!response.ok) throw new Error('Failed to fetch tables');
      return response.json();
    },
    enabled: !!currentShop?.id,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Fetch orders for the current shop
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: [`/api/shops/${currentShop?.id}/orders`],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/orders`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!currentShop?.id,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Combine tables with their current orders
  const tablesWithOrders: TableWithOrder[] = tables.map((table: Table) => {
    const currentOrder = orders.find((order: OrderWithItems) => 
      order.tableId === table.id && 
      order.status !== 'completed' && 
      order.status !== 'cancelled'
    );
    return { ...table, currentOrder };
  });

  // Filter to show tables assigned to current server (show occupied tables + cleaning tables + reserved tables)
  const myTables = tablesWithOrders.filter((table: TableWithOrder) => 
    table.status === 'occupied' || 
    table.status === 'cleaning' || 
    table.status === 'reserved' || 
    table.currentOrder !== undefined
  );

  // Calculate stats
  const activeOrders = orders.filter((order: Order) => 
    order.status !== 'completed' && order.status !== 'cancelled'
  );
  
  const todaysSales = orders
    .filter((order: Order) => {
      const orderDate = new Date(order.createdAt!);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString() && 
             order.status === 'completed';
    })
    .reduce((sum: number, order: Order) => sum + Number(order.total), 0);

  const guestsServed = orders
    .filter((order: Order) => {
      const orderDate = new Date(order.createdAt!);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString() && 
             order.status === 'completed';
    })
    .reduce((sum: number, order: Order) => sum + (order.guestCount || 1), 0);

  // Update table status mutation
  const updateTableStatusMutation = useMutation({
    mutationFn: async ({ tableId, status }: { tableId: number; status: string }) => {
      if (!currentShop?.id) throw new Error("No shop selected");
      
      const response = await fetch(`/api/shops/${currentShop.id}/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update table status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop?.id}/tables`] });
      toast({
        title: t('restaurant.tableUpdated'),
        description: t('restaurant.tableStatusUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.updateFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "served":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case t('restaurant.noOrder'):
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderStatusDisplay = (order?: OrderWithItems) => {
    if (!order) return t('restaurant.noOrder');
    
    // If order is already completed, show that
    if (order.status === "completed") return "completed";
    
    // Check if all items are served
    const allItemsServed = order.items.every(item => item.status === "served");
    if (allItemsServed && order.status !== "completed") return "ready";
    
    // Check if any items are being prepared
    const hasPreparingItems = order.items.some(item => item.status === "preparing");
    if (hasPreparingItems) return "preparing";
    
    // Check if any items are ready to serve
    const hasReadyItems = order.items.some(item => item.status === "ready");
    if (hasReadyItems) return "ready";
    
    // Check if order is new/pending
    if (order.status === "pending") return "pending";
    
    return order.status;
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const orderTime = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleNewOrder = () => {
    setNewOrderDialogOpen(true);
    setSelectedTableForOrder(null);
    setEditingOrder(null);
  };

  const handleTakeOrder = (tableId: number) => {
    // Find the table and open order dialog
    const table = tables.find((t: Table) => t.id === tableId);
    setSelectedTableForOrder(table || null);
    setEditingOrder(null);
    setNewOrderDialogOpen(true);
  };

  const handleViewOrder = (orderId: number) => {
    const order = orders.find((o: OrderWithItems) => o.id === orderId);
    if (order) {
      setSelectedOrderDetails(order);
      setOrderDetailsDialogOpen(true);
    }
  };

  const handleAddItemsToOrder = (orderId: number) => {
    const order = orders.find((o: OrderWithItems) => o.id === orderId);
    if (order) {
      setEditingOrder(order);
      const table = tables.find((t: Table) => t.id === order.tableId);
      setSelectedTableForOrder(table || null);
      setNewOrderDialogOpen(true);
    }
  };

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<OrderWithItems | null>(null);
  const [selectedTableForPayment, setSelectedTableForPayment] = useState<string>("");

  const handleProcessPayment = (table: TableWithOrder) => {
    if (table.currentOrder) {
      setSelectedOrderForPayment(table.currentOrder);
      setSelectedTableForPayment(table.number);
      setPaymentDialogOpen(true);
    }
  };

  const handleTableStatusChange = (tableId: number, newStatus: string) => {
    updateTableStatusMutation.mutate({ tableId, status: newStatus });
  };

  // Show message for shop mode users
  if (!isRestaurantMode) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-orange-800 dark:text-orange-200">
                <ShoppingBag className="h-6 w-6" />
                Shop Mode Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <UtensilsCrossed className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Server Station Not Available
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-300">
                    The server station is designed for restaurant operations with table service. In shop mode, orders are processed directly at the point of sale.
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm text-orange-600 dark:text-orange-300">
                <p>Switch to Restaurant Mode in Settings to access the server station and table management.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('restaurant.serverStation')}</h1>
          <p className="text-muted-foreground">{t('restaurant.manageOrders')}</p>
          {currentShop ? (
            <p className="text-sm text-muted-foreground mt-1">
              {t('restaurant.currentShop', { shopName: currentShop.name })}
            </p>
          ) : (
            <p className="text-sm text-orange-600 mt-1">{t('restaurant.selectShopToViewData')}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleNewOrder}
            disabled={!currentShop}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('restaurant.newOrder')}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">{t('restaurant.tablesWithOrders')}</p>
                <p className="text-2xl font-bold">
                  {tablesLoading ? "..." : myTables.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">{t('restaurant.activeOrders')}</p>
                <p className="text-2xl font-bold">
                  {ordersLoading ? "..." : activeOrders.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">{t('restaurant.todaysSales')}</p>
                <p className="text-2xl font-bold">
                  {ordersLoading ? "..." : formatCurrency(todaysSales, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">{t('restaurant.guestsServed')}</p>
                <p className="text-2xl font-bold">
                  {ordersLoading ? "..." : guestsServed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="my-tables">{t('restaurant.activeOrders')}</TabsTrigger>
          <TabsTrigger value="floor-plan">{t('restaurant.floorPlan')}</TabsTrigger>
          <TabsTrigger value="reservations">{t('restaurant.reservations')}</TabsTrigger>
          <TabsTrigger value="wait-list">{t('restaurant.waitList')}</TabsTrigger>
          <TabsTrigger value="menu">{t('restaurant.quickMenu')}</TabsTrigger>
        </TabsList>

        <TabsContent value="my-tables" className="space-y-4">
          <div className="grid gap-4">
            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">{t('common.loading')}...</div>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-8">
                <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('restaurant.noActiveOrders')}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('restaurant.waitingForNewOrders')}
                </p>
              </div>
            ) : (
              activeOrders.map((order) => {
                const orderTable = tables.find(t => t.id === order.tableId);
                const orderStatus = getOrderStatusDisplay(order);
                const orderTotal = Number(order.total);
                const guestCount = order.guestCount || 1;
                const orderTime = order.createdAt;

                return (
                  <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              {order.orderType === 'dine_in' ? (
                                <Utensils className="h-5 w-5 text-blue-600" />
                              ) : order.orderType === 'takeout' ? (
                                <ShoppingBag className="h-5 w-5 text-orange-600" />
                              ) : (
                                <Truck className="h-5 w-5 text-green-600" />
                              )}
                              <div className="text-2xl font-bold">
                                {orderTable ? `${t('restaurant.table')} ${orderTable.number}` : `${t('common.order')} #${order.id}`}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {guestCount} {guestCount === 1 ? t('restaurant.guest') : t('restaurant.guests')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.orderType.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <Badge className={getStatusColor(orderStatus)}>
                              {orderStatus}
                            </Badge>
                            {orderTime && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {t('restaurant.orderPlaced')} {getTimeAgo(orderTime)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {formatCurrency(orderTotal, currency)}
                          </div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {(orderStatus === "ready" || orderStatus === "pending" || orderStatus === "preparing") && (
                              <Button 
                                size="sm"
                                onClick={() => {
                                  setSelectedOrderForPayment(order);
                                  setSelectedTableForPayment(orderTable?.number || order.id.toString());
                                  setPaymentDialogOpen(true);
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                {t('restaurant.processPayment')}
                              </Button>
                            )}
                            {(orderStatus === "ready" || orderStatus === "pending" || orderStatus === "preparing") && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAddItemsToOrder(order.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                {t('restaurant.addItems')}
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewOrder(order.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {t('restaurant.viewOrder')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="floor-plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Restaurant Floor Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <FloorPlanView />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('restaurant.todaysReservations')}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowAddReservation(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Reservation
                  </Button>
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('restaurant.walkInGuest')}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReservationList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wait-list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Current Wait List
                </div>
                <Button size="sm" onClick={() => setShowAddReservation(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Wait List
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedWaitList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('restaurant.quickMenuAccess')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Quick access to menu items for taking orders
                </p>
                <Button 
                  onClick={handleNewOrder}
                  disabled={!currentShop}
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('restaurant.takeNewOrder')}
                </Button>
                {!currentShop && (
                  <p className="text-sm text-orange-600 mt-4">
                    Please select a shop to access the menu
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Order Dialog */}
      <Dialog open={newOrderDialogOpen} onOpenChange={setNewOrderDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] max-h-[95vh]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="h-6 w-6" />
                {editingOrder 
                  ? t('restaurant.addItemsToOrderWithId', { orderId: editingOrder.id, tableNumber: selectedTableForOrder?.number || editingOrder.tableId })
                  : selectedTableForOrder 
                    ? t('restaurant.takeOrderWithTable', { tableNumber: selectedTableForOrder.number, capacity: selectedTableForOrder.capacity })
                    : t('restaurant.newOrderSelectTable')
                }
              </div>
              {selectedTableForOrder && (
                <Badge variant="outline" className="text-sm">
                  {selectedTableForOrder.section || t('restaurant.mainArea')}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex h-[calc(100%-80px)] gap-6 pt-4">
            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{t('restaurant.menuItems')}</h3>
                  <div className="text-sm text-muted-foreground">
                    Click items to add to order
                  </div>
                </div>
                <ProductGrid />
              </div>
            </div>
            {/* Cart Panel */}
            <div className="w-[450px] border-l pl-6 flex flex-col">
              <RestaurantCartPanel 
                preSelectedTable={selectedTableForOrder} 
                editingOrder={editingOrder}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {selectedOrderForPayment && (
        <RestaurantPaymentDialog
          isOpen={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          order={selectedOrderForPayment}
          tableNumber={selectedTableForPayment}
        />
      )}

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsDialogOpen} onOpenChange={setOrderDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Order Details #{selectedOrderDetails?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedOrderDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('restaurant.table')}</p>
                  <p className="font-medium">
                    {selectedOrderDetails.tableId 
                      ? `${t('restaurant.table')} ${tables.find(t => t.id === selectedOrderDetails.tableId)?.number || selectedOrderDetails.tableId}`
                      : t('restaurant.takeoutDelivery')
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('restaurant.guests')}</p>
                  <p className="font-medium">{selectedOrderDetails.guestCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('restaurant.orderType')}</p>
                  <p className="font-medium capitalize">{selectedOrderDetails.orderType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('restaurant.status')}</p>
                  <Badge className={getStatusColor(selectedOrderDetails.status)}>
                    {selectedOrderDetails.status}
                  </Badge>
                </div>
              </div>
              
              {selectedOrderDetails.specialInstructions && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('restaurant.specialInstructions')}</p>
                  <p className="font-medium">{selectedOrderDetails.specialInstructions}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('restaurant.orderItems')}</p>
                <div className="space-y-2">
                  {selectedOrderDetails.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{item.quantity}x </span>
                        <span>{item.product?.name || 'Unknown Item'}</span>
                        {item.specialRequests && (
                          <p className="text-xs text-muted-foreground">{item.specialRequests}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <p className="text-sm font-medium">
                          {formatCurrency(Number(item.price) * item.quantity, currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>{t('common.total')}</span>
                  <span>{formatCurrency(Number(selectedOrderDetails.total), currency)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog */}
      <AddTableDialog 
        isOpen={showAddTable}
        onOpenChange={setShowAddTable}
      />

      {/* Add Reservation Dialog */}
      <AddReservationDialog 
        isOpen={showAddReservation}
        onOpenChange={setShowAddReservation}
      />
    </div>
  );
}