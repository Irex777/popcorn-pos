import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { wsClient } from '@/lib/websocket';

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
  // Set up WebSocket connection when the hook is first used
  useEffect(() => {
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  // Fetch real-time analytics data
  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics/real-time'],
    // Polling as backup in case WebSocket fails
    refetchInterval: 30000, // Fetch every 30 seconds
  });

  // Fetch historical data for predictions
  const { data: historicalData } = useQuery({
    queryKey: ['/api/analytics/historical'],
    // Cache historical data longer since it changes less frequently
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  return {
    analyticsData,
    historicalData,
    isLoading,
  };
}
