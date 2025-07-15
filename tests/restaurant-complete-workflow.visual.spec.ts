import { test, expect } from '@playwright/test';

/**
 * Complete Restaurant Workflow Visual Tests
 * Testing all restaurant operations: Host → Server → Kitchen → POS
 */

test.describe('Complete Restaurant Workflow - Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start at the main page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Server Interface - Restaurant Management Features', async ({ page }) => {
    await page.goto('/server');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of server dashboard
    await expect(page).toHaveScreenshot('server-dashboard-main.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Test floor plan view
    const floorPlanTab = page.locator('button:has-text("Floor Plan"), [data-value="floor-plan"]');
    if (await floorPlanTab.isVisible()) {
      await floorPlanTab.click();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('server-floor-plan-view.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }

    // Test reservations view
    const reservationsTab = page.locator('button:has-text("Reservations"), [data-value="reservations"]');
    if (await reservationsTab.isVisible()) {
      await reservationsTab.click();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('server-reservations-view.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }

    // Test wait list view
    const waitListTab = page.locator('button:has-text("Wait List"), [data-value="wait-list"]');
    if (await waitListTab.isVisible()) {
      await waitListTab.click();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('server-waitlist-view.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('Server Interface - Order Management', async ({ page }) => {
    await page.goto('/server');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test active orders view (default tab)
    const activeOrdersTab = page.locator('button:has-text("Active Orders"), [data-value="my-tables"]');
    if (await activeOrdersTab.isVisible()) {
      await activeOrdersTab.click();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('server-active-orders-view.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }

    // Test quick menu view
    const quickMenuTab = page.locator('button:has-text("Quick Menu"), [data-value="menu"]');
    if (await quickMenuTab.isVisible()) {
      await quickMenuTab.click();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('server-quick-menu-view.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }

    // Test new order functionality
    const newOrderButton = page.locator('button:has-text("New Order"), .new-order-btn');
    if (await newOrderButton.isVisible()) {
      await newOrderButton.click();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('server-new-order-dialog.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Close dialog
      const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('Kitchen Display System', async ({ page }) => {
    await page.goto('/kitchen');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of kitchen dashboard
    await expect(page).toHaveScreenshot('kitchen-dashboard-main.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Test kitchen ticket system
    const ticketCards = page.locator('.ticket-card, .kitchen-ticket, [data-testid="kitchen-ticket"]');
    if (await ticketCards.count() > 0) {
      await expect(page).toHaveScreenshot('kitchen-tickets-overview.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('Enhanced POS System with Restaurant Features', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of enhanced POS interface
    await expect(page).toHaveScreenshot('pos-restaurant-interface.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Test table selection in cart panel
    const cartPanel = page.locator('.cart-panel, [data-testid="cart-panel"]');
    if (await cartPanel.isVisible()) {
      await expect(cartPanel).toHaveScreenshot('pos-restaurant-cart-panel.png');
    }

    // Test table selector dialog
    const tableButton = page.locator('button:has-text("Select Table"), .table-select-btn');
    if (await tableButton.isVisible()) {
      await tableButton.click();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('pos-table-selector-dialog.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Close dialog
      const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('Floor Plan Page - Interactive Table Layout', async ({ page }) => {
    await page.goto('/floor-plan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of floor plan page
    await expect(page).toHaveScreenshot('floor-plan-page-main.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Test table interactions
    const tables = page.locator('.table, .table-element, [data-testid="table"]');
    if (await tables.count() > 0) {
      await tables.first().click();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('floor-plan-table-selected.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('Navigation Between Restaurant Modules', async ({ page }) => {
    // Test navigation from POS to Server
    await page.goto('/pos');
    await page.waitForTimeout(2000);
    
    const serverLink = page.locator('a[href="/server"], nav a:has-text("Server")');
    if (await serverLink.isVisible()) {
      await serverLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('navigation-to-server.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }

    // Test navigation to Kitchen
    const kitchenLink = page.locator('a[href="/kitchen"], nav a:has-text("Kitchen")');
    if (await kitchenLink.isVisible()) {
      await kitchenLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('navigation-to-kitchen.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('Responsive Design - Restaurant Features on Mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');
    
    // Test server interface on mobile
    await page.goto('/server');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('mobile-server-interface.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Test kitchen display on mobile
    await page.goto('/kitchen');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('mobile-kitchen-display.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Real-time Updates and WebSocket Features', async ({ page }) => {
    await page.goto('/server');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for WebSocket status indicator
    const wsStatus = page.locator('.websocket-status, [data-testid="websocket-status"]');
    if (await wsStatus.isVisible()) {
      await expect(page).toHaveScreenshot('websocket-status-indicator.png');
    }

    // Test real-time table stats
    const statsCards = page.locator('.stats-card, .stat-card, [data-testid="stats"]');
    if (await statsCards.count() > 0) {
      await expect(page).toHaveScreenshot('real-time-table-stats.png');
    }
  });

  test('Dark Mode - Restaurant Interface', async ({ page }) => {
    // Enable dark mode
    const themeToggle = page.locator('button[aria-label*="theme"], .theme-toggle, [data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(1000);
    }

    // Test dark mode server interface
    await page.goto('/server');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('dark-mode-server-interface.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Test dark mode kitchen interface
    await page.goto('/kitchen');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('dark-mode-kitchen-interface.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});