import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { type Order, type Product } from "@shared/schema";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { currencyAtom } from "@/lib/settings";
import { formatCurrency } from "@/lib/settings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useState } from "react";
import { ExportButtons } from "@/components/ui/export-buttons";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { PredictiveInsights } from "@/components/analytics/PredictiveInsights";
import { useRealTimeAnalytics } from "@/hooks/use-real-time-analytics";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface OrderWithItems extends Order {
  items: any[];
}

export default function Analytics() {
  const { t } = useTranslation();
  const [currency] = useAtom(currencyAtom);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const { analyticsData, isLoading: realtimeLoading } = useRealTimeAnalytics();

  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ['/api/orders']
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  if (ordersLoading || productsLoading || realtimeLoading || !analyticsData) {
    return (
      <LoadingAnimation />
    );
  }

  const { realtimeMetrics } = analyticsData;

  // Calculate sales metrics
  const totalSales = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
  const totalOrders = orders?.length || 0;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Prepare data for charts
  const salesByCategory = products?.reduce((acc, product) => {
    const productSales = orders?.flatMap(o => o.items)
      .filter(item => item.productId === product.id)
      .reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0) || 0;

    if (!acc[product.category]) {
      acc[product.category] = 0;
    }
    acc[product.category] += productSales;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(salesByCategory || {}).map(([name, value]) => ({
    name,
    value
  }));

  // Daily sales data
  const dailySales = orders?.reduce((acc, order) => {
    const date = format(new Date(order.createdAt!), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += Number(order.total);
    return acc;
  }, {} as Record<string, number>);

  const salesTrendData = Object.entries(dailySales || {})
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, total]) => ({
      date: format(new Date(date), 'MMM d'),
      total
    }));

  // Top products
  const productSales = products?.map(product => {
    const sales = orders?.flatMap(o => o.items)
      .filter(item => item.productId === product.id)
      .reduce((sum, item) => sum + item.quantity, 0) || 0;
    return {
      name: product.name,
      sales
    };
  }).sort((a, b) => b.sales - a.sales).slice(0, 5);

  const prepareExportData = () => {
    if (!orders) return [];
    return orders.map(order => ({
      'Order ID': order.id,
      'Date': format(new Date(order.createdAt!), 'yyyy-MM-dd HH:mm:ss'),
      'Status': order.status,
      'Total': formatCurrency(Number(order.total), currency),
      'Items': order.items.map(item => `${item.quantity}x ${item.product?.name}`).join(', ')
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">
        {t('analytics.title')}
      </h2>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.currentHourSales')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(realtimeMetrics.currentHourSales, currency)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.activeCustomers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {realtimeMetrics.activeCustomers}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.averageOrderValue')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(realtimeMetrics.averageOrderValue, currency)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Predictive Insights */}
      <PredictiveInsights />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 analytics-cards">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.totalSales')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalSales, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.totalOrders')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.averageOrder')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(averageOrderValue, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.salesTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, currency)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8884d8"
                    name={t('analytics.revenue')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.salesByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) =>
                      `${name}: ${formatCurrency(value, currency)}`
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, currency)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.topProducts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="sales"
                    fill="#8884d8"
                    name={t('analytics.unitsSold')}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}