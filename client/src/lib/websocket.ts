import { queryClient } from './queryClient';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle different types of real-time updates
      switch (data.type) {
        case 'NEW_ORDER':
          // Invalidate orders query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          break;
        case 'SALES_UPDATE':
          // Update sales analytics data
          queryClient.invalidateQueries({ queryKey: ['/api/analytics/sales'] });
          break;
        case 'PREDICTION_UPDATE':
          // Update prediction data
          queryClient.invalidateQueries({ queryKey: ['/api/analytics/predictions'] });
          break;
      }
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.reconnectTimeout *= 2; // Exponential backoff
          this.connect();
        }, this.reconnectTimeout);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws?.close();
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();