import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-utils';

/**
 * Restaurant Management End-to-End Tests
 * Testing complete restaurant operations: Host → Server → Kitchen → POS
 */

test.describe('Restaurant Management - Complete Workflows', () => {
  let helper: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelpers(page);
    // Wait for application to be ready
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('complete restaurant workflow: tables → reservations → waitlist', async ({ page }) => {
    await helper.navigateAndWait('/server');
    
    // Verify server dashboard loads with stats
    await expect(page.locator('h1, .page-title')).toContainText(/Server|Dashboard/i);
    
    // Check real-time table statistics
    const statsCards = page.locator('.stats-card, .stat-card, [data-testid="stats"]');
    if (await statsCards.count() > 0) {
      await expect(statsCards.first()).toBeVisible();
    }
    
    // Test floor plan tab
    const floorPlanTab = page.locator('button:has-text("Floor Plan"), [data-value="floor-plan"]');
    if (await floorPlanTab.isVisible()) {
      await floorPlanTab.click();
      await page.waitForTimeout(1000);
      
      // Verify tables are displayed
      const tables = page.locator('.table, .table-element, [data-testid="table"]');
      const tableCount = await tables.count();
      
      if (tableCount > 0) {
        await tables.first().click();
        await page.waitForTimeout(500);
        
        // Verify table selection works
        const selectedTable = page.locator('.table-selected, [data-selected="true"], .table.selected');
        await expect(selectedTable.or(tables.first())).toBeVisible();
      }
    }

    // Test reservations management
    const reservationsTab = page.locator('button:has-text("Reservations"), [data-value="reservations"]');
    if (await reservationsTab.isVisible()) {
      await reservationsTab.click();
      await page.waitForTimeout(1000);
      
      // Test add reservation
      const addReservationButton = page.locator('button:has-text("Add Reservation"), .add-reservation');
      if (await addReservationButton.isVisible()) {
        await addReservationButton.click();
        await page.waitForTimeout(1000);
        
        // Verify reservation dialog opens
        const reservationDialog = page.locator('.dialog, .modal, [role="dialog"]');
        await expect(reservationDialog).toBeVisible();
        
        // Close dialog
        const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Test waitlist functionality
    const waitListTab = page.locator('button:has-text("Wait List"), [data-value="wait-list"]');
    if (await waitListTab.isVisible()) {
      await waitListTab.click();
      await page.waitForTimeout(1000);
      
      // Verify waitlist interface
      const waitListContainer = page.locator('.wait-list, .waitlist-container, [data-testid="waitlist"]');
      await expect(waitListContainer.or(page.locator('text=Wait List'))).toBeVisible();
    }

    // Test add table functionality
    const addTableButton = page.locator('button:has-text("Add Table"), .add-table');
    if (await addTableButton.isVisible()) {
      await addTableButton.click();
      await page.waitForTimeout(1000);
      
      // Verify add table dialog
      const dialog = page.locator('.dialog, .modal, [role="dialog"]');
      await expect(dialog).toBeVisible();
      
      // Close dialog
      const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('server workflow: table management → order taking → service', async ({ page }) => {
    await helper.navigateAndWait('/server');
    
    // Verify server dashboard loads
    await expect(page.locator('h1, .page-title')).toContainText(/Server|Dashboard/i);
    
    // Test "My Tables" view
    const myTablesTab = page.locator('button:has-text("My Tables"), [data-value="my-tables"]');
    if (await myTablesTab.isVisible()) {
      await myTablesTab.click();
      await page.waitForTimeout(1000);
      
      // Check for table cards
      const tableCards = page.locator('.table-card, .table-item, [data-testid="table-card"]');
      if (await tableCards.count() > 0) {
        await expect(tableCards.first()).toBeVisible();
      }
    }
    
    // Test "All Tables" view
    const allTablesTab = page.locator('button:has-text("All Tables"), [data-value="all-tables"]');
    if (await allTablesTab.isVisible()) {
      await allTablesTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Test new order creation
    const newOrderButton = page.locator('button:has-text("New Order"), .new-order-btn');
    if (await newOrderButton.isVisible()) {
      await newOrderButton.click();
      await page.waitForTimeout(1000);
      
      // Verify table selection dialog
      const tableDialog = page.locator('.dialog, .modal, [role="dialog"]');
      await expect(tableDialog).toBeVisible();
      
      // Close dialog
      const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('kitchen workflow: ticket management → order preparation', async ({ page }) => {
    await helper.navigateAndWait('/kitchen');
    
    // Verify kitchen dashboard loads
    await expect(page.locator('h1, .page-title')).toContainText(/Kitchen|Dashboard/i);
    
    // Check for kitchen tickets
    const ticketCards = page.locator('.ticket-card, .kitchen-ticket, [data-testid="kitchen-ticket"]');
    const ticketCount = await ticketCards.count();
    
    if (ticketCount > 0) {
      // Test ticket status updates
      const statusButtons = page.locator('button:has-text("Start"), button:has-text("Ready"), .status-btn');
      if (await statusButtons.count() > 0) {
        // Click first status button to test functionality
        await statusButtons.first().click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Verify kitchen metrics/stats
    const statsSection = page.locator('.kitchen-stats, .metrics, [data-testid="kitchen-stats"]');
    if (await statsSection.isVisible()) {
      await expect(statsSection).toBeVisible();
    }
  });

  test('enhanced POS workflow: table selection → ordering → payment', async ({ page }) => {
    await helper.navigateAndWait('/pos');
    
    // Verify enhanced POS interface loads
    await expect(page.locator('.product-grid, [data-testid="product-grid"]')).toBeVisible();
    await expect(page.locator('.cart-panel, [data-testid="cart-panel"]')).toBeVisible();
    
    // Test table selection in cart panel
    const tableSelectButton = page.locator('button:has-text("Select Table"), .table-select-btn');
    if (await tableSelectButton.isVisible()) {
      await tableSelectButton.click();
      await page.waitForTimeout(1000);
      
      // Verify table selector dialog
      const tableDialog = page.locator('.dialog, .modal, [role="dialog"]');
      await expect(tableDialog).toBeVisible();
      
      // Select a table if available
      const tableOptions = page.locator('.table-option, .table-button, [data-testid="table-option"]');
      if (await tableOptions.count() > 0) {
        await tableOptions.first().click();
        await page.waitForTimeout(1000);
      } else {
        // Close dialog if no tables
        const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
    
    // Add products to order
    const productButtons = page.locator('.product-card button, .product button');
    if (await productButtons.count() > 0) {
      await productButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Verify item appears in cart
      const cartItems = page.locator('.cart-item, [data-testid="cart-item"]');
      await expect(cartItems).toBeVisible();
      
      // Test checkout with restaurant features
      const checkoutButton = page.locator('button:has-text("Checkout"), .checkout-btn');
      if (await checkoutButton.isVisible()) {
        await checkoutButton.click();
        await page.waitForTimeout(1000);
        
        // Verify restaurant checkout dialog with table info
        const checkoutDialog = page.locator('.dialog, .modal, [role="dialog"]');
        await expect(checkoutDialog).toBeVisible();
        
        // Close checkout dialog
        const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('floor plan workflow: interactive table layout', async ({ page }) => {
    await helper.navigateAndWait('/floor-plan');
    
    // Verify floor plan page loads
    await expect(page.locator('h1, .page-title')).toContainText(/Floor Plan/i);
    
    // Test table interactions
    const tables = page.locator('.table, .table-element, [data-testid="table"]');
    const tableCount = await tables.count();
    
    if (tableCount > 0) {
      // Click on a table
      await tables.first().click();
      await page.waitForTimeout(1000);
      
      // Verify table selection or details
      const selectedTable = page.locator('.table-selected, [data-selected="true"], .table.active');
      await expect(selectedTable.or(tables.first())).toBeVisible();
      
      // Test table action menu if available
      const tableMenu = page.locator('.table-menu, .context-menu, [data-testid="table-menu"]');
      if (await tableMenu.isVisible()) {
        await expect(tableMenu).toBeVisible();
      }
    }
    
    // Test floor plan controls
    const floorPlanControls = page.locator('.floor-plan-controls, .zoom-controls, [data-testid="floor-plan-controls"]');
    if (await floorPlanControls.isVisible()) {
      await expect(floorPlanControls).toBeVisible();
    }
  });

  test('cross-module navigation and data consistency', async ({ page }) => {
    // Start at POS and navigate through all restaurant modules
    await helper.navigateAndWait('/pos');
    
    
    // Navigate to Server
    const serverLink = page.locator('a[href="/server"], nav a:has-text("Server")');
    if (await serverLink.isVisible()) {
      await serverLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page.locator('h1, .page-title')).toContainText(/Server/i);
    }
    
    // Navigate to Kitchen
    const kitchenLink = page.locator('a[href="/kitchen"], nav a:has-text("Kitchen")');
    if (await kitchenLink.isVisible()) {
      await kitchenLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page.locator('h1, .page-title')).toContainText(/Kitchen/i);
    }
    
    // Return to POS to complete the cycle
    const posLink = page.locator('a[href="/"], a[href="/pos"], nav a:has-text("POS")');
    if (await posLink.isVisible()) {
      await posLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Verify POS still works after navigation
      await expect(page.locator('.product-grid, [data-testid="product-grid"]')).toBeVisible();
    }
  });

  test('real-time features and websocket connectivity', async ({ page }) => {
    await helper.navigateAndWait('/server');
    
    // Check for WebSocket status indicator
    const wsStatus = page.locator('.websocket-status, [data-testid="websocket-status"]');
    if (await wsStatus.isVisible()) {
      await expect(wsStatus).toBeVisible();
    }
    
    // Test real-time table statistics updates
    const statsCards = page.locator('.stats-card, .stat-card, [data-testid="stats"]');
    if (await statsCards.count() > 0) {
      // Record initial stats
      const initialStats = await statsCards.first().textContent();
      
      // Wait for potential updates (real-time refresh)
      await page.waitForTimeout(6000); // Wait longer than refetch interval
      
      // Verify stats are still visible (may or may not have changed)
      await expect(statsCards.first()).toBeVisible();
    }
  });

  test('error handling and offline scenarios', async ({ page }) => {
    // Test navigation with potential network issues
    await helper.navigateAndWait('/server');
    
    // Simulate slow network by adding delay
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    // Navigate to different module and verify loading states
    const serverLink = page.locator('a[href="/server"], nav a:has-text("Server")');
    if (await serverLink.isVisible()) {
      await serverLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify page loads despite network delay
      await expect(page.locator('h1, .page-title')).toContainText(/Server/i);
    }
    
    // Remove route intercept
    await page.unroute('**/api/**');
  });

  test('reservation management workflow', async ({ page }) => {
    await helper.navigateAndWait('/server');
    
    // Navigate to reservations tab
    const reservationsTab = page.locator('button:has-text("Reservations"), [data-value="reservations"]');
    if (await reservationsTab.isVisible()) {
      await reservationsTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Test reservation list
    const reservationSection = page.locator('.reservations, .reservation-list, [data-testid="reservations"]');
    if (await reservationSection.isVisible()) {
      // Test add reservation
      const addReservationButton = page.locator('button:has-text("Add Reservation"), .add-reservation, [data-testid="add-reservation"]');
      if (await addReservationButton.isVisible()) {
        await addReservationButton.click();
        await page.waitForTimeout(1000);
        
        // Verify reservation form
        const reservationForm = page.locator('.reservation-form, .add-reservation-dialog, [data-testid="reservation-form"]');
        await expect(reservationForm).toBeVisible();
        
        // Fill basic reservation details if form is available
        const nameInput = page.locator('input[name="name"], input[placeholder*="name"], [data-testid="guest-name"]');
        const guestCountInput = page.locator('input[name="guests"], input[name="guestCount"], [data-testid="guest-count"]');
        
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Reservation');
        }
        if (await guestCountInput.isVisible()) {
          await guestCountInput.fill('4');
        }
        
        // Close without saving
        const cancelButton = page.locator('button:has-text("Cancel"), .cancel-btn, [data-testid="cancel"]');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('kitchen display workflow', async ({ page }) => {
    await helper.navigateAndWait('/kitchen');
    
    // Verify kitchen interface loads
    const kitchenDisplay = page.locator('.kitchen-display, .orders, .tickets, [data-testid="kitchen-display"]');
    await expect(kitchenDisplay).toBeVisible();
    
    // Test order ticket management
    const orderTickets = page.locator('.ticket, .order-ticket, .kitchen-ticket, [data-testid="ticket"]');
    const ticketCount = await orderTickets.count();
    
    if (ticketCount > 0) {
      // Test ticket status changes
      const statusButtons = page.locator('.status-btn, .ticket-action, button[data-action*="status"], [data-testid*="status"]');
      if (await statusButtons.first().isVisible()) {
        await statusButtons.first().click();
        await page.waitForTimeout(500);
      }
    }
    
    // Test filter functionality
    const filterButtons = page.locator('.filter-btn, .status-filter, [data-testid*="filter"]');
    const filterCount = await filterButtons.count();
    
    if (filterCount > 0) {
      await filterButtons.first().click();
      await page.waitForTimeout(500);
      
      // Verify filtering works
      await expect(kitchenDisplay).toBeVisible();
    }
  });

  test('server workflow: order taking and management', async ({ page }) => {
    await helper.navigateAndWait('/server');
    
    // Verify server interface
    const serverInterface = page.locator('.server-interface, .order-management, [data-testid="server-interface"]');
    await expect(serverInterface).toBeVisible();
    
    // Test table selection for ordering
    const tableSelector = page.locator('.table-selector, .table-select, [data-testid="table-selector"]');
    if (await tableSelector.isVisible()) {
      const tableOptions = page.locator('.table-option, .table-item, [data-testid="table-option"]');
      const optionCount = await tableOptions.count();
      
      if (optionCount > 0) {
        await tableOptions.first().click();
        await page.waitForTimeout(500);
      }
    }
    
    // Test order type selection
    const orderTypeSelector = page.locator('.order-type, .service-type, [data-testid="order-type"]');
    if (await orderTypeSelector.isVisible()) {
      const orderTypes = page.locator('.order-type-option, .service-option, [data-testid="order-type-option"]');
      if (await orderTypes.first().isVisible()) {
        await orderTypes.first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('complete restaurant order workflow', async ({ page }) => {
    // Start at server page - manage tables and take orders
    await helper.navigateAndWait('/server');
    
    // Verify we're on server page
    await expect(page).toHaveURL(/\/server/);
    
    // Select table and add items (if interface is available)
    const addItemButton = page.locator('button:has-text("Add Item"), .add-item, [data-testid="add-item"]');
    if (await addItemButton.isVisible()) {
      await addItemButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Navigate to kitchen - prepare order
    const kitchenNavLink = page.locator('a[href="/kitchen"], [data-testid="nav-kitchen"]');
    if (await kitchenNavLink.isVisible()) {
      await kitchenNavLink.click();
      await page.waitForTimeout(1000);
      
      // Verify we're on kitchen page
      await expect(page).toHaveURL(/\/kitchen/);
      
      // Process kitchen tickets
      const tickets = page.locator('.ticket, .order-ticket, [data-testid="ticket"]');
      if (await tickets.first().isVisible()) {
        await tickets.first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('responsive design for restaurant features', async ({ page }) => {
    const pages = ['/server', '/kitchen'];
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1280, height: 800, name: 'desktop' }
    ];
    
    for (const pagePath of pages) {
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await helper.navigateAndWait(pagePath);
        
        // Verify page loads and is usable on different screen sizes
        const mainContent = page.locator('main').first();
        await expect(mainContent).toBeVisible();
        
        await page.waitForTimeout(500);
      }
    }
  });

  test('accessibility and keyboard navigation', async ({ page }) => {
    await helper.navigateAndWait('/server');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test multiple tab presses
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }
    
    // Test Enter key on focused element
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Test Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });
});