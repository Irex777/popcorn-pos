import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { storage } from './storage';

let wss: WebSocketServer;
let isInitialized = false;

export function setupWebSocket(server: Server) {
  if (isInitialized) {
    console.log('WebSocket server already initialized');
    return true;
  }

  try {
    wss = new WebSocketServer({
      server, // Attach to HTTP server
      path: '/ws',
      verifyClient: async (info: any, callback: any) => {
        try {
          // Extract user session
          const cookie = info.req.headers.cookie;
          if (!cookie) {
            console.log('WS: No cookie provided');
            callback(false, 401, 'Unauthorized');
            return;
          }

          // Extract sessionId from cookie
          const sessionMatch = cookie.match(/connect\.sid=([^;]+)/);
          if (!sessionMatch) {
            console.log('WS: No session cookie found');
            callback(false, 401, 'Unauthorized');
            return;
          }

          // For now, accept all authenticated connections
          // In a production environment, you'd want to validate the session
          callback(true);
        } catch (error) {
          console.error('WS verification error:', error);
          callback(false, 500, 'Internal Server Error');
        }
      }
    });

    console.log('WebSocket server initialized');

    wss.on('connection', (ws, request) => {
      console.log('Client connected to WebSocket');
      
      // Store connection time for debugging
      (ws as any).connectionTime = new Date();
      (ws as any).lastPingTime = new Date();

      // Set up ping-pong to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
          (ws as any).lastPingTime = new Date();
        }
      }, 30000);

      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
      });

      ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        clearInterval(pingInterval);
      });

      ws.on('pong', () => {
        (ws as any).lastPongTime = new Date();
      });
    });

    // Monitor connections periodically
    setInterval(() => {
      wss.clients.forEach((client: any) => {
        const connectionDuration = Date.now() - client.connectionTime.getTime();
        const lastPingAge = Date.now() - client.lastPingTime.getTime();
        console.log(`WS Client stats - Connected: ${connectionDuration}ms, Last ping: ${lastPingAge}ms`);
      });
    }, 60000);

    wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    isInitialized = true;
    return true;

  } catch (error) {
    console.error('Failed to initialize WebSocket server:', error);
    return false;
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
export async function generatePredictions(shopId: number) {
  try {
    const orders = await storage.getOrders(shopId);
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
export function startAnalyticsUpdates(shopId?: number) {
  if (!shopId) {
    console.log('No shopId provided, skipping analytics updates');
    return;
  }

  console.log('Starting analytics updates...');
  // Update analytics every minute
  const interval = setInterval(async () => {
    try {
      if (!wss || wss.clients.size === 0) {
        console.log('No active WebSocket clients, skipping update');
        return;
      }

      const predictions = await generatePredictions(shopId);
      const orders = await storage.getOrders(shopId);

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
