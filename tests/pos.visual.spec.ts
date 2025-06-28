import { test, expect } from '@playwright/test';

test.describe('POS Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to POS page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for any loading animations to complete
    await page.waitForTimeout(1000);
  });

  test('should display POS main interface correctly', async ({ page }) => {
    // Take full page screenshot of the main POS interface
    await expect(page).toHaveScreenshot('pos-main-interface.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should show product grid layout', async ({ page }) => {
    // Focus on the product grid area
    const productGrid = page.locator('[data-testid="product-grid"], .grid');
    
    if (await productGrid.isVisible()) {
      await expect(productGrid).toHaveScreenshot('product-grid.png');
    } else {
      // Take full page if no specific grid found
      await expect(page).toHaveScreenshot('pos-product-area.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should display cart panel correctly', async ({ page }) => {
    // Look for cart or sidebar area
    const cartPanel = page.locator('[data-testid="cart-panel"], aside, .cart, .sidebar').first();
    
    if (await cartPanel.isVisible()) {
      await expect(cartPanel).toHaveScreenshot('cart-panel.png');
    }
    
    // Also capture the full page to see overall layout
    await expect(page).toHaveScreenshot('pos-with-cart.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should handle product selection interaction', async ({ page }) => {
    // Try to click on the first available product
    const products = page.locator('.product, .card, button').filter({ hasText: /pizza|burger|coffee|drink/i });
    
    if (await products.count() > 0) {
      const firstProduct = products.first();
      await firstProduct.click();
      
      // Wait for any UI updates
      await page.waitForTimeout(500);
      
      // Capture the state after selection
      await expect(page).toHaveScreenshot('pos-after-product-selection.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should display checkout workflow', async ({ page }) => {
    // Look for checkout button or similar
    const checkoutBtn = page.locator('button', { hasText: /checkout|pay|order/i }).first();
    
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.click();
      await page.waitForTimeout(500);
      
      // Capture checkout modal or page
      await expect(page).toHaveScreenshot('checkout-workflow.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should show empty cart state', async ({ page }) => {
    // Capture the initial empty state
    await expect(page).toHaveScreenshot('pos-empty-cart.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should display navigation and header correctly', async ({ page }) => {
    // Focus on header/navigation area
    const header = page.locator('header, nav, .header, .navigation').first();
    
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('pos-header-navigation.png');
    }
  });
});

test.describe('POS Responsive Design Tests', () => {
  test('should display correctly on mobile device', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('pos-mobile-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should display correctly on tablet device', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('pos-tablet-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should display correctly on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('pos-desktop-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});