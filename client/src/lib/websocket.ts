import { queryClient } from './queryClient';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second

  private authenticated = false;

  setAuthenticated(value: boolean) {
    this.authenticated = value;
    if (value) {
      this.connect();
    } else {
      this.disconnect();
    }
  }

  connect() {
    if (!this.authenticated) {
      console.log('Not attempting WebSocket connection - user not authenticated');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname || 'localhost';
      const port = window.location.port || '5000';
      const wsUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}/ws`;

      console.log('Attempting to connect to WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      // Add ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000) as unknown as number; // Type assertion to number for clearInterval

      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.reconnectTimeout = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WS message received:', data.type);

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
            case 'pong':
              // Handle pong response
              console.log('Received pong from server');
              break;
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
        if (pingInterval) clearInterval(pingInterval);
        
        if (this.authenticated && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.reconnectTimeout *= 2; // Exponential backoff
            this.connect();
          }, this.reconnectTimeout);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('Max reconnection attempts reached');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.ws?.close();
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();
