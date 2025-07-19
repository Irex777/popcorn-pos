import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { type Order } from "@shared/schema";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Download, Search, Trash2, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { ExportButtons } from "@/components/ui/export-buttons";
import { useShop } from "@/lib/shop-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

interface OrderWithId extends Order {
  id: number;
  items: any[];
}

interface SummaryStats {
  totalOrders: number;
  totalRevenue: number;
}

export default function History() {
  const { t } = useTranslation();
  const [currency] = useAtom(currencyAtom);
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const { currentShop } = useShop();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery<OrderWithId[]>({
    queryKey: [`/api/shops/${currentShop?.id}/orders`],
    enabled: !!currentShop,
    staleTime: 0,  // Always fetch fresh data
    gcTime: 0      // Don't cache the data
  });

  const deleteMutation = useMutation({
    mutationFn: async (orderId: number) => {
      if (!currentShop) throw new Error("No shop selected");
      const response = await apiRequest(
        'DELETE',
        `api/shops/${currentShop.id}/orders/${orderId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('history.deleteError'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${currentShop?.id}/orders`] });
      toast({
        title: t('history.orderDeleted'),
        description: t('history.orderDeleteSuccess')
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(current =>
      current.includes(orderId)
        ? current.filter(id => id !== orderId)
        : [...current, orderId]
    );
  };

  const generatePDF = (order: OrderWithId) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Receipt', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Order #${order.id}`, 20, 40);
    doc.text(`Date: ${format(new Date(order.createdAt!), 'MMMM d, yyyy h:mm a')}`, 20, 50);
    doc.text(`Status: ${t(`history.status.${order.status.toLowerCase()}`)}`, 20, 60);
    
    // Items table
    const tableData = order.items.map(item => [
      item.quantity,
      item.product?.name || t('history.unknownProduct'),
      formatCurrency(Number(item.price), currency)
    ]);
    
    autoTable(doc, {
      startY: 70,
      head: [['Qty', 'Item', 'Price']],
      body: tableData,
    });
    
    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 70;
    doc.text(`Total: ${formatCurrency(Number(order.total), currency)}`, 20, finalY + 20);
    
    // Save PDF
    doc.save(`order-${order.id}-receipt.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const calculateStats = (orders: OrderWithId[]): SummaryStats => {
    return orders.reduce((acc, order) => ({
      totalOrders: acc.totalOrders + 1,
      totalRevenue: acc.totalRevenue + Number(order.total)
    }), { totalOrders: 0, totalRevenue: 0 });
  };

  const prepareExportData = () => {
    if (!orders) return [];

    return orders.map(order => ({
      'Order ID': order.id,
      'Date': format(new Date(order.createdAt!), 'yyyy-MM-dd HH:mm:ss'),
      'Status': t(`history.status.${order.status.toLowerCase()}`),
      'Total': formatCurrency(Number(order.total), currency),
      'Items': order.items.map(item =>
        `${item.quantity}x ${item.product?.name || t('history.unknownProduct')} (${formatCurrency(Number(item.price), currency)})`
      ).join(', ')
    }));
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.id.toString().includes(searchTerm) ||
        order.items.some(item => 
          item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const orderDate = new Date(order.createdAt!);
      const matchesDateRange = (!startDate || !endDate) || 
        isWithinInterval(orderDate, { start: startDate, end: endDate });

      return matchesSearch && matchesDateRange;
    });
  }, [orders, searchTerm, startDate, endDate]);

  const groupOrdersByDate = (orders: OrderWithId[] = []) => {
    const groups = new Map<string, OrderWithId[]>();

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt!);
      let key;
      
      switch (timeframe) {
        case 'week':
          const weekStart = startOfWeek(orderDate);
          key = format(weekStart, 'yyyy-MM-dd');
          break;
        case 'month':
          key = format(orderDate, 'yyyy-MM');
          break;
        default:
          key = format(orderDate, 'yyyy-MM-dd');
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(order);
    });

    return Array.from(groups.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, orders]) => ({
        date,
        orders,
        stats: calculateStats(orders)
      }));
  };

  if (!currentShop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t('common.selectShop')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card rounded-lg p-4 h-24" />
        ))}
      </div>
    );
  }

  const groupedOrders = groupOrdersByDate(filteredOrders);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">{t('common.history')}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <Button
                variant={timeframe === 'day' ? 'default' : 'outline'}
                onClick={() => setTimeframe('day')}
              >
                {t('history.daily')}
              </Button>
              <Button
                variant={timeframe === 'week' ? 'default' : 'outline'}
                onClick={() => setTimeframe('week')}
              >
                {t('history.weekly')}
              </Button>
              <Button
                variant={timeframe === 'month' ? 'default' : 'outline'}
                onClick={() => setTimeframe('month')}
              >
                {t('history.monthly')}
              </Button>
            </div>
            <ExportButtons
              data={prepareExportData()}
              filename="order-history"
              title={t('common.history')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <input
                type="text"
                placeholder={t('history.searchPlaceholder')}
                className="w-full rounded-md border border-input bg-background px-9 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                className="w-36 rounded-md border border-input bg-background pl-10 pr-3 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setStartDate(e.target.value ? parseISO(e.target.value) : null)}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                className="w-36 rounded-md border border-input bg-background pl-10 pr-3 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setEndDate(e.target.value ? parseISO(e.target.value) : null)}
              />
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {groupedOrders.map(({ date, orders, stats }) => (
          <div key={date} className="space-y-2">
            <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
              <div>
                <h3 className="font-medium">
                  {timeframe === 'day'
                    ? format(new Date(date), 'MMMM d, yyyy')
                    : timeframe === 'week'
                    ? `Week of ${format(new Date(date), 'MMMM d, yyyy')}`
                    : format(new Date(date), 'MMMM yyyy')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stats.totalOrders} {t('history.orders')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(stats.totalRevenue, currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('history.totalRevenue')}
                </p>
              </div>
            </div>

            <div className="space-y-2 pl-4">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-lg p-4"
                >
                  <div
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="w-full cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{t('history.orderNumber', { id: order.id })}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.createdAt!), 'h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {t(`history.status.${order.status.toLowerCase()}`)}
                        </Badge>
                        <p className="font-medium">{formatCurrency(Number(order.total), currency)}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            generatePDF(order);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {user?.isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(t('history.confirmDelete'))) {
                                deleteMutation.mutate(order.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {expandedOrders.includes(order.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedOrders.includes(order.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t"
                    >
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.product?.name || t('history.unknownProduct')}
                            </span>
                            <span>{formatCurrency(Number(item.price), currency)}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
