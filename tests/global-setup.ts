import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set environment variable to enable demo mode for testing
  process.env.DEMO_MODE = 'true';
  process.env.NODE_ENV = 'test';
  
  console.log('🧪 Setting up global test environment with demo mode...');
  console.log('🔓 Authentication bypass enabled for visual tests');
  
  // Start browser to warm up
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to app to trigger any setup
  try {
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Test environment warmed up successfully');
  } catch (error) {
    console.log('⚠️ Could not warm up test environment:', error instanceof Error ? error.message : String(error));
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
  
  return async () => {
    // Global teardown
    console.log('🧹 Cleaning up global test environment...');
  };
}

export default globalSetup;