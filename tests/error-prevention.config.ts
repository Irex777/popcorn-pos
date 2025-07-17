import { defineConfig } from '@playwright/test';

/**
 * Configuration specifically for error prevention tests
 * Focuses on catching runtime errors, auth issues, translation problems, etc.
 */
export default defineConfig({
  testDir: '.',
  testMatch: [
    '**/runtime-errors.spec.ts',
    '**/translation-keys.spec.ts',
    '**/auth-validation.spec.ts', 
    '**/common-runtime-errors.spec.ts'
  ],
  
  // Run tests in parallel for faster execution
  fullyParallel: true,
  
  // Fail fast on errors
  forbidOnly: true,
  
  // Retry failed tests to catch flaky issues
  retries: 2,
  
  // Moderate timeout for error detection
  timeout: 30 * 1000,
  
  // Detailed reporting for error analysis
  reporter: [
    ['html', { outputFolder: 'test-results/error-prevention' }],
    ['json', { outputFile: 'test-results/error-prevention-results.json' }],
    ['list']
  ],
  
  use: {
    // Base URL
    baseURL: 'http://localhost:3003',
    
    // Capture traces for failed tests
    trace: 'retain-on-failure',
    
    // Screenshots on failure
    screenshot: 'only-on-failure',
    
    // Videos for error analysis
    video: 'retain-on-failure',
    
    // Collect console logs
    extraHTTPHeaders: {
      'Accept': 'application/json'
    }
  },
  
  // Test against multiple browsers to catch browser-specific issues
  projects: [
    {
      name: 'chromium-errors',
      use: { 
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: 'firefox-errors',
      use: { 
        browserName: 'firefox',
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: 'webkit-errors',
      use: { 
        browserName: 'webkit',
        viewport: { width: 1280, height: 720 }
      }
    }
  ],
  
  // Start dev server for testing
  webServer: {
    command: 'DEMO_MODE=true npm run dev',
    url: 'http://localhost:3003',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  },
  
  // Global setup
  globalSetup: './global-setup.ts',
  
  // More lenient thresholds for error detection tests
  expect: {
    timeout: 10 * 1000,
    toHaveScreenshot: {
      threshold: 0.3,
      maxDiffPixels: 1000
    }
  }
});