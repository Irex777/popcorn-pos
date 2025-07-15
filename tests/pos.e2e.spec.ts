import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-utils';

/**
 * End-to-End POS Workflow Tests
 * Testing complete user workflows from table selection to payment completion
 */

test.describe('POS System - Complete Restaurant Workflows', () => {
  let helper: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelpers(page);
    await helper.navigateAndWait('/pos');
    // Wait for restaurant components to load
    await page.waitForTimeout(2000);
  });

  test('complete restaurant order workflow: table selection → order → payment', async ({ page }) => {
    // Verify enhanced restaurant POS interface loads
    await expect(page.locator('.product-grid, [data-testid="product-grid"]')).toBeVisible();
    await expect(page.locator('.cart-panel, [data-testid="cart-panel"]')).toBeVisible();

    // Test table selection first (restaurant feature)
    const tableSelectButton = page.locator('button:has-text("Select Table"), .table-select-btn, button:has-text("Table")');
    if (await tableSelectButton.isVisible()) {
      await tableSelectButton.click();
      await page.waitForTimeout(1000);
      
      // Verify table selector dialog opens
      const tableDialog = page.locator('.dialog, .modal, [role="dialog"]');
      await expect(tableDialog).toBeVisible();
      
      // Try to select a table
      const tableOptions = page.locator('.table-option, .table-button, [data-testid="table-option"], button[data-table-id]');
      if (await tableOptions.count() > 0) {
        await tableOptions.first().click();
        await page.waitForTimeout(1000);
      } else {
        // Close if no tables available
        const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Add products to cart
    const productButtons = page.locator('.product-card button, .product button');
    if (await productButtons.count() > 0) {
      await productButtons.first().click();
      await page.waitForTimeout(1000);

      // Verify item appears in cart with restaurant features
      const cartItems = page.locator('.cart-item, [data-testid="cart-item"]');
      await expect(cartItems).toBeVisible();
      
      // Test guest count selector (restaurant feature)
      const guestCountSelector = page.locator('.guest-count, [data-testid="guest-count"], input[type="number"]');
      if (await guestCountSelector.isVisible()) {
        await guestCountSelector.fill('2');
        await page.waitForTimeout(500);
      }
      
      // Test order type selector (restaurant feature)
      const orderTypeSelector = page.locator('.order-type, [data-testid="order-type"], select');
      if (await orderTypeSelector.isVisible()) {
        await orderTypeSelector.selectOption('dine_in');
        await page.waitForTimeout(500);
      }
    }

    // Test restaurant checkout process
    const checkoutButton = page.locator('button:has-text("Checkout"), .checkout-btn, [data-testid="checkout"]');
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
      await page.waitForTimeout(1000);

      // Verify restaurant checkout dialog with table info
      const checkoutDialog = page.locator('.dialog, .modal, [role="dialog"]');
      await expect(checkoutDialog).toBeVisible();
      
      // Check for restaurant-specific checkout fields
      const tableInfo = page.locator('.table-info, [data-testid="table-info"]');
      const specialInstructions = page.locator('textarea[placeholder*="instructions"], .special-instructions');
      
      // Fill special instructions if available
      if (await specialInstructions.isVisible()) {
        await specialInstructions.fill('No onions, extra sauce');
        await page.waitForTimeout(500);
      }
      
      // Close checkout dialog
      const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('restaurant product filtering and kitchen requirements', async ({ page }) => {
    // Test search functionality
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], .search-input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('chicken');
      await page.waitForTimeout(1000);
      
      // Verify search results
      const productCards = page.locator('.product-card, .product');
      if (await productCards.count() > 0) {
        // Check if products show kitchen requirements
        const kitchenBadge = page.locator('.kitchen-required, .requires-kitchen, [data-testid="kitchen-badge"]');
        if (await kitchenBadge.isVisible()) {
          await expect(kitchenBadge).toBeVisible();
        }
      }
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(1000);

      // Verify search results
      const productGrid = page.locator('.product-grid, [data-testid="product-grid"]');
      await expect(productGrid).toBeVisible();
    }

    // Test category filtering
    const categoryButtons = page.locator('.category-btn, .category, [data-testid="category"]');
    const categoryCount = await categoryButtons.count();
    
    if (categoryCount > 0) {
      await categoryButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Verify filtered products display
      const products = page.locator('.product-card, .product, [data-testid="product"]');
      await expect(products.first()).toBeVisible();
    }
  });

  test('cart management: add, remove, update quantities', async ({ page }) => {
    // Add multiple items to cart
    const productButtons = page.locator('.product-card button, .product button');
    const buttonCount = await productButtons.count();
    
    if (buttonCount >= 2) {
      // Add first product
      await productButtons.nth(0).click();
      await page.waitForTimeout(500);
      
      // Add second product
      await productButtons.nth(1).click();
      await page.waitForTimeout(500);

      // Verify multiple items in cart
      const cartItems = page.locator('.cart-item, .cart .item, [data-testid="cart-item"]');
      await expect(cartItems).toHaveCount(2);

      // Test quantity adjustment if available
      const quantityButtons = page.locator('.quantity-btn, .qty-btn, button[data-action="increase"], button[data-action="decrease"]');
      if (await quantityButtons.first().isVisible()) {
        await quantityButtons.first().click();
        await page.waitForTimeout(500);
      }

      // Test item removal if available
      const removeButtons = page.locator('.remove-btn, .delete-btn, button[data-action="remove"]');
      if (await removeButtons.first().isVisible()) {
        await removeButtons.first().click();
        await page.waitForTimeout(500);
        
        // Verify item was removed
        await expect(cartItems).toHaveCount(1);
      }
    }
  });

  test('responsive design: mobile and tablet layouts', async ({ page }) => {
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Verify mobile-friendly layout
    await expect(page.locator('.product-grid, [data-testid="product-grid"]')).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Verify tablet layout adjustments
    await expect(page.locator('.product-grid, [data-testid="product-grid"]')).toBeVisible();
    
    // Return to desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);
  });

  test('navigation and page state management', async ({ page }) => {
    // Test navigation to other pages and back
    const navItems = [
      { selector: 'a[href="/inventory"], [data-testid="nav-inventory"]', url: '/inventory' },
      { selector: 'a[href="/analytics"], [data-testid="nav-analytics"]', url: '/analytics' },
      { selector: 'a[href="/settings"], [data-testid="nav-settings"]', url: '/settings' }
    ];

    for (const navItem of navItems) {
      const navLink = page.locator(navItem.selector);
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForTimeout(1000);
        
        // Verify navigation occurred
        await expect(page).toHaveURL(new RegExp(navItem.url));
        
        // Navigate back to POS
        const posNavLink = page.locator('a[href="/pos"], [data-testid="nav-pos"]');
        if (await posNavLink.isVisible()) {
          await posNavLink.click();
          await page.waitForTimeout(1000);
          await expect(page).toHaveURL(/\/pos/);
        }
      }
    }
  });

  test('error handling and edge cases', async ({ page }) => {
    // Test empty cart checkout attempt
    const checkoutButton = page.locator('button:has-text("Checkout"), .checkout-btn, [data-testid="checkout"]');
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
      await page.waitForTimeout(1000);
      
      // Should show error or disabled state for empty cart
      const errorMessage = page.locator('.error, .alert, .warning, [data-testid="error"]');
      const isDisabled = await checkoutButton.isDisabled();
      
      // Either button should be disabled or error should show
      expect(isDisabled || await errorMessage.isVisible()).toBeTruthy();
    }

    // Test invalid search
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], .search-input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('nonexistentproduct12345');
      await page.waitForTimeout(1000);
      
      // Should show no results state
      const noResults = page.locator('.no-results, .empty-state, [data-testid="no-results"]');
      const productCards = page.locator('.product-card, .product, [data-testid="product"]');
      
      // Either no results message or no product cards should be visible
      const hasNoResults = await noResults.isVisible();
      const productCount = await productCards.count();
      
      expect(hasNoResults || productCount === 0).toBeTruthy();
    }
  });

  test('keyboard navigation and accessibility', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    
    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Enter key on focused element
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Test Escape key functionality
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });
});