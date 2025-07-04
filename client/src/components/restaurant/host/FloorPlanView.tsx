import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit3, Grid, Plus, UtensilsCrossed, DollarSign, ShoppingCart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import { useToast } from "@/hooks/use-toast";
import AddTableDialog from "./AddTableDialog";
import EditTableDialog from "./EditTableDialog";
import RestaurantPaymentDialog from "@/components/restaurant/pos/RestaurantPaymentDialog";
import ProductGrid from "@/components/pos/ProductGrid";
import RestaurantCartPanel from "@/components/restaurant/pos/RestaurantCartPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Table, Order, OrderItem } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

interface TableWithOrder extends Table {
  currentOrder?: OrderWithItems;
}

type LayoutMode = 'view' | 'edit' | 'arrange';

export default function FloorPlanView() {
  const { t } = useTranslation();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('view');
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [showEditTable, setShowEditTable] = useState(false);
  
  // Order and payment dialogs
  const [newOrderDialogOpen, setNewOrderDialogOpen] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<OrderWithItems | null>(null);
  const [selectedTableForPayment, setSelectedTableForPayment] = useState<string>("");
  
  // Choice dialog for occupied tables
  const [tableChoiceDialogOpen, setTableChoiceDialogOpen] = useState(false);
  const [selectedOccupiedTable, setSelectedOccupiedTable] = useState<TableWithOrder | null>(null);
  
  const { currentShop } = useShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["tables", currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/tables`);
      if (!response.ok) throw new Error(t('restaurant.fetchTablesError'));
      return response.json();
    },
    enabled: !!currentShop?.id,
  });

  // Fetch orders for the current shop
  const { data: orders = [] } = useQuery({
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

  const updateTablePositionMutation = useMutation({
    mutationFn: async ({ tableId, xPosition, yPosition }: { tableId: number; xPosition: number; yPosition: number }) => {
      if (!currentShop?.id) throw new Error(t('common.shop.noAssigned'));
      
      console.log('Updating table position:', { tableId, xPosition, yPosition });
      
      const response = await fetch(`/api/shops/${currentShop.id}/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          xPosition: Math.round(xPosition), 
          yPosition: Math.round(yPosition) 
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('PATCH error:', response.status, errorData);
        throw new Error(t('restaurant.updateTablePositionError'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables", currentShop?.id] });
      toast({
        title: t('restaurant.tableUpdated'),
        description: t('restaurant.tableStatusUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('restaurant.updateTablePositionError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enhanced status colors with better visual feedback
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200";
      case "occupied":
        return "bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-lg shadow-red-200 ring-2 ring-red-300";
      case "reserved":
        return "bg-blue-500 hover:bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 ring-2 ring-blue-300";
      case "cleaning":
        return "bg-amber-500 hover:bg-amber-600 text-black border-amber-600 shadow-lg shadow-amber-200";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white border-gray-600 shadow-lg";
    }
  };

  // Mode handlers
  const handleModeChange = useCallback((mode: LayoutMode) => {
    console.log('Changing layout mode from', layoutMode, 'to', mode);
    setLayoutMode(mode);
    setSelectedTable(null);
    toast({
      title: `${mode === 'view' ? 'View' : mode === 'edit' ? 'Edit' : 'Arrange'} Mode`,
      description: `Switched to ${mode} mode`,
    });
  }, [layoutMode, toast]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, table: Table) => {
    if (layoutMode !== 'arrange') {
      e.preventDefault();
      return;
    }
    console.log('Drag start:', table.number);
    setDraggedTable(table);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for some browsers
  }, [layoutMode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (layoutMode !== 'arrange') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [layoutMode]);

  // Helper function to check if a position has collision
  const hasCollisionAt = useCallback((x: number, y: number, excludeTableId: number) => {
    const tableWidth = 70;
    const tableHeight = 70;
    const buffer = 8;
    
    return tablesWithOrders.some((table: TableWithOrder) => {
      if (table.id === excludeTableId) return false;
      const tableX = table.xPosition || (40 + (tablesWithOrders.indexOf(table) % 7) * 90);
      const tableY = table.yPosition || (40 + Math.floor(tablesWithOrders.indexOf(table) / 7) * 90);
      
      return (
        x < tableX + tableWidth + buffer &&
        x + tableWidth + buffer > tableX &&
        y < tableY + tableHeight + buffer &&
        y + tableHeight + buffer > tableY
      );
    });
  }, [tablesWithOrders]);

  // Helper function to find the nearest available position
  const findNearestAvailablePosition = useCallback((targetX: number, targetY: number, excludeTableId: number, canvasRect: DOMRect) => {
    const tableWidth = 70;
    const tableHeight = 70;
    const padding = 20;
    const gridSize = 20;
    const maxSearchRadius = 200; // Maximum distance to search
    
    // First check if the target position is available
    if (!hasCollisionAt(targetX, targetY, excludeTableId)) {
      return { x: targetX, y: targetY };
    }
    
    // Search in expanding circles around the target position
    for (let radius = gridSize; radius <= maxSearchRadius; radius += gridSize) {
      // Check positions around the target in a spiral pattern
      const positions = [
        // Prioritize positions to the right and below (common reading pattern)
        { x: targetX + radius, y: targetY }, // Right
        { x: targetX, y: targetY + radius }, // Below
        { x: targetX - radius, y: targetY }, // Left
        { x: targetX, y: targetY - radius }, // Above
        { x: targetX + radius, y: targetY + radius }, // Bottom-right
        { x: targetX - radius, y: targetY + radius }, // Bottom-left
        { x: targetX + radius, y: targetY - radius }, // Top-right
        { x: targetX - radius, y: targetY - radius }, // Top-left
      ];
      
      for (const pos of positions) {
        // Snap to grid
        const snappedX = Math.round(pos.x / gridSize) * gridSize;
        const snappedY = Math.round(pos.y / gridSize) * gridSize;
        
        // Check boundaries
        const boundedX = Math.max(padding, Math.min(canvasRect.width - tableWidth - padding, snappedX));
        const boundedY = Math.max(padding, Math.min(canvasRect.height - tableHeight - padding, snappedY));
        
        // Check if this position is available
        if (!hasCollisionAt(boundedX, boundedY, excludeTableId)) {
          return { x: boundedX, y: boundedY };
        }
      }
    }
    
    // If no position found within search radius, return the original target (fallback)
    return { x: targetX, y: targetY };
  }, [hasCollisionAt]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTable || layoutMode !== 'arrange') {
      setDraggedTable(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const tableWidth = 70;
    const tableHeight = 70;
    const padding = 20;
    const gridSize = 20; // Size of the dot grid
    
    // Calculate raw position
    const rawX = e.clientX - rect.left - tableWidth / 2;
    const rawY = e.clientY - rect.top - tableHeight / 2;
    
    // Snap to grid (dot positions)
    const snappedX = Math.round(rawX / gridSize) * gridSize;
    const snappedY = Math.round(rawY / gridSize) * gridSize;
    
    // Apply boundaries with tighter constraints
    const targetX = Math.max(padding, Math.min(rect.width - tableWidth - padding, snappedX));
    const targetY = Math.max(padding, Math.min(rect.height - tableHeight - padding, snappedY));

    // Find the best available position (either the target or nearest alternative)
    const bestPosition = findNearestAvailablePosition(targetX, targetY, draggedTable.id, rect);

    // Show appropriate feedback
    if (bestPosition.x !== targetX || bestPosition.y !== targetY) {
      toast({
        title: t('restaurant.tableRepositioned'),
        description: t('restaurant.tableRepositionedMessage'),
        duration: 2000,
      });
    }

    updateTablePositionMutation.mutate({
      tableId: draggedTable.id,
      xPosition: bestPosition.x,
      yPosition: bestPosition.y
    });

    setDraggedTable(null);
  }, [draggedTable, layoutMode, findNearestAvailablePosition, updateTablePositionMutation, toast, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">{t('restaurant.loadingFloorPlan')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      
      {/* Simple Control Bar */}
      <div className="flex items-center justify-between p-3 bg-background border-b">
        <div className="flex items-center gap-2">
          <Badge variant={layoutMode === 'view' ? 'secondary' : 'default'} className="text-xs">
            {layoutMode === 'view' ? 'View' : layoutMode === 'edit' ? 'Edit' : 'Arrange'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {tablesWithOrders.length} tables • {tablesWithOrders.reduce((sum: number, table: TableWithOrder) => sum + table.capacity, 0)} seats
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Mode Selector */}
          <Button
            variant={layoutMode === 'view' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('view')}
            className="h-8 px-3 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            variant={layoutMode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('edit')}
            className="h-8 px-3 text-xs"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            variant={layoutMode === 'arrange' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('arrange')}
            className="h-8 px-3 text-xs"
          >
            <Grid className="h-3 w-3 mr-1" />
            Arrange
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddTable(true)}
            className="h-8 px-3 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Floor Plan Canvas */}
      <div className="flex-1 relative">
        <div 
          className="absolute inset-0 bg-gray-100 border-2 border-dashed border-gray-300"
          style={{
            backgroundImage: `radial-gradient(circle, #9ca3af 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {tables.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <h3 className="text-sm font-medium text-gray-600 mb-1">No tables configured</h3>
                <p className="text-xs text-gray-500">Add tables to start designing your floor plan</p>
              </div>
            </div>
          ) : (
            tablesWithOrders.map((table: TableWithOrder, index: number) => {
              const defaultX = 40 + (index % 7) * 90;
              const defaultY = 40 + Math.floor(index / 7) * 90;
              
              // Determine effective status - show occupied if there's an active order
              const effectiveStatus = table.currentOrder ? 'occupied' : table.status;
              
              return (
                <div
                  key={table.id}
                  className={`absolute transition-all duration-200 ${
                    layoutMode === 'arrange' ? 'cursor-move' : 
                    layoutMode === 'edit' ? 'cursor-pointer' : 
                    layoutMode === 'view' ? 'cursor-pointer' : 'cursor-default'
                  } ${selectedTable?.id === table.id ? 'ring-3 ring-blue-400 ring-offset-1' : ''}`}
                  style={{
                    left: table.xPosition ?? defaultX,
                    top: table.yPosition ?? defaultY,
                    width: '70px',
                    height: '70px',
                    zIndex: draggedTable?.id === table.id ? 50 : selectedTable?.id === table.id ? 20 : 10
                  }}
                  draggable={layoutMode === 'arrange'}
                  onDragStart={(e) => handleDragStart(e, table)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (layoutMode === 'edit') {
                      console.log('Table clicked in edit mode:', table.number);
                      setSelectedTable(table);
                      setShowEditTable(true);
                    } else if (layoutMode === 'view') {
                      const tableWithOrder = tablesWithOrders.find(t => t.id === table.id);
                      if (tableWithOrder?.currentOrder) {
                        // Table has an active order - show choice dialog
                        setSelectedOccupiedTable(tableWithOrder);
                        setTableChoiceDialogOpen(true);
                      } else {
                        // Table is empty - open order creation dialog
                        setSelectedTableForOrder(table);
                        setEditingOrder(null);
                        setNewOrderDialogOpen(true);
                      }
                    }
                  }}
                >
                  <Card className={`w-full h-full ${getStatusColor(effectiveStatus)} transition-all ${
                    layoutMode === 'arrange' ? 'hover:scale-105 cursor-move' : 
                    layoutMode === 'edit' ? 'hover:scale-102 cursor-pointer' : 
                    layoutMode === 'view' ? 'hover:scale-102 cursor-pointer' : ''
                  } border-2 ${draggedTable?.id === table.id ? 'opacity-50 scale-105' : ''} rounded-lg`}>
                    <CardContent className="p-1.5 h-full flex flex-col justify-center items-center text-center relative overflow-hidden">
                      <div className="font-bold text-sm leading-none truncate w-full">{table.number}</div>
                      <div className="text-xs opacity-90 leading-none mt-0.5">{table.capacity} seats</div>
                      <div className="absolute top-0.5 right-0.5">
                        <div className={`w-3 h-3 rounded-full ${
                          effectiveStatus === 'available' ? 'bg-emerald-300 ring-2 ring-emerald-500' :
                          effectiveStatus === 'occupied' ? 'bg-red-300 ring-2 ring-red-500 animate-pulse' :
                          effectiveStatus === 'reserved' ? 'bg-blue-300 ring-2 ring-blue-500' :
                          'bg-amber-300 ring-2 ring-amber-500'
                        } ring-white shadow-sm`}></div>
                      </div>
                      {table.section && (
                        <div className="text-xs opacity-75 leading-none mt-0.5 truncate w-full px-1" title={table.section}>
                          {table.section}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-muted border-t text-xs text-muted-foreground">
        <div className="flex gap-2">
          <span>Mode: {layoutMode}</span>
          {layoutMode === 'arrange' && <span>Drag tables to rearrange</span>}
          {layoutMode === 'edit' && <span>Click tables to select</span>}
          {layoutMode === 'view' && <span>Click tables to add order or process payment</span>}
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
            Available ({tablesWithOrders.filter(t => !t.currentOrder && t.status === 'available').length})
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm ring-1 ring-red-300"></div>
            Occupied ({tablesWithOrders.filter(t => t.currentOrder || t.status === 'occupied').length})
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm ring-1 ring-blue-300"></div>
            Reserved ({tablesWithOrders.filter(t => !t.currentOrder && t.status === 'reserved').length})
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></div>
            Cleaning ({tablesWithOrders.filter(t => !t.currentOrder && t.status === 'cleaning').length})
          </span>
        </div>
      </div>

      <AddTableDialog 
        isOpen={showAddTable}
        onOpenChange={setShowAddTable}
      />
      
      <EditTableDialog 
        isOpen={showEditTable}
        onOpenChange={setShowEditTable}
        table={selectedTable}
      />
      
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

      {/* Choice Dialog for Occupied Tables */}
      <Dialog open={tableChoiceDialogOpen} onOpenChange={setTableChoiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6" />
              Table {selectedOccupiedTable?.number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This table has an active order. What would you like to do?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  if (selectedOccupiedTable?.currentOrder) {
                    setSelectedOrderForPayment(selectedOccupiedTable.currentOrder);
                    setSelectedTableForPayment(selectedOccupiedTable.number);
                    setPaymentDialogOpen(true);
                  }
                  setTableChoiceDialogOpen(false);
                }}
                className="flex items-center justify-center gap-2 h-20 bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">Process Payment</div>
                  <div className="text-xs opacity-90">Complete the order</div>
                </div>
              </Button>
              <Button
                onClick={() => {
                  if (selectedOccupiedTable?.currentOrder) {
                    setEditingOrder(selectedOccupiedTable.currentOrder);
                    setSelectedTableForOrder(selectedOccupiedTable);
                    setNewOrderDialogOpen(true);
                  }
                  setTableChoiceDialogOpen(false);
                }}
                className="flex items-center justify-center gap-2 h-20 bg-blue-600 hover:bg-blue-700"
              >
                <ShoppingCart className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">Add More Items</div>
                  <div className="text-xs opacity-90">Expand the order</div>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableChoiceDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}