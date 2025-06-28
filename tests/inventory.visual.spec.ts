import { test, expect } from '@playwright/test';

test.describe('Inventory Management Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display inventory main page', async ({ page }) => {
    await expect(page).toHaveScreenshot('inventory-main-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should show product list layout', async ({ page }) => {
    // Look for product list or table
    const productList = page.locator('table, .product-list, .inventory-grid, .data-table').first();
    
    if (await productList.isVisible()) {
      await expect(productList).toHaveScreenshot('inventory-product-list.png');
    }
  });

  test('should display add product button and form', async ({ page }) => {
    // Look for add product button
    const addBtn = page.locator('button', { hasText: /add|create|new.*product/i }).first();
    
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);
      
      // Capture the add product modal/form
      await expect(page).toHaveScreenshot('inventory-add-product-form.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should show product editing interface', async ({ page }) => {
    // Look for edit buttons
    const editBtn = page.locator('button', { hasText: /edit|modify|update/i }).first();
    
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('inventory-edit-product-form.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should display search and filter functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name*="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('pizza');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('inventory-search-results.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should show empty inventory state', async ({ page }) => {
    // If no products are visible, capture empty state
    const noProducts = page.locator('.empty-state, .no-data, .no-products').first();
    
    if (await noProducts.isVisible()) {
      await expect(page).toHaveScreenshot('inventory-empty-state.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should display mobile inventory layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('inventory-mobile-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Categories Management Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display categories page', async ({ page }) => {
    await expect(page).toHaveScreenshot('categories-main-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should show category creation form', async ({ page }) => {
    const addBtn = page.locator('button', { hasText: /add|create|new.*category/i }).first();
    
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('categories-create-form.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should display category list with colors', async ({ page }) => {
    const categoryList = page.locator('.category-list, .categories-grid, table').first();
    
    if (await categoryList.isVisible()) {
      await expect(categoryList).toHaveScreenshot('categories-list.png');
    }
  });
});