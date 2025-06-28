import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set environment variable to enable demo mode for testing
  process.env.DEMO_MODE = 'true';
  
  console.log('🧪 Setting up global test environment with demo mode...');
  console.log('🔓 Authentication bypass enabled for visual tests');
  
  return async () => {
    // Global teardown
    console.log('🧹 Cleaning up global test environment...');
  };
}

export default globalSetup;