import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set environment variable to enable demo mode for testing
  process.env.DEMO_MODE = 'true';
  
  // Optional: Setup test database or other global test state here
  console.log('🧪 Setting up global test environment...');
  
  return async () => {
    // Global teardown
    console.log('🧹 Cleaning up global test environment...');
  };
}

export default globalSetup;