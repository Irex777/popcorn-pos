import { test, expect } from '@playwright/test';

test.describe('UX Issues Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('High Priority UX Issues', () => {
    test('should show mobile cart height constraints issue', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Add multiple items to cart to test height constraints
      const productCards = page.locator('.product-card, [data-testid="product-card"]');
      const cardCount = await productCards.count();
      
      if (cardCount > 0) {
        // Add several items to cart
        for (let i = 0; i < Math.min(cardCount, 6); i++) {
          await productCards.nth(i).click();
          await page.waitForTimeout(300);
        }
        
        // Capture the mobile cart with many items
        await expect(page).toHaveScreenshot('mobile-cart-height-constraint-issue.png');
      }
    });

    test('should demonstrate swipe gesture feedback issue', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Add item to cart
      const productCard = page.locator('.product-card, [data-testid="product-card"]').first();
      if (await productCard.isVisible()) {
        await productCard.click();
        await page.waitForTimeout(500);
        
        // Look for swipe instruction text
        const swipeText = page.locator('text="swipe", text="Swipe"');
        if (await swipeText.isVisible()) {
          await expect(page).toHaveScreenshot('swipe-gesture-feedback.png');
        }
      }
    });

    test('should show category navigation scroll issue', async ({ page }) => {
      await page.goto('/');
      
      // Look for category navigation
      const categoryNavigation = page.locator('[data-testid="category-nav"], .category-nav, .category-filter');
      if (await categoryNavigation.isVisible()) {
        await expect(page).toHaveScreenshot('category-navigation-scroll-issue.png');
      }
    });

    test('should demonstrate search functionality missing in inventory', async ({ page }) => {
      await page.goto('/inventory');
      
      // Look for search input (should be missing)
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
      const hasSearch = await searchInput.isVisible();
      
      await expect(page).toHaveScreenshot(`inventory-search-${hasSearch ? 'present' : 'missing'}.png`);
    });
  });

  test.describe('FloorPlan Mode Switching UX Issues', () => {
    test('should show confusing mode switching in floor plan', async ({ page }) => {
      await page.goto('/floor-plan');
      
      // Look for mode switching buttons
      const modeButtons = page.locator('button:has-text("View"), button:has-text("Edit"), button:has-text("Arrange")');
      if (await modeButtons.first().isVisible()) {
        await expect(page).toHaveScreenshot('floor-plan-mode-switching.png');
        
        // Test switching modes
        await modeButtons.nth(1).click();
        await page.waitForTimeout(500);
        await expect(page).toHaveScreenshot('floor-plan-edit-mode.png');
      }
    });

    test('should demonstrate table collision detection issue', async ({ page }) => {
      await page.goto('/floor-plan');
      
      // Switch to arrange mode if available
      const arrangeButton = page.locator('button:has-text("Arrange")');
      if (await arrangeButton.isVisible()) {
        await arrangeButton.click();
        await page.waitForTimeout(500);
        
        // Try to drag tables close together
        const tables = page.locator('.table, [data-testid="table"]');
        if (await tables.count() > 1) {
          await expect(page).toHaveScreenshot('table-collision-detection.png');
        }
      }
    });
  });

  test.describe('Analytics UX Issues', () => {
    test('should show category IDs instead of names issue', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForTimeout(2000);
      
      // Look for charts with category data
      const chartElements = page.locator('.recharts-wrapper, [data-testid="chart"]');
      if (await chartElements.first().isVisible()) {
        await expect(page).toHaveScreenshot('analytics-category-ids-issue.png');
      }
    });

    test('should demonstrate responsive chart issues', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/analytics');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('analytics-mobile-responsive-issue.png');
    });
  });

  test.describe('Settings Page Complexity Issues', () => {
    test('should show overwhelming settings form complexity', async ({ page }) => {
      await page.goto('/settings');
      
      // Scroll to see the full form
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page).toHaveScreenshot('settings-top-section.png');
      
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await expect(page).toHaveScreenshot('settings-middle-section.png');
      
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(page).toHaveScreenshot('settings-bottom-section.png');
    });

    test('should demonstrate inconsistent validation feedback', async ({ page }) => {
      await page.goto('/settings');
      
      // Try to interact with different form fields
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('123'); // Short password
        await passwordInput.blur();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('settings-validation-feedback.png');
      }
    });
  });

  test.describe('Navigation and Accessibility Issues', () => {
    test('should show missing breadcrumb navigation', async ({ page }) => {
      await page.goto('/inventory');
      
      // Look for breadcrumb navigation
      const breadcrumb = page.locator('.breadcrumb, [data-testid="breadcrumb"]');
      const hasBreadcrumb = await breadcrumb.isVisible();
      
      await expect(page).toHaveScreenshot(`breadcrumb-${hasBreadcrumb ? 'present' : 'missing'}.png`);
    });

    test('should demonstrate keyboard navigation issues', async ({ page }) => {
      await page.goto('/');
      
      // Use keyboard navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('keyboard-navigation-focus.png');
    });

    test('should show touch target size issues on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Look for small buttons/targets
      const buttons = page.locator('button, .btn, [role="button"]');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        // Highlight button areas to show touch target sizes
        await page.addStyleTag({
          content: `
            button, .btn, [role="button"] {
              outline: 2px solid red !important;
              outline-offset: 2px !important;
            }
          `
        });
        
        await expect(page).toHaveScreenshot('touch-target-sizes.png');
      }
    });
  });

  test.describe('Color and Contrast Issues', () => {
    test('should demonstrate table status color inconsistencies', async ({ page }) => {
      await page.goto('/floor-plan');
      
      // Look for table status indicators
      const statusElements = page.locator('.table-status, [data-testid="table-status"]');
      if (await statusElements.first().isVisible()) {
        await expect(page).toHaveScreenshot('table-status-colors.png');
      }
      
      // Now check table selector component
      const tableSelector = page.locator('.table-selector, [data-testid="table-selector"]');
      if (await tableSelector.isVisible()) {
        await expect(page).toHaveScreenshot('table-selector-colors.png');
      }
    });

    test('should show potential contrast issues', async ({ page }) => {
      await page.goto('/');
      
      // Add high contrast highlighting to check text readability
      await page.addStyleTag({
        content: `
          * {
            filter: contrast(2) !important;
          }
        `
      });
      
      await expect(page).toHaveScreenshot('high-contrast-mode.png');
    });
  });

  test.describe('Form and Input Issues', () => {
    test('should demonstrate product image URL validation missing', async ({ page }) => {
      await page.goto('/inventory');
      
      await page.click('button:has-text("Add Product")');
      
      // Try to enter invalid image URL
      const imageInput = page.locator('input[name="image"], input[placeholder*="image" i]');
      if (await imageInput.isVisible()) {
        await imageInput.fill('not-a-valid-url');
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('image-url-validation-missing.png');
      }
    });

    test('should show checkout dialog payment method confusion', async ({ page }) => {
      await page.goto('/');
      
      // Add item to cart
      const productCard = page.locator('.product-card, [data-testid="product-card"]').first();
      if (await productCard.isVisible()) {
        await productCard.click();
        await page.waitForTimeout(500);
        
        // Open checkout
        const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Pay")');
        if (await checkoutButton.isVisible()) {
          await checkoutButton.click();
          await page.waitForTimeout(500);
          
          await expect(page).toHaveScreenshot('checkout-payment-method-confusion.png');
        }
      }
    });
  });

  test.describe('Performance and Loading Issues', () => {
    test('should show loading states duration', async ({ page }) => {
      // Clear cache to simulate slow loading
      await page.evaluate(() => {
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
      });
      
      await page.goto('/analytics');
      
      // Capture loading state
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('analytics-loading-duration.png');
      
      // Wait for full load
      await page.waitForTimeout(3000);
      await expect(page).toHaveScreenshot('analytics-fully-loaded.png');
    });

    test('should demonstrate WebSocket connection indicators missing', async ({ page }) => {
      await page.goto('/');
      
      // Look for connection status indicators
      const connectionIndicator = page.locator('.connection-status, [data-testid="connection-status"]');
      const hasIndicator = await connectionIndicator.isVisible();
      
      await expect(page).toHaveScreenshot(`connection-indicator-${hasIndicator ? 'present' : 'missing'}.png`);
    });
  });

  test.describe('Responsive Design Issues', () => {
    test('should show desktop-first design problems on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test different pages for mobile-first issues
      await page.goto('/analytics');
      await expect(page).toHaveScreenshot('mobile-analytics-design-issues.png');
      
      await page.goto('/settings');
      await expect(page).toHaveScreenshot('mobile-settings-design-issues.png');
      
      await page.goto('/inventory');
      await expect(page).toHaveScreenshot('mobile-inventory-design-issues.png');
    });

    test('should demonstrate tablet layout issues', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/');
      await expect(page).toHaveScreenshot('tablet-pos-layout-issues.png');
      
      await page.goto('/analytics');
      await expect(page).toHaveScreenshot('tablet-analytics-layout-issues.png');
    });
  });
});