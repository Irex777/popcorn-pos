import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { storage } from './storage';

let wss: WebSocketServer;

export function setupWebSocket(server: Server) {
  try {
    wss = new WebSocketServer({ server, path: '/ws' });
    console.log('WebSocket server initialized');

    wss.on('connection', (ws) => {
      console.log('Client connected to WebSocket');

      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
      });

      ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
      });
    });

    wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  } catch (error) {
    console.error('Failed to initialize WebSocket server:', error);
  }
}

export function broadcastAnalyticsUpdate(type: string, data: any) {
  if (!wss) {
    console.warn('WebSocket server not initialized, skipping broadcast');
    return;
  }

  try {
    const message = JSON.stringify({ type, data });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  } catch (error) {
    console.error('Error broadcasting analytics update:', error);
  }
}

// Helper function to calculate basic statistics
function calculateStats(numbers: number[]) {
  if (!numbers.length) return { mean: 0, stdDev: 0 };

  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = sum / numbers.length;
  const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
  const stdDev = Math.sqrt(variance);
  return { mean, stdDev };
}

// Function to generate predictions based on historical data
export async function generatePredictions() {
  try {
    const orders = await storage.getOrders();
    const hourlyData: { [hour: string]: number[] } = {};

    // Group orders by hour
    orders.forEach(order => {
      const hour = new Date(order.createdAt!).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(Number(order.total));
    });

    const currentHour = new Date().getHours();
    const stats = calculateStats(hourlyData[currentHour] || []);

    return {
      nextHour: {
        predictedValue: stats.mean,
        confidenceInterval: {
          lower: stats.mean - stats.stdDev,
          upper: stats.mean + stats.stdDev
        }
      },
      nextDay: {
        predictedValue: stats.mean * 24,
        confidenceInterval: {
          lower: (stats.mean - stats.stdDev) * 24,
          upper: (stats.mean + stats.stdDev) * 24
        }
      },
      nextWeek: {
        predictedValue: stats.mean * 24 * 7,
        confidenceInterval: {
          lower: (stats.mean - stats.stdDev) * 24 * 7,
          upper: (stats.mean + stats.stdDev) * 24 * 7
        }
      }
    };
  } catch (error) {
    console.error('Error generating predictions:', error);
    throw error;
  }
}

// Start periodic analytics updates
export function startAnalyticsUpdates() {
  console.log('Starting analytics updates...');
  // Update analytics every minute
  const interval = setInterval(async () => {
    try {
      if (!wss || wss.clients.size === 0) {
        console.log('No active WebSocket clients, skipping update');
        return;
      }

      const predictions = await generatePredictions();
      const orders = await storage.getOrders();

      // Calculate real-time metrics
      const currentHour = new Date().getHours();
      const currentHourOrders = orders.filter(order => {
        const orderHour = new Date(order.createdAt!).getHours();
        return orderHour === currentHour;
      });

      const realtimeMetrics = {
        currentHourSales: currentHourOrders.reduce((sum, order) => sum + Number(order.total), 0),
        activeCustomers: new Set(currentHourOrders.map(order => order.id)).size,
        averageOrderValue: currentHourOrders.length > 0
          ? currentHourOrders.reduce((sum, order) => sum + Number(order.total), 0) / currentHourOrders.length
          : 0
      };

      const trendIndicators = {
        salesTrend: realtimeMetrics.currentHourSales > predictions.nextHour.predictedValue
          ? 'increasing'
          : realtimeMetrics.currentHourSales < predictions.nextHour.predictedValue
          ? 'decreasing'
          : 'stable',
        confidence: 0.95 // Example confidence level
      };

      broadcastAnalyticsUpdate('PREDICTION_UPDATE', {
        predictions,
        realtimeMetrics,
        trendIndicators
      });
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }, 60000); // Update every minute

  // Clean up interval on process exit
  process.on('exit', () => {
    clearInterval(interval);
  });
}