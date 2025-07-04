import { useState, useEffect } from 'react';
import { wsClient } from '@/lib/websocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function WebSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(wsClient.isConnected());
    };

    // Check connection status every second
    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const handleConnect = () => {
    setIsConnecting(true);
    wsClient.forceConnect();
    setTimeout(() => setIsConnecting(false), 2000);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 p-2 bg-background border rounded-lg shadow-lg">
      <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        WebSocket {isConnected ? 'Connected' : 'Disconnected'}
      </Badge>
      <Button
        size="sm"
        variant="outline"
        onClick={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Test'}
      </Button>
    </div>
  );
}