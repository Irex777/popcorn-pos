/**
 * Port Guardian - Ensures the app is ALWAYS on the correct port
 * This runs immediately when the app loads and continuously monitors for port mismatches
 */

interface ServerInfo {
  port: number;
  isHealthy: boolean;
  responseTime: number;
}

class PortGuardian {
  private checkInterval: number | null = null;
  private isChecking = false;
  private lastKnownGoodPort: number | null = null;
  private readonly FALLBACK_PORTS = [3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
  private readonly CHECK_INTERVAL_MS = 5000; // Check every 5 seconds
  private readonly HEALTH_TIMEOUT_MS = 2000; // 2 second timeout for health checks

  constructor() {
    this.init();
  }

  private async init() {
    console.log('🛡️ Port Guardian: Initializing...');
    
    // Skip port guardian in production environments
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.log('🛡️ Port Guardian: Skipping in production environment');
      return;
    }
    
    // EMERGENCY FIX: Force redirect to port 3003 if on wrong port (development only)
    const currentPort = this.getCurrentPort();
    if (currentPort !== 3003) {
      console.log(`🚨 EMERGENCY REDIRECT: Moving from port ${currentPort} to 3003`);
      this.redirectToCorrectPort(3003);
      return;
    }
    
    console.log('✅ Port Guardian: Already on correct port 3003');
  }

  private startMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = window.setInterval(() => {
      if (!this.isChecking) {
        this.performPortCheck();
      }
    }, this.CHECK_INTERVAL_MS);

    console.log('🛡️ Port Guardian: Monitoring started');
  }

  private stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('🛡️ Port Guardian: Monitoring stopped');
  }

  private async performPortCheck() {
    if (this.isChecking) return;
    
    this.isChecking = true;
    
    try {
      const currentPort = this.getCurrentPort();
      console.log(`🛡️ Port Guardian: Checking current port ${currentPort}...`);

      // First, check if current port has a healthy server
      const currentServerHealth = await this.checkServerHealth(currentPort);
      
      if (currentServerHealth.isHealthy) {
        console.log(`✅ Port Guardian: Current port ${currentPort} is healthy`);
        this.lastKnownGoodPort = currentPort;
        return;
      }

      console.log(`⚠️ Port Guardian: Current port ${currentPort} is unhealthy, searching for correct server...`);
      
      // Find the correct server port
      const correctPort = await this.findCorrectServerPort();
      
      if (correctPort && correctPort !== currentPort) {
        console.log(`🔄 Port Guardian: Found server on port ${correctPort}, redirecting...`);
        this.redirectToCorrectPort(correctPort);
      } else if (!correctPort) {
        console.error('❌ Port Guardian: No healthy server found on any port!');
        this.showServerNotFoundError();
      }
      
    } catch (error) {
      console.error('🛡️ Port Guardian: Error during port check:', error);
    } finally {
      this.isChecking = false;
    }
  }

  private getCurrentPort(): number {
    const port = window.location.port;
    return port ? parseInt(port) : (window.location.protocol === 'https:' ? 443 : 80);
  }

  private async checkServerHealth(port: number): Promise<ServerInfo> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.HEALTH_TIMEOUT_MS);
      
      const response = await fetch(`http://localhost:${port}/api/health`, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      return {
        port,
        isHealthy: response.ok,
        responseTime,
      };
    } catch (error) {
      return {
        port,
        isHealthy: false,
        responseTime: Date.now() - startTime,
      };
    }
  }

  private async findCorrectServerPort(): Promise<number | null> {
    console.log('🔍 Port Guardian: Scanning for healthy server...');
    
    // Check all fallback ports in parallel for speed
    const healthChecks = this.FALLBACK_PORTS.map(port => this.checkServerHealth(port));
    const results = await Promise.all(healthChecks);
    
    // Find the first healthy server
    const healthyServer = results.find(result => result.isHealthy);
    
    if (healthyServer) {
      console.log(`✅ Port Guardian: Found healthy server on port ${healthyServer.port} (${healthyServer.responseTime}ms)`);
      return healthyServer.port;
    }
    
    console.log('❌ Port Guardian: No healthy servers found');
    return null;
  }

  private redirectToCorrectPort(port: number) {
    const currentUrl = new URL(window.location.href);
    const newUrl = `${currentUrl.protocol}//localhost:${port}${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
    
    console.log(`🔄 Port Guardian: Redirecting from ${window.location.href} to ${newUrl}`);
    
    // Show a brief message before redirect
    this.showRedirectMessage(port);
    
    // Redirect after a short delay to let user see the message
    setTimeout(() => {
      window.location.href = newUrl;
    }, 1000);
  }

  private showRedirectMessage(port: number) {
    // Create a temporary overlay message
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 18px;
      text-align: center;
    `;
    
    overlay.innerHTML = `
      <div>
        <div style="font-size: 24px; margin-bottom: 16px;">🔄 Redirecting to correct server...</div>
        <div>Moving from port ${this.getCurrentPort()} to port ${port}</div>
        <div style="margin-top: 16px; font-size: 14px; opacity: 0.8;">This ensures your session works properly</div>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }

  private showServerNotFoundError() {
    // Create error overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(220, 38, 38, 0.9);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 18px;
      text-align: center;
    `;
    
    overlay.innerHTML = `
      <div>
        <div style="font-size: 24px; margin-bottom: 16px;">❌ Server Not Found</div>
        <div>Could not find a running server on any port</div>
        <div style="margin-top: 16px; font-size: 14px;">
          Please start the server with: <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">npm run dev</code>
        </div>
        <button onclick="window.location.reload()" style="
          margin-top: 20px;
          padding: 10px 20px;
          background: white;
          color: #dc2626;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
        ">Retry</button>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }

  // Public methods for manual control
  public async forceCheck(): Promise<void> {
    console.log('🛡️ Port Guardian: Force check requested');
    await this.performPortCheck();
  }

  public pause(): void {
    this.stopMonitoring();
    console.log('🛡️ Port Guardian: Paused');
  }

  public resume(): void {
    this.startMonitoring();
    console.log('🛡️ Port Guardian: Resumed');
  }

  public getStatus() {
    return {
      isMonitoring: this.checkInterval !== null,
      isChecking: this.isChecking,
      currentPort: this.getCurrentPort(),
      lastKnownGoodPort: this.lastKnownGoodPort,
    };
  }
}

// Create and start the port guardian immediately
const portGuardian = new PortGuardian();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).portGuardian = portGuardian;
}

export { portGuardian };