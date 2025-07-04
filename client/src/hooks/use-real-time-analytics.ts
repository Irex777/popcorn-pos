import { useQuery } from '@tanstack/react-query';

import { useShop } from '@/lib/shop-context';

interface SalesPrediction {
  timestamp: string;
  predictedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

interface AnalyticsData {
  realtimeMetrics: {
    currentHourSales: number;
    activeCustomers: number;
    averageOrderValue: number;
  };
  predictions: {
    nextHour: SalesPrediction;
    nextDay: SalesPrediction;
    nextWeek: SalesPrediction;
  };
  trendIndicators: {
    salesTrend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
  };
}

export function useRealTimeAnalytics() {
  const { currentShop } = useShop();

  // Real-time analytics via polling (WebSocket removed)

  // Fetch real-time analytics data
  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: [`/api/shops/${currentShop?.id}/analytics/real-time`],
    enabled: !!currentShop,
    refetchInterval: 30000 // Fetch every 30 seconds
  });

  // Fetch historical data for predictions
  const { data: historicalData } = useQuery({
    queryKey: [`/api/shops/${currentShop?.id}/analytics/historical`],
    enabled: !!currentShop,
    staleTime: 1000 * 60 * 15 // 15 minutes
  });

  return {
    analyticsData,
    historicalData,
    isLoading,
  };
}