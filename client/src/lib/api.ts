import { getClientConfig } from "@shared/config";

// Get the client configuration
const config = getClientConfig();

// Create a base URL for API requests
export const API_BASE_URL = config.apiUrl;

// Helper function to construct API URLs
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Remove api/ prefix if present to avoid double api paths
  if (cleanEndpoint.startsWith('api/')) {
    cleanEndpoint = cleanEndpoint.slice(4);
  }
  
  // In development, use relative URLs since client and server are on same port
  if (config.isDevelopment) {
    return `/api/${cleanEndpoint}`;
  }
  
  // In production, construct the full URL
  // API_BASE_URL already includes the /api path, so just append the endpoint
  return `${API_BASE_URL}/${cleanEndpoint}`;
}

// Fallback function to try different ports if the current one fails
export async function getApiUrlWithFallback(endpoint: string): Promise<string> {
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Remove api/ prefix if present to avoid double api paths
  if (cleanEndpoint.startsWith('api/')) {
    cleanEndpoint = cleanEndpoint.slice(4);
  }
  
  if (config.isDevelopment) {
    // In development, if we're on the wrong port, try to detect the correct server port
    const currentPort = window.location.port || '3003';
    const fallbackPorts = ['3003', '3004', '3005', '3006'];
    
    // First try the current port (relative URL)
    return `/api/${cleanEndpoint}`;
  }
  
  return `${API_BASE_URL}/${cleanEndpoint}`;
}

// Enhanced fetch wrapper with automatic URL construction and port fallback
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // First try the standard URL
  let url = getApiUrl(endpoint);
  console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText} for ${url}`);
      
      // If we get a connection error in development and we're using relative URLs,
      // it might be a port mismatch. Try to redirect to the correct port.
      if (config.isDevelopment && response.status === 0) {
        console.log('🔄 Attempting port detection and redirect...');
        await attemptPortRedirect();
        return response; // Return the failed response, redirect will handle the rest
      }
    } else {
      console.log(`✅ API Success: ${response.status} for ${url}`);
    }
    
    return response;
  } catch (error) {
    console.error(`🚨 Network Error for ${url}:`, error);
    
    // If we get a network error in development, try port detection
    if (config.isDevelopment && error instanceof TypeError && error.message.includes('fetch')) {
      console.log('🔄 Network error detected, attempting port detection...');
      await attemptPortRedirect();
    }
    
    throw error;
  }
}

// Function to detect the correct server port and redirect if necessary
async function attemptPortRedirect(): Promise<void> {
  const currentPort = window.location.port || '3003';
  const fallbackPorts = ['3003', '3004', '3005', '3006'];
  
  console.log(`🔍 Current port: ${currentPort}, checking fallback ports...`);
  
  for (const port of fallbackPorts) {
    if (port === currentPort) continue; // Skip current port
    
    try {
      console.log(`🔍 Testing port ${port}...`);
      const testResponse = await fetch(`http://localhost:${port}/api/health`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (testResponse.ok) {
        console.log(`✅ Found server on port ${port}, redirecting...`);
        window.location.href = `http://localhost:${port}${window.location.pathname}${window.location.search}`;
        return;
      }
    } catch (error) {
      console.log(`❌ Port ${port} not available`);
    }
  }
  
  console.error('❌ Could not find server on any fallback ports');
}

// Port detection utility for debugging
export function getPortInfo() {
  return {
    currentPort: window.location.port || (window.location.protocol === 'https:' ? '443' : '80'),
    currentHost: window.location.hostname,
    currentProtocol: window.location.protocol,
    apiBaseUrl: API_BASE_URL,
    config: config
  };
}

// Debug function to log port information
export function logPortInfo() {
  const info = getPortInfo();
  console.group('🔍 Port Configuration Debug');
  console.log('Current URL:', window.location.href);
  console.log('Detected Port:', info.currentPort);
  console.log('Host:', info.currentHost);
  console.log('Protocol:', info.currentProtocol);
  console.log('API Base URL:', info.apiBaseUrl);
  console.log('Is Development:', info.config.isDevelopment);
  console.log('Full Config:', info.config);
  console.groupEnd();
}

// Manual port detection and redirect function
export async function detectAndRedirectToServer(): Promise<void> {
  console.log('🔍 Manual server detection started...');
  await attemptPortRedirect();
}

// Make port detection available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).detectServer = detectAndRedirectToServer;
  (window as any).logPortInfo = logPortInfo;
}