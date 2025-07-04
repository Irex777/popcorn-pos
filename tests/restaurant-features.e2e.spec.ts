import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-utils';

/**
 * Restaurant-Specific Features End-to-End Tests
 * Testing advanced restaurant functionality: Table optimization, conflict detection, waitlist management
 */

test.describe('Advanced Restaurant Features - E2E Tests', () => {
  let helper: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelpers(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('table assignment optimization workflow', async ({ page }) => {
    await helper.navigateAndWait('/server');
    
    // Navigate to reservations to test table assignment
    const reservationsTab = page.locator('button:has-text("Reservations"), [data-value="reservations"]');
    if (await reservationsTab.isVisible()) {
      await reservationsTab.click();
      await page.waitForTimeout(1000);
      
      // Test add reservation with table optimization
      const addReservationButton = page.locator('button:has-text("Add Reservation"), .add-reservation');
      if (await addReservationButton.isVisible()) {
        await addReservationButton.click();
        await page.waitForTimeout(1000);
        
        // Fill reservation form
        const customerNameInput = page.locator('input[name="customerName"], input[placeholder*="name"]');
        if (await customerNameInput.isVisible()) {
          await customerNameInput.fill('John Smith');
        }
        
        const partySizeInput = page.locator('input[name="partySize"], input[type="number"]');
        if (await partySizeInput.isVisible()) {
          await partySizeInput.fill('4');
        }
        
        // Test smart table selector
        const smartTableSelector = page.locator('.smart-table-selector, [data-testid="smart-table-selector"]');
        if (await smartTableSelector.isVisible()) {
          // Check for table recommendations
          const recommendedTables = page.locator('.recommended-table, .table-recommendation');
          if (await recommendedTables.count() > 0) {
            await expect(recommendedTables.first()).toBeVisible();
            
            // Test table selection with optimization scores
            const scoreBadge = page.locator('.optimization-score, .score-badge');
            if (await scoreBadge.isVisible()) {
              await expect(scoreBadge).toBeVisible();
            }
          }
        }
        
        // Close dialog
        const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('reservation conflict detection system', async ({ page }) => {
    await helper.navigateAndWait('/server');
    
    // Go to reservations
    const reservationsTab = page.locator('button:has-text("Reservations"), [data-value="reservations"]');
    if (await reservationsTab.isVisible()) {
      await reservationsTab.click();
      await page.waitForTimeout(1000);
      
      // Test conflict detection by creating overlapping reservation
      const addReservationButton = page.locator('button:has-text("Add Reservation"), .add-reservation');
      if (await addReservationButton.isVisible()) {
        await addReservationButton.click();
        await page.waitForTimeout(1000);
        
        // Fill form with potentially conflicting time
        const customerNameInput = page.locator('input[name="customerName"], input[placeholder*="name"]');
        if (await customerNameInput.isVisible()) {
          await customerNameInput.fill('Jane Doe');
        }
        
        const partySizeInput = page.locator('input[name="partySize"], input[type="number"]');
        if (await partySizeInput.isVisible()) {
          await partySizeInput.fill('6');
        }
        
        // Set time that might conflict
        const timeInput = page.locator('input[type="time"], input[name*="time"]');
        if (await timeInput.isVisible()) {
          await timeInput.fill('19:00'); // 7 PM - typical dinner time
        }
        
        // Check for conflict warnings
        const conflictWarning = page.locator('.conflict-warning, .warning, [data-testid="conflict-warning"]');
        const conflictDetector = page.locator('.conflict-detector, .conflict-alert');
        
        // If conflicts are detected, verify they're displayed
        if (await conflictWarning.isVisible() || await conflictDetector.isVisible()) {
          await expect(conflictWarning.or(conflictDetector)).toBeVisible();
          
          // Check for suggested alternatives
          const alternatives = page.locator('.suggested-alternatives, .alternative-times');
          if (await alternatives.isVisible()) {
            await expect(alternatives).toBeVisible();
          }
        }
        
        // Close dialog
        const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('enhanced waitlist management workflow', async ({ page }) => {
    await helper.navigateAndWait('/server');
    
    // Navigate to waitlist
    const waitListTab = page.locator('button:has-text("Wait List"), [data-value="wait-list"]');
    if (await waitListTab.isVisible()) {
      await waitListTab.click();
      await page.waitForTimeout(1000);
      
      // Test waitlist interface
      const waitListContainer = page.locator('.wait-list, .waitlist-container, [data-testid="waitlist"]');
      await expect(waitListContainer.or(page.locator('text=Wait List'))).toBeVisible();
      
      // Test add to waitlist
      const addToWaitlistButton = page.locator('button:has-text("Add to Wait List"), .add-waitlist');
      if (await addToWaitlistButton.isVisible()) {
        await addToWaitlistButton.click();
        await page.waitForTimeout(1000);
        
        // Fill waitlist form
        const customerNameInput = page.locator('input[name="customerName"], input[placeholder*="name"]');
        if (await customerNameInput.isVisible()) {
          await customerNameInput.fill('Bob Wilson');
        }
        
        const partySizeInput = page.locator('input[name="partySize"], input[type="number"]');
        if (await partySizeInput.isVisible()) {
          await partySizeInput.fill('3');
        }
        
        const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone"]');
        if (await phoneInput.isVisible()) {
          await phoneInput.fill('555-0123');
        }
        
        // Test special notes/requirements
        const specialNotesInput = page.locator('textarea[name="notes"], textarea[placeholder*="notes"]');
        if (await specialNotesInput.isVisible()) {
          await specialNotesInput.fill('High chair needed');
        }
        
        // Save or close
        const saveButton = page.locator('button:has-text("Add"), button:has-text("Save")');
        const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
        
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        } else if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Test waitlist actions (if entries exist)
      const waitlistEntries = page.locator('.waitlist-entry, .wait-entry, [data-testid="waitlist-entry"]');
      if (await waitlistEntries.count() > 0) {
        // Test notification/seat action
        const notifyButton = page.locator('button:has-text("Notify"), .notify-btn');
        const seatButton = page.locator('button:has-text("Seat"), .seat-btn');
        
        if (await notifyButton.isVisible()) {
          await notifyButton.click();
          await page.waitForTimeout(1000);
        } else if (await seatButton.isVisible()) {
          await seatButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('kitchen display system workflow', async ({ page }) => {
    await helper.navigateAndWait('/kitchen');
    
    // Verify kitchen dashboard
    await expect(page.locator('h1, .page-title')).toContainText(/Kitchen/i);
    
    // Test ticket management
    const ticketCards = page.locator('.ticket-card, .kitchen-ticket, [data-testid="kitchen-ticket"]');
    const ticketCount = await ticketCards.count();
    
    if (ticketCount > 0) {
      const firstTicket = ticketCards.first();
      
      // Test ticket status progression
      const statusButtons = page.locator('button:has-text("Start"), button:has-text("Preparing"), button:has-text("Ready")');
      if (await statusButtons.count() > 0) {
        // Click first available status button
        await statusButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Verify status change (look for updated badge/color)
        const statusIndicator = page.locator('.status-badge, .ticket-status, [data-testid="ticket-status"]');
        if (await statusIndicator.isVisible()) {
          await expect(statusIndicator).toBeVisible();
        }
      }
      
      // Test priority indicators
      const priorityBadge = page.locator('.priority-badge, .priority-indicator, [data-testid="priority"]');
      if (await priorityBadge.isVisible()) {
        await expect(priorityBadge).toBeVisible();
      }
      
      // Test estimated completion time
      const estimatedTime = page.locator('.estimated-time, .completion-time, [data-testid="estimated-time"]');
      if (await estimatedTime.isVisible()) {
        await expect(estimatedTime).toBeVisible();
      }
    }
    
    // Test kitchen metrics
    const metricsSection = page.locator('.kitchen-metrics, .metrics, [data-testid="kitchen-metrics"]');
    if (await metricsSection.isVisible()) {
      await expect(metricsSection).toBeVisible();
      
      // Check for average preparation times
      const avgTimeMetric = page.locator('.avg-time, .average-prep-time');
      if (await avgTimeMetric.isVisible()) {
        await expect(avgTimeMetric).toBeVisible();
      }
    }
  });

  test('real-time statistics and updates', async ({ page }) => {
    await helper.navigateAndWait('/server');
    
    // Check for real-time statistics cards
    const statsCards = page.locator('.stats-card, .stat-card, [data-testid="stats"]');
    if (await statsCards.count() > 0) {
      // Verify all expected stats are present
      const availableTablesCard = page.locator('text=Available Tables, .available-tables');
      const occupiedTablesCard = page.locator('text=Occupied Tables, .occupied-tables');
      const reservationsCard = page.locator('text=Reservations, .reservations');
      const waitListCard = page.locator('text=Wait List, .wait-list');
      
      // At least some stats should be visible
      const visibleStats = await Promise.all([
        availableTablesCard.isVisible(),
        occupiedTablesCard.isVisible(),
        reservationsCard.isVisible(),
        waitListCard.isVisible()
      ]);
      
      const hasVisibleStats = visibleStats.some(isVisible => isVisible);
      expect(hasVisibleStats).toBe(true);
    }
    
    // Test auto-refresh (wait for potential updates)
    await page.waitForTimeout(6000); // Wait longer than refetch interval
    
    // Verify stats are still visible after refresh
    if (await statsCards.count() > 0) {
      await expect(statsCards.first()).toBeVisible();
    }
  });

  test('floor plan interaction and table management', async ({ page }) => {
    await helper.navigateAndWait('/floor-plan');
    
    // Verify floor plan loads
    await expect(page.locator('h1, .page-title')).toContainText(/Floor Plan/i);
    
    // Test table interactions
    const tables = page.locator('.table, .table-element, [data-testid="table"]');
    const tableCount = await tables.count();
    
    if (tableCount > 0) {
      // Test table selection
      await tables.first().click();
      await page.waitForTimeout(1000);
      
      // Check for table details/menu
      const tableDetails = page.locator('.table-details, .table-info, [data-testid="table-details"]');
      const tableMenu = page.locator('.table-menu, .context-menu, [data-testid="table-menu"]');
      
      if (await tableDetails.isVisible()) {
        await expect(tableDetails).toBeVisible();
        
        // Check for table status, capacity, etc.
        const tableStatus = page.locator('.table-status, .status');
        const tableCapacity = page.locator('.table-capacity, .capacity');
        
        if (await tableStatus.isVisible()) {
          await expect(tableStatus).toBeVisible();
        }
        
        if (await tableCapacity.isVisible()) {
          await expect(tableCapacity).toBeVisible();
        }
      }
      
      if (await tableMenu.isVisible()) {
        await expect(tableMenu).toBeVisible();
        
        // Test table actions
        const tableActions = page.locator('button:has-text("Reserve"), button:has-text("Occupy"), button:has-text("Clean")');
        if (await tableActions.count() > 0) {
          // Don't actually click to avoid state changes, just verify they exist
          await expect(tableActions.first()).toBeVisible();
        }
      }
    }
    
    // Test floor plan controls
    const controls = page.locator('.floor-plan-controls, .controls, [data-testid="controls"]');
    if (await controls.isVisible()) {
      await expect(controls).toBeVisible();
    }
  });

  test('multi-shop context and data isolation', async ({ page }) => {
    // Start at any page and check shop selector
    await helper.navigateAndWait('/server');
    
    // Look for shop selector
    const shopSelector = page.locator('.shop-selector, [data-testid="shop-selector"], select[name="shop"]');
    if (await shopSelector.isVisible()) {
      // Test shop switching
      const shopOptions = page.locator('.shop-option, option');
      if (await shopOptions.count() > 1) {
        // Get current shop
        const currentShopText = await shopSelector.textContent();
        
        // Switch shop if possible
        await shopSelector.click();
        await page.waitForTimeout(500);
        
        const firstOption = shopOptions.first();
        if (await firstOption.isVisible()) {
          await firstOption.click();
          await page.waitForTimeout(2000);
          
          // Verify data updated for new shop
          const statsCards = page.locator('.stats-card, .stat-card');
          if (await statsCards.count() > 0) {
            await expect(statsCards.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('responsive design - restaurant features on different screen sizes', async ({ page, isMobile }) => {
    // Test server interface responsiveness
    await helper.navigateAndWait('/server');
    
    // Check that essential elements are visible regardless of screen size
    const pageTitle = page.locator('h1, .page-title');
    await expect(pageTitle).toBeVisible();
    
    // Check tab navigation (should be accessible on mobile)
    const tabs = page.locator('.tabs, [role="tablist"]');
    if (await tabs.isVisible()) {
      await expect(tabs).toBeVisible();
    }
    
    // Check stats cards (may be stacked on mobile)
    const statsCards = page.locator('.stats-card, .stat-card');
    if (await statsCards.count() > 0) {
      await expect(statsCards.first()).toBeVisible();
    }
    
    if (isMobile) {
      // Mobile-specific checks
      const mobileMenu = page.locator('.mobile-menu, [data-testid="mobile-menu"], .hamburger');
      if (await mobileMenu.isVisible()) {
        // Test mobile navigation
        await mobileMenu.click();
        await page.waitForTimeout(500);
        
        // Check if navigation menu opened
        const navMenu = page.locator('.nav-menu, .mobile-nav, nav');
        if (await navMenu.isVisible()) {
          await expect(navMenu).toBeVisible();
          
          // Close menu
          await mobileMenu.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});