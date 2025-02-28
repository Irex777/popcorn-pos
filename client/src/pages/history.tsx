import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { type Order } from "@shared/schema";
import { format, startOfMonth, startOfDay, isWithinInterval, startOfYear } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import { ExportButtons } from "@/components/ui/export-buttons";

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
  const [timeframe, setTimeframe] = useState<'day' | 'month'>('day');

  const { data: orders, isLoading } = useQuery<OrderWithId[]>({
    queryKey: ['/api/orders']
  });

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(current =>
      current.includes(orderId)
        ? current.filter(id => id !== orderId)
        : [...current, orderId]
    );
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

  const groupOrdersByDate = (orders: OrderWithId[] = []) => {
    const now = new Date();
    const groups = new Map<string, OrderWithId[]>();

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt!);
      const key = timeframe === 'day'
        ? format(orderDate, 'yyyy-MM-dd')
        : format(orderDate, 'yyyy-MM');

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card rounded-lg p-4 h-24" />
        ))}
      </div>
    );
  }

  const groupedOrders = groupOrdersByDate(orders);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t('common.history')}</h2>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={timeframe === 'day' ? 'default' : 'outline'}
              onClick={() => setTimeframe('day')}
            >
              {t('history.daily')}
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
                  <button
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="w-full"
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
                        {expandedOrders.includes(order.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </button>

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