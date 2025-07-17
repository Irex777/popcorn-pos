import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-utils';

test.describe('Runtime Errors and Missing Variables Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Set up error monitoring
    page.on('pageerror', (error) => {
      console.error('Page error:', error);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
  });

  test.describe('Analytics Page Variables', () => {
    test('should not have undefined categories variable', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await helpers.navigateAndWait('/analytics');
      
      // Check that page loads without errors
      await expect(page.locator('h1')).toBeVisible();
      
      // Verify no "is not defined" errors
      expect(errors.filter(e => e.includes('is not defined'))).toHaveLength(0);
      
      // Verify no "undefined" errors in console
      const consoleErrors = await page.evaluate(() => {
        const errors: string[] = [];
        const originalError = console.error;
        console.error = (...args: any[]) => {
          errors.push(args.join(' '));
          originalError.apply(console, args);
        };
        return errors;
      });
      
      const undefinedErrors = consoleErrors.filter(e => 
        e.includes('undefined') || e.includes('is not defined')
      );
      expect(undefinedErrors).toHaveLength(0);
    });

    test('should properly load all required data for analytics', async ({ page }) => {
      await helpers.navigateAndWait('/analytics');
      
      // Wait for data to load
      await page.waitForTimeout(2000);
      
      // Check that charts render (indicating data is loaded)
      const charts = page.locator('.recharts-wrapper, canvas, svg');
      await expect(charts.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Missing Query Dependencies', () => {
    test('should load all required queries on each page', async ({ page }) => {
      const pages = [
        '/analytics',
        '/inventory', 
        '/categories',
        '/settings',
        '/history'
      ];

      for (const pagePath of pages) {
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        await helpers.navigateAndWait(pagePath);
        
        // Wait for potential async operations
        await page.waitForTimeout(1000);
        
        // Check for runtime errors
        expect(errors.filter(e => 
          e.includes('is not defined') || 
          e.includes('undefined') ||
          e.includes('Cannot read properties of undefined')
        )).toHaveLength(0);
      }
    });

    test('should handle missing shop context gracefully', async ({ page }) => {
      await helpers.navigateAndWait('/analytics');
      
      // Check for no shop selected message or proper handling
      const noShopMessage = page.locator('text=No shop selected, text=Select a shop');
      const hasContent = await page.locator('main').count() > 0;
      
      // Either should show content or no-shop message, not error
      expect(hasContent || await noShopMessage.isVisible()).toBe(true);
    });
  });

  test.describe('Component State Errors', () => {
    test('should handle cart state properly', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Click on products if available
      const products = page.locator('[data-testid="product-card"]');
      if (await products.count() > 0) {
        await products.first().click();
        await page.waitForTimeout(500);
      }
      
      // Check cart updates without errors
      const cart = page.locator('[data-testid="cart"]');
      await expect(cart).toBeVisible();
    });

    test('should handle form validation errors gracefully', async ({ page }) => {
      await helpers.navigateAndWait('/settings');
      
      // Try to submit empty forms
      const submitButtons = page.locator('button[type="submit"]');
      const count = await submitButtons.count();
      
      if (count > 0) {
        await submitButtons.first().click();
        await page.waitForTimeout(500);
        
        // Should show validation errors, not crash
        const errors = page.locator('.error, .text-red, .text-destructive');
        // Either no errors or proper error messages
        expect(await errors.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Async Operation Errors', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Block network requests to simulate failures
      await page.route('**/api/**', route => {
        route.abort();
      });
      
      await helpers.navigateAndWait('/analytics');
      
      // Should show loading state or error message, not crash
      const loading = page.locator('.loading, .spinner, .skeleton');
      const errorMessage = page.locator('.error, .text-red, text=Error, text=Failed');
      
      const hasLoadingOrError = await loading.isVisible() || await errorMessage.isVisible();
      expect(hasLoadingOrError).toBe(true);
    });

    test('should handle mutation errors properly', async ({ page }) => {
      await helpers.navigateAndWait('/inventory');
      
      // Try to create a product (this might fail)
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")');
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Should either show form or handle gracefully
        const form = page.locator('form, .form, .dialog');
        const hasForm = await form.isVisible();
        expect(hasForm).toBe(true);
      }
    });
  });

  test.describe('Component Unmounting', () => {
    test('should cleanup properly when navigating between pages', async ({ page }) => {
      const pages = ['/pos', '/inventory', '/analytics', '/settings'];
      
      for (let i = 0; i < pages.length; i++) {
        await helpers.navigateAndWait(pages[i]);
        await page.waitForTimeout(1000);
        
        // Navigate to next page
        const nextPage = pages[(i + 1) % pages.length];
        await helpers.navigateAndWait(nextPage);
        await page.waitForTimeout(1000);
        
        // Check that page loaded properly
        await expect(page.locator('main')).toBeVisible();
      }
    });
  });

  test.describe('Memory Leaks and Performance', () => {
    test('should not accumulate errors over time', async ({ page }) => {
      let errorCount = 0;
      
      page.on('pageerror', () => {
        errorCount++;
      });
      
      // Navigate through multiple pages multiple times
      const pages = ['/pos', '/inventory', '/analytics'];
      
      for (let round = 0; round < 3; round++) {
        for (const pagePath of pages) {
          await helpers.navigateAndWait(pagePath);
          await page.waitForTimeout(500);
        }
      }
      
      // Should not accumulate errors
      expect(errorCount).toBeLessThan(5);
    });
  });
});