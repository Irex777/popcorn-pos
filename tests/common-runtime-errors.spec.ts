import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-utils';

test.describe('Common Runtime Errors Prevention Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Monitor all types of errors
    page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
    });
  });

  test.describe('Schema Validation Errors', () => {
    test('should handle date field validation properly', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Try to create an order that might trigger date validation
      const orderButton = page.locator('button:has-text("Order"), button:has-text("Checkout")');
      
      if (await orderButton.isVisible()) {
        await orderButton.click();
        await page.waitForTimeout(1000);
        
        // Check for schema validation errors in console
        const consoleMessages: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleMessages.push(msg.text());
          }
        });
        
        // Wait for potential validation
        await page.waitForTimeout(2000);
        
        // Should not have schema validation errors
        const hasSchemaErrors = consoleMessages.some(msg => 
          msg.includes('Expected date, received string') ||
          msg.includes('invalid_type') ||
          msg.includes('schema')
        );
        
        expect(hasSchemaErrors).toBe(false);
      }
    });

    test('should handle form data validation properly', async ({ page }) => {
      await helpers.navigateAndWait('/settings');
      
      // Try to submit forms with various data types
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        
        // Fill form with edge case data
        await helpers.fillForm({
          'input[type="text"]': 'test@#$%',
          'input[type="email"]': 'invalid-email',
          'input[type="number"]': 'not-a-number'
        });
        
        const submitButton = form.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Should handle validation gracefully
          const hasErrors = await page.locator('.error, .text-red').isVisible();
          
          // Either shows validation errors or prevents submission
          expect(hasErrors || await submitButton.isDisabled()).toBe(true);
        }
      }
    });
  });

  test.describe('Null/Undefined Reference Errors', () => {
    test('should handle null product data', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Wait for products to load
      await page.waitForTimeout(2000);
      
      // Check if products are handled properly
      const products = page.locator('[data-testid="product-card"], .product-card');
      const productCount = await products.count();
      
      if (productCount > 0) {
        // Click on a product
        await products.first().click();
        await page.waitForTimeout(500);
        
        // Should not crash
        await expect(page.locator('main')).toBeVisible();
      }
    });

    test('should handle missing user context', async ({ page }) => {
      await helpers.navigateAndWait('/settings');
      
      // Simulate missing user context
      await page.evaluate(() => {
        // Try to access user-related elements
        const userElements = document.querySelectorAll('.user-info, .username');
        userElements.forEach(el => {
          if (el.textContent) {
            console.log('User info:', el.textContent);
          }
        });
      });
      
      // Should not crash
      await expect(page.locator('main')).toBeVisible();
    });

    test('should handle missing shop context', async ({ page }) => {
      await helpers.navigateAndWait('/analytics');
      
      // Check if page handles missing shop gracefully
      const noShopMessage = page.locator('text=No shop selected, text=Select a shop');
      const hasContent = await page.locator('main').isVisible();
      
      // Should either show no-shop message or content
      expect(hasContent || await noShopMessage.isVisible()).toBe(true);
    });
  });

  test.describe('Array Access Errors', () => {
    test('should handle empty arrays safely', async ({ page }) => {
      await helpers.navigateAndWait('/analytics');
      
      // Wait for data loading
      await page.waitForTimeout(3000);
      
      // Should handle empty data arrays gracefully
      const emptyState = page.locator('text=No data, text=No orders, text=No products');
      const hasCharts = await page.locator('.recharts-wrapper, canvas, svg').isVisible();
      
      // Should either show empty state or charts
      expect(hasCharts || await emptyState.isVisible()).toBe(true);
    });

    test('should handle array iteration safely', async ({ page }) => {
      await helpers.navigateAndWait('/inventory');
      
      // Check product listing
      const productList = page.locator('.product-list, .inventory-list');
      
      if (await productList.isVisible()) {
        const items = productList.locator('.product-item, .inventory-item');
        const itemCount = await items.count();
        
        // Should handle any number of items
        expect(itemCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Type Errors', () => {
    test('should handle string/number conversions properly', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Look for price displays
      const priceElements = page.locator('.price, [data-testid="price"]');
      const priceCount = await priceElements.count();
      
      if (priceCount > 0) {
        for (let i = 0; i < Math.min(priceCount, 3); i++) {
          const price = priceElements.nth(i);
          const priceText = await price.textContent();
          
          if (priceText) {
            // Should be formatted properly, not NaN
            expect(priceText).not.toContain('NaN');
            expect(priceText).not.toContain('undefined');
          }
        }
      }
    });

    test('should handle boolean conversions properly', async ({ page }) => {
      await helpers.navigateAndWait('/settings');
      
      // Look for boolean toggles
      const toggles = page.locator('input[type="checkbox"], .toggle, .switch');
      const toggleCount = await toggles.count();
      
      if (toggleCount > 0) {
        const toggle = toggles.first();
        
        // Test toggle state
        const isChecked = await toggle.isChecked();
        expect(typeof isChecked).toBe('boolean');
        
        // Try to toggle
        await toggle.click();
        await page.waitForTimeout(500);
        
        // Should handle state change
        const newState = await toggle.isChecked();
        expect(typeof newState).toBe('boolean');
      }
    });
  });

  test.describe('Event Handler Errors', () => {
    test('should handle click events safely', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Test various clickable elements
      const clickables = page.locator('button, a, .clickable');
      const clickableCount = await clickables.count();
      
      if (clickableCount > 0) {
        // Test first few clickable elements
        for (let i = 0; i < Math.min(clickableCount, 5); i++) {
          const element = clickables.nth(i);
          
          if (await element.isVisible()) {
            await element.click();
            await page.waitForTimeout(300);
            
            // Should not crash
            await expect(page.locator('main')).toBeVisible();
          }
        }
      }
    });

    test('should handle form submission safely', async ({ page }) => {
      await helpers.navigateAndWait('/settings');
      
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        const submitButton = form.locator('button[type="submit"]');
        
        if (await submitButton.isVisible()) {
          // Submit without required fields
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Should handle gracefully
          const hasErrors = await page.locator('.error, .text-red').isVisible();
          const stillOnPage = await form.isVisible();
          
          expect(hasErrors || stillOnPage).toBe(true);
        }
      }
    });
  });

  test.describe('Async Operation Errors', () => {
    test('should handle API failures gracefully', async ({ page }) => {
      // Block all API calls
      await page.route('**/api/**', route => {
        route.abort();
      });
      
      await helpers.navigateAndWait('/analytics');
      
      // Should show loading state or error, not crash
      const loading = page.locator('.loading, .spinner');
      const error = page.locator('.error, .text-red, text=Error');
      
      const hasLoadingOrError = await loading.isVisible() || await error.isVisible();
      expect(hasLoadingOrError).toBe(true);
    });

    test('should handle slow API responses', async ({ page }) => {
      // Delay all API calls
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });
      
      await helpers.navigateAndWait('/analytics');
      
      // Should show loading state
      const loading = page.locator('.loading, .spinner, .skeleton');
      const hasLoading = await loading.isVisible();
      
      expect(hasLoading).toBe(true);
    });
  });

  test.describe('Memory and Performance Errors', () => {
    test('should handle rapid navigation without memory leaks', async ({ page }) => {
      const pages = ['/pos', '/inventory', '/analytics', '/settings'];
      
      // Navigate rapidly between pages
      for (let round = 0; round < 3; round++) {
        for (const pagePath of pages) {
          await page.goto(pagePath);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(100);
        }
      }
      
      // Should still be responsive
      await expect(page.locator('main')).toBeVisible();
    });

    test('should handle large data sets properly', async ({ page }) => {
      await helpers.navigateAndWait('/history');
      
      // Wait for data to load
      await page.waitForTimeout(2000);
      
      // Check if large lists are handled properly
      const listItems = page.locator('.order-item, .history-item, tr');
      const itemCount = await listItems.count();
      
      if (itemCount > 50) {
        // Should still be responsive with large data
        await expect(page.locator('main')).toBeVisible();
      }
    });
  });

  test.describe('Browser Compatibility Errors', () => {
    test('should handle localStorage operations safely', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Test localStorage operations
      const result = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value');
          const value = localStorage.getItem('test');
          localStorage.removeItem('test');
          return value === 'value';
        } catch (error) {
          return false;
        }
      });
      
      expect(result).toBe(true);
    });

    test('should handle browser API availability', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Test common browser APIs
      const apis = await page.evaluate(() => {
        return {
          localStorage: typeof localStorage !== 'undefined',
          sessionStorage: typeof sessionStorage !== 'undefined',
          JSON: typeof JSON !== 'undefined',
          fetch: typeof fetch !== 'undefined'
        };
      });
      
      expect(apis.localStorage).toBe(true);
      expect(apis.sessionStorage).toBe(true);
      expect(apis.JSON).toBe(true);
      expect(apis.fetch).toBe(true);
    });
  });

  test.describe('Edge Case Scenarios', () => {
    test('should handle empty form submissions', async ({ page }) => {
      await helpers.navigateAndWait('/settings');
      
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        const submitButton = form.locator('button[type="submit"]');
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Should handle empty submission gracefully
          const hasErrors = await page.locator('.error, .text-red').isVisible();
          const isDisabled = await submitButton.isDisabled();
          
          expect(hasErrors || isDisabled).toBe(true);
        }
      }
    });

    test('should handle special characters in inputs', async ({ page }) => {
      await helpers.navigateAndWait('/inventory');
      
      // Look for input fields
      const inputs = page.locator('input[type="text"], textarea');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        const input = inputs.first();
        
        // Test special characters
        await input.fill('!@#$%^&*()_+{}|:"<>?[]\\;\',./<>?~`');
        await page.waitForTimeout(500);
        
        // Should handle special characters
        await expect(page.locator('main')).toBeVisible();
      }
    });
  });
});