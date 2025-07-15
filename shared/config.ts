export interface PortConfig {
  server: number;
  client: number;
  fallbackPorts: number[];
}

export interface AppConfig {
  ports: PortConfig;
  isDevelopment: boolean;
  isProduction: boolean;
  baseUrl: string;
  apiUrl: string;
}

export function getPortConfig(): PortConfig {
  const defaultServerPort = 3003;
  const defaultClientPort = 5173;
  
  // Parse PORT environment variable
  const envPort = process.env.PORT ? parseInt(process.env.PORT) : null;
  
  return {
    server: envPort || defaultServerPort,
    client: defaultClientPort,
    fallbackPorts: [3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010]
  };
}

export function getAppConfig(): AppConfig {
  const ports = getPortConfig();
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // In development, client and server run on the same port (server serves client via Vite)
  // In production, they might be on different ports/domains
  const baseUrl = isDevelopment 
    ? `http://localhost:${ports.server}`
    : (process.env.PUBLIC_URL || `http://localhost:${ports.server}`);
    
  const apiUrl = isDevelopment
    ? `http://localhost:${ports.server}/api`
    : `${baseUrl}/api`;

  return {
    ports,
    isDevelopment,
    isProduction,
    baseUrl,
    apiUrl
  };
}

// Client-side port detection (for browser environment)
export function getClientConfig() {
  if (typeof window === 'undefined') {
    return getAppConfig();
  }
  
  // In browser, detect current port and construct API URL
  const currentPort = window.location.port ? parseInt(window.location.port) : (window.location.protocol === 'https:' ? 443 : 80);
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  
  const baseUrl = `${currentProtocol}//${currentHost}${currentPort !== 80 && currentPort !== 443 ? `:${currentPort}` : ''}`;
  const apiUrl = `${baseUrl}/api`;
  
  return {
    ports: {
      server: currentPort,
      client: currentPort,
      fallbackPorts: []
    },
    isDevelopment: currentHost === 'localhost' || currentHost === '127.0.0.1',
    isProduction: currentHost !== 'localhost' && currentHost !== '127.0.0.1',
    baseUrl,
    apiUrl
  };
}

export function validatePort(port: number): boolean {
  return port > 0 && port <= 65535 && Number.isInteger(port);
}

export function findAvailablePort(preferredPort: number, fallbackPorts: number[] = []): Promise<number> {
  return new Promise(async (resolve, reject) => {
    const { createServer } = await import('net');
    const portsToTry = [preferredPort, ...fallbackPorts];
    
    function tryPort(index: number): void {
      if (index >= portsToTry.length) {
        reject(new Error(`No available ports found. Tried: ${portsToTry.join(', ')}`));
        return;
      }
      
      const port = portsToTry[index];
      const server = createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(port);
        });
        server.close();
      });
      
      server.on('error', () => {
        tryPort(index + 1);
      });
    }
    
    tryPort(0);
  });
}