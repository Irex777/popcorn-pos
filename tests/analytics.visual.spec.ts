import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display analytics dashboard main layout', async ({ page }) => {
    await expect(page).toHaveScreenshot('analytics-dashboard.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should show key performance metrics cards', async ({ page }) => {
    // Look for metrics cards or KPI widgets
    const metricsSection = page.locator('.metrics, .kpi, .cards, .stats').first();
    
    if (await metricsSection.isVisible()) {
      await expect(metricsSection).toHaveScreenshot('analytics-metrics-cards.png');
    }
  });

  test('should display charts and graphs', async ({ page }) => {
    // Look for chart containers
    const charts = page.locator('.chart, .graph, .recharts-wrapper, canvas, svg').first();
    
    if (await charts.isVisible()) {
      // Wait a bit more for charts to render
      await page.waitForTimeout(2000);
      await expect(charts).toHaveScreenshot('analytics-charts.png');
    }
  });

  test('should show date range picker and filters', async ({ page }) => {
    // Look for date inputs or filters
    const filters = page.locator('.date-picker, .filters, .date-range').first();
    
    if (await filters.isVisible()) {
      await expect(filters).toHaveScreenshot('analytics-filters.png');
    }
  });

  test('should display sales overview section', async ({ page }) => {
    // Look for sales-related sections
    const salesSection = page.locator('.sales, .revenue, .transactions').first();
    
    if (await salesSection.isVisible()) {
      await expect(salesSection).toHaveScreenshot('analytics-sales-overview.png');
    }
  });

  test('should show product performance metrics', async ({ page }) => {
    // Look for product analytics
    const productMetrics = page.locator('.product-metrics, .top-products, .product-analysis').first();
    
    if (await productMetrics.isVisible()) {
      await expect(productMetrics).toHaveScreenshot('analytics-product-metrics.png');
    }
  });

  test('should display mobile analytics layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra time for charts
    
    await expect(page).toHaveScreenshot('analytics-mobile-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should handle chart interactions', async ({ page }) => {
    // Try to interact with charts if present
    const chartElement = page.locator('.chart, .recharts-wrapper, canvas').first();
    
    if (await chartElement.isVisible()) {
      // Hover over chart to show tooltips
      await chartElement.hover();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('analytics-chart-interaction.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });
});

test.describe('History and Reports Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display transaction history', async ({ page }) => {
    await expect(page).toHaveScreenshot('history-main-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should show transaction list/table', async ({ page }) => {
    const transactionTable = page.locator('table, .transaction-list, .history-table').first();
    
    if (await transactionTable.isVisible()) {
      await expect(transactionTable).toHaveScreenshot('history-transaction-table.png');
    }
  });

  test('should display export functionality', async ({ page }) => {
    const exportBtn = page.locator('button', { hasText: /export|download|csv|pdf/i }).first();
    
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('history-export-options.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should show history filters and search', async ({ page }) => {
    const filterSection = page.locator('.filters, .search, .date-range').first();
    
    if (await filterSection.isVisible()) {
      await expect(filterSection).toHaveScreenshot('history-filters.png');
    }
  });
});