#!/usr/bin/env node

import { spawn } from 'child_process';
import net from 'net';

// Port configuration
const DEFAULT_PORT = 3003;
const FALLBACK_PORTS = [3004, 3005, 3006, 3007, 3008, 3009, 3010];

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
}

async function findAvailablePort() {
  const portsToTry = [DEFAULT_PORT, ...FALLBACK_PORTS];
  
  for (const port of portsToTry) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      return port;
    }
  }
  
  throw new Error(`No available ports found. Tried: ${portsToTry.join(', ')}`);
}

async function startServer() {
  try {
    console.log('🔍 Checking for available ports...');
    
    const availablePort = await findAvailablePort();
    
    if (availablePort !== DEFAULT_PORT) {
      console.log(`⚠️ Default port ${DEFAULT_PORT} is in use, starting on port ${availablePort}`);
    } else {
      console.log(`✅ Starting on preferred port ${availablePort}`);
    }
    
    // Set the PORT environment variable
    process.env.PORT = availablePort.toString();
    process.env.PUBLIC_URL = `http://localhost:${availablePort}`;
    
    console.log(`🚀 Starting Popcorn POS on port ${availablePort}...`);
    console.log(`🌐 Once started, open: http://localhost:${availablePort}`);
    console.log(`🛡️ Port Guardian will ensure you're always on the correct port`);
    
    // Start the server
    const serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: availablePort.toString(),
        PUBLIC_URL: `http://localhost:${availablePort}`
      }
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down server...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`);
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Run the startup process
startServer();