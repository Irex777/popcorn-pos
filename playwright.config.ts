import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/e2e/**', '**/puppeteer/**'],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 1,
  /* Reduce workers for more stable CI runs */
  workers: process.env.CI ? 1 : undefined,
  /* Increase timeout for comprehensive testing */
  timeout: 120 * 1000, // 120 seconds per test
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3003',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Disable animations for consistent screenshots
        reducedMotion: 'reduce',
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
        reducedMotion: 'reduce',
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
        reducedMotion: 'reduce',
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Standardize mobile viewport
        viewport: { width: 393, height: 851 },
        reducedMotion: 'reduce',
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Standardize mobile viewport
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
      },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'DEMO_MODE=true npm run dev',
    url: 'http://localhost:3003',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes for server startup
  },

  /* Global setup for authentication bypass in tests */
  globalSetup: './tests/global-setup.ts',

  /* Visual comparison settings */
  expect: {
    // Threshold for visual comparisons - increased for better stability
    toHaveScreenshot: {
      threshold: 0.4,
      // Add animation handling
      animations: 'disabled',
      // Clip to avoid dynamic content
      clip: { x: 0, y: 0, width: 1280, height: 720 }
    },
    // Threshold for visual comparison of elements
    toMatchSnapshot: {
      threshold: 0.4,
      animations: 'disabled'
    }
  }
});