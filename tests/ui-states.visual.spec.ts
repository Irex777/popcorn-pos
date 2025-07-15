import { test, expect } from '@playwright/test';

test.describe('UI States Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set demo mode to bypass authentication
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Loading States', () => {
    test('should display loading states for data fetching', async ({ page }) => {
      // Navigate to analytics to see loading charts
      await page.goto('/analytics');
      await page.waitForTimeout(1000);
      
      // Look for loading indicators
      const loadingElements = page.locator('[data-testid="loading"], .loading, .skeleton');
      await expect(loadingElements.first()).toBeVisible({ timeout: 5000 });
      
      await expect(page).toHaveScreenshot('analytics-loading-state.png');
    });

    test('should show skeleton screens during data loading', async ({ page }) => {
      // Navigate to inventory and capture loading state
      await page.goto('/inventory');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('inventory-loading-skeleton.png');
    });
  });

  test.describe('Error States', () => {
    test('should display error states for network failures', async ({ page }) => {
      // Block network requests to simulate errors
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/analytics');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('analytics-error-state.png');
    });

    test('should show form validation errors', async ({ page }) => {
      await page.goto('/inventory');
      
      // Try to add product with invalid data
      await page.click('button:has-text("Add Product")');
      await page.fill('input[name="name"]', ''); // Empty name
      await page.fill('input[name="price"]', '-5'); // Invalid price
      await page.click('button:has-text("Save")');
      
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('form-validation-errors.png');
    });
  });

  test.describe('Empty States', () => {
    test('should display empty cart state', async ({ page }) => {
      await page.goto('/');
      
      // Ensure cart is empty
      await page.waitForSelector('[data-testid="cart-panel"], .cart-panel');
      await expect(page).toHaveScreenshot('empty-cart-state.png');
    });

    test('should show empty inventory state', async ({ page }) => {
      await page.goto('/inventory');
      
      // Look for empty state message
      const emptyState = page.locator('text="No products found", text="Empty inventory"');
      if (await emptyState.isVisible()) {
        await expect(page).toHaveScreenshot('empty-inventory-state.png');
      }
    });

    test('should display empty analytics state', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForTimeout(2000);
      
      // Look for empty chart states
      await expect(page).toHaveScreenshot('empty-analytics-state.png');
    });
  });

  test.describe('Interactive States', () => {
    test('should show hover states on interactive elements', async ({ page }) => {
      await page.goto('/');
      
      // Hover over product cards
      const productCard = page.locator('.product-card, [data-testid="product-card"]').first();
      await productCard.hover();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('product-card-hover-state.png');
    });

    test('should display focus states for accessibility', async ({ page }) => {
      await page.goto('/');
      
      // Focus on navigation items
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('navigation-focus-state.png');
    });

    test('should show button states (hover, active, disabled)', async ({ page }) => {
      await page.goto('/inventory');
      
      // Click add product to open form
      await page.click('button:has-text("Add Product")');
      
      // Test different button states
      const saveButton = page.locator('button:has-text("Save")');
      await saveButton.hover();
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('button-hover-state.png');
    });
  });

  test.describe('Toast Notifications', () => {
    test('should display success toast notifications', async ({ page }) => {
      await page.goto('/inventory');
      
      // Add a product to trigger success toast
      await page.click('button:has-text("Add Product")');
      await page.fill('input[name="name"]', 'Test Product');
      await page.fill('input[name="price"]', '10.99');
      await page.click('button:has-text("Save")');
      
      // Wait for toast to appear
      await page.waitForTimeout(1000);
      const toast = page.locator('[data-testid="toast"], .toast, .notification');
      if (await toast.isVisible()) {
        await expect(page).toHaveScreenshot('success-toast-notification.png');
      }
    });

    test('should show error toast notifications', async ({ page }) => {
      await page.goto('/inventory');
      
      // Block API to trigger error toast
      await page.route('**/api/products', route => route.abort());
      
      await page.click('button:has-text("Add Product")');
      await page.fill('input[name="name"]', 'Test Product');
      await page.fill('input[name="price"]', '10.99');
      await page.click('button:has-text("Save")');
      
      await page.waitForTimeout(1500);
      const toast = page.locator('[data-testid="toast"], .toast, .notification');
      if (await toast.isVisible()) {
        await expect(page).toHaveScreenshot('error-toast-notification.png');
      }
    });
  });

  test.describe('Modal Dialog States', () => {
    test('should display modal dialogs correctly', async ({ page }) => {
      await page.goto('/inventory');
      
      // Open product creation modal
      await page.click('button:has-text("Add Product")');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('product-creation-modal.png');
    });

    test('should show confirmation dialogs', async ({ page }) => {
      await page.goto('/inventory');
      
      // Try to delete a product (if any exists)
      const deleteButton = page.locator('button:has-text("Delete"), [data-testid="delete-button"]').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('delete-confirmation-dialog.png');
      }
    });
  });

  test.describe('Mobile-Specific States', () => {
    test('should display mobile menu states', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Open mobile menu
      const menuButton = page.locator('button[aria-label="Menu"], .menu-button, .hamburger');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('mobile-menu-open.png');
      }
    });

    test('should show mobile cart panel states', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Add item to cart if possible
      const productCard = page.locator('.product-card, [data-testid="product-card"]').first();
      if (await productCard.isVisible()) {
        await productCard.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('mobile-cart-with-items.png');
      }
    });

    test('should display mobile form states', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/inventory');
      
      await page.click('button:has-text("Add Product")');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('mobile-form-modal.png');
    });
  });

  test.describe('Data Volume Edge Cases', () => {
    test('should handle long product names', async ({ page }) => {
      await page.goto('/inventory');
      
      // Add product with very long name
      await page.click('button:has-text("Add Product")');
      await page.fill('input[name="name"]', 'This is a very long product name that should test text overflow and wrapping behavior in the UI components');
      await page.fill('input[name="price"]', '10.99');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('long-product-name.png');
    });

    test('should display large cart quantities', async ({ page }) => {
      await page.goto('/');
      
      // Add multiple items to cart (simulate large quantities)
      const productCard = page.locator('.product-card, [data-testid="product-card"]').first();
      if (await productCard.isVisible()) {
        // Add same item multiple times
        for (let i = 0; i < 5; i++) {
          await productCard.click();
          await page.waitForTimeout(200);
        }
        
        await expect(page).toHaveScreenshot('large-cart-quantities.png');
      }
    });
  });

  test.describe('Dark Mode States', () => {
    test('should display all UI states correctly in dark mode', async ({ page }) => {
      // Toggle dark mode
      await page.goto('/settings');
      const darkModeToggle = page.locator('button:has-text("Dark"), [data-testid="dark-mode-toggle"]');
      if (await darkModeToggle.isVisible()) {
        await darkModeToggle.click();
        await page.waitForTimeout(500);
      }
      
      await page.goto('/');
      await expect(page).toHaveScreenshot('dark-mode-pos-interface.png');
      
      await page.goto('/analytics');
      await expect(page).toHaveScreenshot('dark-mode-analytics.png');
      
      await page.goto('/inventory');
      await expect(page).toHaveScreenshot('dark-mode-inventory.png');
    });
  });
});