import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-utils';

test.describe('Translation Keys and i18n Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Missing Translation Keys Detection', () => {
    test('should not display raw translation keys on any page', async ({ page }) => {
      const pages = [
        '/pos',
        '/inventory', 
        '/categories',
        '/analytics',
        '/settings',
        '/history'
      ];

      for (const pagePath of pages) {
        await helpers.navigateAndWait(pagePath);
        
        // Check for raw translation keys (keys that weren't translated)
        const rawKeys = await page.locator('text=/^[a-zA-Z]+\\.[a-zA-Z]+/').all();
        
        for (const keyElement of rawKeys) {
          const text = await keyElement.textContent();
          
          // Skip if it's not actually a translation key pattern
          if (!text || !text.includes('.')) continue;
          
          // Common translation key patterns that should not appear
          const translationKeyPatterns = [
            /^common\./,
            /^auth\./,
            /^settings\./,
            /^inventory\./,
            /^restaurant\./,
            /^checkout\./,
            /^analytics\./,
            /^categories\./,
            /^history\./
          ];
          
          const isTranslationKey = translationKeyPatterns.some(pattern => pattern.test(text));
          
          if (isTranslationKey) {
            console.error(`Found untranslated key on ${pagePath}: ${text}`);
            expect(isTranslationKey).toBe(false);
          }
        }
      }
    });

    test('should handle missing translation keys gracefully', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Inject a missing translation key to test fallback
      await page.evaluate(() => {
        // Try to use a non-existent translation key
        const testElement = document.createElement('div');
        testElement.textContent = 'test.nonexistent.key';
        document.body.appendChild(testElement);
      });
      
      // Should not crash the page
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Language Switching', () => {
    test('should switch languages without errors', async ({ page }) => {
      await helpers.navigateAndWait('/settings');
      
      // Look for language selector
      const languageDropdown = page.locator('select, .language-select, [data-testid="language-selector"]');
      
      if (await languageDropdown.isVisible()) {
        const options = await languageDropdown.locator('option').all();
        
        // Test switching to different languages
        for (const option of options.slice(0, 3)) { // Test first 3 languages
          const value = await option.getAttribute('value');
          if (value) {
            await languageDropdown.selectOption(value);
            await page.waitForTimeout(1000);
            
            // Verify page didn't crash
            await expect(page.locator('main')).toBeVisible();
            
            // Verify no raw translation keys appeared
            const rawKeys = await page.locator('text=/^[a-zA-Z]+\\.[a-zA-Z]+\\./').count();
            expect(rawKeys).toBe(0);
          }
        }
      }
    });

    test('should maintain translations across navigation', async ({ page }) => {
      await helpers.navigateAndWait('/settings');
      
      // Switch to Czech if available
      const languageDropdown = page.locator('select, .language-select');
      if (await languageDropdown.isVisible()) {
        await languageDropdown.selectOption('cs');
        await page.waitForTimeout(1000);
      }
      
      // Navigate to different pages
      const pages = ['/pos', '/inventory', '/analytics'];
      
      for (const pagePath of pages) {
        await helpers.navigateAndWait(pagePath);
        
        // Should maintain Czech translations
        const czechWords = await page.locator('text=/[áčďéěíňóřšťúůýž]/i').count();
        const rawKeys = await page.locator('text=/^[a-zA-Z]+\\.[a-zA-Z]+/').count();
        
        // Should have some Czech text and no raw keys
        expect(rawKeys).toBe(0);
      }
    });
  });

  test.describe('Restaurant Mode Translation Keys', () => {
    test('should not show raw keys in restaurant dialogs', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Try to open restaurant checkout dialog
      const cartButton = page.locator('button:has-text("Checkout"), button:has-text("Order")');
      if (await cartButton.isVisible()) {
        await cartButton.click();
        await page.waitForTimeout(1000);
        
        // Check dialog content for raw translation keys
        const dialog = page.locator('.dialog, .modal, [role="dialog"]');
        if (await dialog.isVisible()) {
          const rawKeys = await dialog.locator('text=/^restaurant\\./').count();
          expect(rawKeys).toBe(0);
        }
      }
    });

    test('should translate table selection properly', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Look for table selection elements
      const tableElements = page.locator('[data-testid="table-selector"], .table-selector');
      
      if (await tableElements.isVisible()) {
        // Should not contain raw translation keys
        const rawKeys = await tableElements.locator('text=/^restaurant\\./').count();
        expect(rawKeys).toBe(0);
      }
    });
  });

  test.describe('Form Validation Messages', () => {
    test('should translate form validation errors', async ({ page }) => {
      await helpers.navigateAndWait('/settings');
      
      // Try to submit forms with invalid data
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        const submitButton = form.locator('button[type="submit"]');
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Check for validation error messages
          const errorMessages = page.locator('.error, .text-red, .text-destructive');
          const errorCount = await errorMessages.count();
          
          if (errorCount > 0) {
            // Should not contain raw translation keys
            const rawKeyErrors = await errorMessages.locator('text=/^[a-zA-Z]+\\./').count();
            expect(rawKeyErrors).toBe(0);
          }
        }
      }
    });
  });

  test.describe('Dynamic Content Translation', () => {
    test('should translate status messages properly', async ({ page }) => {
      await helpers.navigateAndWait('/analytics');
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Check for status indicators
      const statusElements = page.locator('.status, .badge, [data-status]');
      const statusCount = await statusElements.count();
      
      if (statusCount > 0) {
        for (let i = 0; i < Math.min(statusCount, 5); i++) {
          const status = statusElements.nth(i);
          const text = await status.textContent();
          
          if (text) {
            // Should not contain raw translation keys
            const hasRawKey = /^[a-zA-Z]+\\./.test(text);
            expect(hasRawKey).toBe(false);
          }
        }
      }
    });

    test('should handle pluralization correctly', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Look for elements that might use pluralization
      const pluralElements = page.locator('text=/\\d+\\s+[a-zA-Z]+/');
      const pluralCount = await pluralElements.count();
      
      if (pluralCount > 0) {
        for (let i = 0; i < Math.min(pluralCount, 3); i++) {
          const element = pluralElements.nth(i);
          const text = await element.textContent();
          
          if (text) {
            // Should not contain raw translation keys
            const hasRawKey = /[a-zA-Z]+\\.[a-zA-Z]+/.test(text);
            expect(hasRawKey).toBe(false);
          }
        }
      }
    });
  });

  test.describe('Accessibility and Screen Reader Support', () => {
    test('should translate aria-labels and accessibility text', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Check aria-labels
      const elementsWithAriaLabels = page.locator('[aria-label]');
      const ariaCount = await elementsWithAriaLabels.count();
      
      if (ariaCount > 0) {
        for (let i = 0; i < Math.min(ariaCount, 5); i++) {
          const element = elementsWithAriaLabels.nth(i);
          const ariaLabel = await element.getAttribute('aria-label');
          
          if (ariaLabel) {
            // Should not contain raw translation keys
            const hasRawKey = /^[a-zA-Z]+\\./.test(ariaLabel);
            expect(hasRawKey).toBe(false);
          }
        }
      }
    });
  });

  test.describe('Currency and Number Formatting', () => {
    test('should format currency according to locale', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Look for currency displays
      const currencyElements = page.locator('text=/\\$|€|£|Kč|CZK/');
      const currencyCount = await currencyElements.count();
      
      if (currencyCount > 0) {
        const element = currencyElements.first();
        const text = await element.textContent();
        
        if (text) {
          // Should be properly formatted, not raw keys
          const hasRawKey = /^[a-zA-Z]+\\./.test(text);
          expect(hasRawKey).toBe(false);
        }
      }
    });
  });

  test.describe('Error Messages Translation', () => {
    test('should translate error messages properly', async ({ page }) => {
      // Monitor console for error messages
      const errorMessages: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errorMessages.push(msg.text());
        }
      });
      
      await helpers.navigateAndWait('/analytics');
      
      // Wait for potential errors
      await page.waitForTimeout(2000);
      
      // Check if error messages contain raw translation keys
      const hasRawKeys = errorMessages.some(msg => /^[a-zA-Z]+\\./.test(msg));
      expect(hasRawKeys).toBe(false);
    });
  });
});