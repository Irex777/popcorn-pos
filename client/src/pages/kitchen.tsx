import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ChefHat, UtensilsCrossed, Timer } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import { motion } from "framer-motion";

export default function Kitchen() {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const queryClient = useQueryClient();

  const { data: allTickets = [], isLoading } = useQuery({
    queryKey: ["kitchen-tickets", currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/kitchen/tickets`);
      if (!response.ok) throw new Error("Failed to fetch kitchen tickets");
      return response.json();
    },
    enabled: !!currentShop?.id,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Filter to show only active tickets (not served/completed)
  const tickets = allTickets.filter((ticket: any) => 
    ticket.status !== 'served' && ticket.status !== 'completed'
  );

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: number; updates: Partial<any> }) => {
      if (!currentShop?.id) throw new Error("No shop selected");
      const response = await fetch(`/api/shops/${currentShop.id}/kitchen/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update ticket");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-tickets", currentShop?.id] });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "served":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const updateTicketStatus = (ticketId: number, status: string) => {
    updateTicketMutation.mutate({ ticketId, updates: { status } });
  };

  const markTicketComplete = (ticketId: number) => {
    updateTicketMutation.mutate({ ticketId, updates: { status: 'served' } });
  };

  const getElapsedTime = (createdAt: string | Date | null) => {
    if (!createdAt) return 0;
    const now = new Date();
    const created = new Date(createdAt);
    const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    return Math.max(0, diff);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-600" />
            Kitchen Display System
          </h1>
          <p className="text-muted-foreground">Manage order preparation and kitchen workflow</p>
        </div>
        <div className="flex items-center gap-4">
          <motion.div 
            className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg"
            animate={{ scale: tickets.length > 0 ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.5, repeat: tickets.length > 0 ? Infinity : 0, repeatDelay: 2 }}
          >
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{tickets.length} Active Orders</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Priority Legend */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
          <span className="text-sm">Urgent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
          <span className="text-sm">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
          <span className="text-sm">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
          <span className="text-sm">Low</span>
        </div>
      </div>

      {isLoading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-96"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <ChefHat className="h-12 w-12 text-orange-600" />
            </motion.div>
            <p className="mt-4 text-muted-foreground">Loading kitchen tickets...</p>
          </div>
        </motion.div>
      ) : tickets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-3">No Active Orders</h3>
              <p className="text-muted-foreground mb-4">
                All orders have been completed
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Waiting for new orders...</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((ticket: any) => {
            const elapsedTime = getElapsedTime(ticket.createdAt);
            
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`${getPriorityColor(ticket.priority)} border-2`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UtensilsCrossed className="h-5 w-5" />
                          Order #{ticket.ticketNumber}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {ticket.order?.orderType === "dine_in" && ticket.order?.tableId 
                            ? `Table ${ticket.order.tableId}` 
                            : ticket.order?.orderType || "Takeout"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <div className="flex items-center gap-1 mt-1">
                          <Timer className="h-4 w-4" />
                          <span className="text-sm font-medium">{elapsedTime}m</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">Items to prepare:</h4>
                      {ticket.items && ticket.items.length > 0 ? (
                        <div className="space-y-1">
                          {ticket.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center bg-muted/50 rounded p-2">
                              <span className="text-sm font-medium">
                                {item.quantity}x {item.product?.name || "Unknown Product"}
                              </span>
                              {item.specialRequests && (
                                <span className="text-xs text-orange-600 font-medium">
                                  Special: {item.specialRequests}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No items found</p>
                      )}
                    </div>

                    {/* Special Instructions */}
                    {ticket.order?.specialInstructions && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Special Instructions:
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          {ticket.order.specialInstructions}
                        </p>
                      </div>
                    )}

                    {/* Status and Actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      {ticket.status === "new" && (
                        <Button 
                          size="sm" 
                          onClick={() => updateTicketStatus(ticket.id, "preparing")}
                          disabled={updateTicketMutation.isPending}
                          className="flex-1"
                        >
                          Start Preparing
                        </Button>
                      )}
                      {ticket.status === "preparing" && (
                        <Button 
                          size="sm"
                          onClick={() => updateTicketStatus(ticket.id, "ready")}
                          disabled={updateTicketMutation.isPending}
                          className="flex-1"
                        >
                          Mark Ready
                        </Button>
                      )}
                      {ticket.status === "ready" && (
                        <Button 
                          size="sm" 
                          onClick={() => markTicketComplete(ticket.id)}
                          disabled={updateTicketMutation.isPending}
                          className="flex-1"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}