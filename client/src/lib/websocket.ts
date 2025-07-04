import { queryClient } from './queryClient';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2; // Further reduced to be less aggressive
  private reconnectTimeout = 5000; // Start with 5 seconds
  private enabled = true; // Allow disabling WebSocket entirely
  private lastInvalidation = 0; // Throttle query invalidations

  private authenticated = false;

  setAuthenticated(value: boolean) {
    const wasAuthenticated = this.authenticated;
    
    // Only proceed if authentication state actually changed
    if (wasAuthenticated === value) {
      return;
    }
    
    console.log('WebSocket authentication status changed:', value);
    this.authenticated = value;
    
    // Only attempt connection if authentication state actually changed
    if (value && !wasAuthenticated) {
      this.connect();
    } else if (!value && wasAuthenticated) {
      this.disconnect();
    }
  }

  connect() {
    if (!this.enabled) {
      console.log('WebSocket disabled');
      return;
    }

    if (!this.authenticated) {
      // In development mode, allow WebSocket connections even without authentication
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Attempting WebSocket connection without authentication');
      } else {
        console.log('Not attempting WebSocket connection - user not authenticated');
        return;
      }
    }

    // Don't attempt to connect if we already have an open connection
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname || 'localhost';
      
      // In development, try to use the same port as the current page
      // This handles cases where the server might be running on a different port
      let port: string;
      if (process.env.NODE_ENV === 'development') {
        // Use the current page's port, which should match the server port
        // If no port is available, default to 3003 (actual server port)
        port = window.location.port || '3003';
        
        // Ensure port is not undefined or empty
        if (!port || port === 'undefined') {
          port = '3003';
        }
      } else {
        port = window.location.port || '80';
        
        // Ensure port is not undefined or empty
        if (!port || port === 'undefined') {
          port = '80';
        }
      }
      
      const wsUrl = `${protocol}//${hostname}:${port}/ws`;

      console.log('Attempting to connect to WebSocket:', wsUrl);
      
      // Validate the URL before attempting connection
      if (wsUrl.includes('undefined')) {
        console.error('Invalid WebSocket URL detected:', wsUrl);
        return;
      }
      
      this.ws = new WebSocket(wsUrl);
      
      // Add ping interval to keep connection alive (reduced frequency)
      const pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 60000) as unknown as number; // Type assertion to number for clearInterval

      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.reconnectTimeout = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WS message received:', data.type);

          // Throttle query invalidations to prevent excessive refetching (max once per 5 seconds)
          const now = Date.now();
          const shouldInvalidate = now - this.lastInvalidation > 5000;

          // Handle different types of real-time updates
          switch (data.type) {
            case 'NEW_ORDER':
              // Invalidate orders query to trigger a refetch
              if (shouldInvalidate) {
                queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
                this.lastInvalidation = now;
              }
              break;
            case 'SALES_UPDATE':
              // Update sales analytics data
              if (shouldInvalidate) {
                queryClient.invalidateQueries({ queryKey: ['/api/analytics/sales'] });
                this.lastInvalidation = now;
              }
              break;
            case 'PREDICTION_UPDATE':
              // Update prediction data
              if (shouldInvalidate) {
                queryClient.invalidateQueries({ queryKey: ['/api/analytics/predictions'] });
                this.lastInvalidation = now;
              }
              break;
            case 'pong':
              // Handle pong response (don't log to reduce noise)
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
          console.log('Max WebSocket reconnection attempts reached. Disabling WebSocket for this session.');
          this.enabled = false; // Disable WebSocket for this session
        }
      };

      this.ws.onerror = (error) => {
        console.warn('WebSocket error (this is non-critical):', error);
        // Don't immediately close on error - let the close handler manage reconnection
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

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.disconnect();
    } else if (this.authenticated) {
      this.connect();
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Force connection attempt (for testing)
  forceConnect() {
    console.log('Force connecting WebSocket...');
    this.enabled = true;
    this.reconnectAttempts = 0;
    this.connect();
  }
}

export const wsClient = new WebSocketClient();

// Make wsClient available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).wsClient = wsClient;
  (window as any).testWebSocket = () => {
    console.log('Testing WebSocket connection...');
    wsClient.forceConnect();
  };
}
