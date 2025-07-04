/**
 * Port Announcer - Ensures the server clearly communicates which port it's running on
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class PortAnnouncer {
  private static instance: PortAnnouncer;
  private currentPort: number | null = null;
  private readonly PORT_FILE_PATH = join(process.cwd(), '.port');
  private readonly PUBLIC_PORT_FILE_PATH = join(process.cwd(), 'client', 'public', '.server-port');

  static getInstance(): PortAnnouncer {
    if (!PortAnnouncer.instance) {
      PortAnnouncer.instance = new PortAnnouncer();
    }
    return PortAnnouncer.instance;
  }

  announcePort(port: number): void {
    this.currentPort = port;
    
    console.log('📢 PORT ANNOUNCER: Server is running on port', port);
    console.log('🌐 PORT ANNOUNCER: Application URL:', `http://localhost:${port}`);
    console.log('🔗 PORT ANNOUNCER: Direct link:', `\x1b]8;;http://localhost:${port}\x1b\\http://localhost:${port}\x1b]8;;\x1b\\`);
    
    // Write port to files for client detection
    this.writePortFiles(port);
    
    // Update environment variables
    process.env.ACTUAL_PORT = port.toString();
    process.env.PUBLIC_URL = `http://localhost:${port}`;
    
    // Display prominent startup message
    this.displayStartupBanner(port);
  }

  private writePortFiles(port: number): void {
    try {
      // Write to root .port file
      writeFileSync(this.PORT_FILE_PATH, port.toString(), 'utf8');
      
      // Ensure client/public directory exists
      const publicDir = join(process.cwd(), 'client', 'public');
      if (!existsSync(publicDir)) {
        mkdirSync(publicDir, { recursive: true });
      }
      
      // Write to client/public/.server-port for client-side detection
      const portInfo = {
        port,
        timestamp: new Date().toISOString(),
        url: `http://localhost:${port}`,
      };
      
      writeFileSync(this.PUBLIC_PORT_FILE_PATH, JSON.stringify(portInfo, null, 2), 'utf8');
      
      console.log('📝 PORT ANNOUNCER: Port files written successfully');
    } catch (error) {
      console.error('❌ PORT ANNOUNCER: Failed to write port files:', error);
    }
  }

  private displayStartupBanner(port: number): void {
    const banner = `
╔════════════════════════════════════════════════════════════════╗
║                        🍿 POPCORN POS                          ║
║                                                                ║
║  🚀 Server is running on: http://localhost:${port.toString().padEnd(4)}                ║
║                                                                ║
║  📱 Open this URL in your browser to access the application   ║
║                                                                ║
║  🛡️  Port Guardian is active - automatic port detection       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;
    
    console.log(banner);
  }

  getCurrentPort(): number | null {
    return this.currentPort;
  }

  cleanup(): void {
    try {
      // Clean up port files on shutdown
      if (existsSync(this.PORT_FILE_PATH)) {
        writeFileSync(this.PORT_FILE_PATH, '', 'utf8');
      }
      if (existsSync(this.PUBLIC_PORT_FILE_PATH)) {
        writeFileSync(this.PUBLIC_PORT_FILE_PATH, JSON.stringify({ port: null, timestamp: new Date().toISOString() }), 'utf8');
      }
      console.log('🧹 PORT ANNOUNCER: Cleanup completed');
    } catch (error) {
      console.error('❌ PORT ANNOUNCER: Cleanup failed:', error);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  PortAnnouncer.getInstance().cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  PortAnnouncer.getInstance().cleanup();
  process.exit(0);
});

export const portAnnouncer = PortAnnouncer.getInstance();