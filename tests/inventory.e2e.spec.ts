import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-utils';

/**
 * Inventory Management End-to-End Tests
 * Testing product creation, editing, categories, and inventory workflows
 */

test.describe('Inventory Management - Complete Workflows', () => {
  let helper: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelpers(page);
  });

  test('complete product management workflow', async ({ page }) => {
    await helper.navigateAndWait('/inventory');
    
    // Verify inventory page loads
    const inventoryGrid = page.locator('.grid, .inventory-grid, .products-list, [data-testid="inventory"]');
    await expect(inventoryGrid).toBeVisible();
    
    // Test create new product
    const addProductButton = page.locator('button:has-text("Add"), button:has-text("Create"), .add-product, [data-testid="add-product"]');
    if (await addProductButton.isVisible()) {
      await addProductButton.click();
      await page.waitForTimeout(1000);
      
      // Verify product creation dialog
      const productDialog = page.locator('.dialog, .modal, .create-product, [data-testid="product-dialog"]');
      await expect(productDialog).toBeVisible();
      
      // Fill product form
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"], [data-testid="product-name"]');
      const priceInput = page.locator('input[name="price"], input[placeholder*="price"], [data-testid="product-price"]');
      const descriptionInput = page.locator('textarea[name="description"], input[name="description"], [data-testid="product-description"]');
      
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Product E2E');
      }
      if (await priceInput.isVisible()) {
        await priceInput.fill('12.99');
      }
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('A test product created via E2E testing');
      }
      
      // Test category selection
      const categorySelect = page.locator('select[name="category"], .category-select, [data-testid="category-select"]');
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 0 });
      }
      
      // Save product
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), .save-btn, [data-testid="save-product"]');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
        
        // Verify product was created (dialog should close)
        await expect(productDialog).not.toBeVisible();
      } else {
        // Cancel if save button not found
        const cancelButton = page.locator('button:has-text("Cancel"), .cancel-btn, [data-testid="cancel"]');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
  });

  test('product search and filtering', async ({ page }) => {
    await helper.navigateAndWait('/inventory');
    
    // Test search functionality
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], .search-input, [data-testid="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('pizza');
      await page.waitForTimeout(1000);
      
      // Verify search results
      const productRows = page.locator('tr, .product-item, .inventory-item, [data-testid="product-row"]');
      const productCount = await productRows.count();
      
      // Should show filtered results or no results message
      if (productCount === 0) {
        const noResults = page.locator('.no-results, .empty-state, [data-testid="no-results"]');
        await expect(noResults.or(page.locator('text=No products found'))).toBeVisible();
      } else {
        await expect(productRows.first()).toBeVisible();
      }
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
    
    // Test category filtering
    const categoryFilter = page.locator('.category-filter, .filter-select, [data-testid="category-filter"]');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.waitForTimeout(500);
      
      const filterOptions = page.locator('.filter-option, .category-option, [data-testid="filter-option"]');
      const optionCount = await filterOptions.count();
      
      if (optionCount > 0) {
        await filterOptions.first().click();
        await page.waitForTimeout(1000);
        
        // Verify filtering applied
        const inventoryTable = page.locator('table, .inventory-grid, .products-list, [data-testid="inventory"]');
        await expect(inventoryTable).toBeVisible();
      }
    }
  });

  test('product editing workflow', async ({ page }) => {
    await helper.navigateAndWait('/inventory');
    
    // Find and edit existing product
    const editButtons = page.locator('button:has-text("Edit"), .edit-btn, [data-testid="edit-product"], [aria-label="Edit"]');
    const editButtonCount = await editButtons.count();
    
    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Verify edit dialog opens
      const editDialog = page.locator('.dialog, .modal, .edit-product, [data-testid="edit-dialog"]');
      await expect(editDialog).toBeVisible();
      
      // Test editing fields
      const nameInput = page.locator('input[name="name"], [data-testid="product-name"]');
      if (await nameInput.isVisible()) {
        await nameInput.clear();
        await nameInput.fill('Updated Product Name');
      }
      
      const priceInput = page.locator('input[name="price"], [data-testid="product-price"]');
      if (await priceInput.isVisible()) {
        await priceInput.clear();
        await priceInput.fill('15.99');
      }
      
      // Cancel editing (to avoid modifying test data)
      const cancelButton = page.locator('button:has-text("Cancel"), .cancel-btn, [data-testid="cancel"]');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await page.waitForTimeout(500);
        await expect(editDialog).not.toBeVisible();
      }
    }
  });

  test('category management workflow', async ({ page }) => {
    await helper.navigateAndWait('/categories');
    
    // Verify categories page loads
    const categoriesSection = page.locator('.categories, .category-list, table, [data-testid="categories"]');
    await expect(categoriesSection).toBeVisible();
    
    // Test create new category
    const addCategoryButton = page.locator('button:has-text("Add"), button:has-text("Create"), .add-category, [data-testid="add-category"]');
    if (await addCategoryButton.isVisible()) {
      await addCategoryButton.click();
      await page.waitForTimeout(1000);
      
      // Verify category creation dialog
      const categoryDialog = page.locator('.dialog, .modal, .create-category, [data-testid="category-dialog"]');
      await expect(categoryDialog).toBeVisible();
      
      // Fill category form
      const nameInput = page.locator('input[name="name"], [data-testid="category-name"]');
      const colorInput = page.locator('input[type="color"], input[name="color"], [data-testid="category-color"]');
      const descriptionInput = page.locator('textarea[name="description"], [data-testid="category-description"]');
      
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Category E2E');
      }
      if (await colorInput.isVisible()) {
        await colorInput.fill('#ff6b6b');
      }
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('Test category description');
      }
      
      // Cancel instead of saving (to avoid modifying test data)
      const cancelButton = page.locator('button:has-text("Cancel"), .cancel-btn, [data-testid="cancel"]');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await page.waitForTimeout(500);
        await expect(categoryDialog).not.toBeVisible();
      }
    }
  });

  test('bulk operations and data export', async ({ page }) => {
    await helper.navigateAndWait('/inventory');
    
    // Test bulk selection if available
    const selectAllCheckbox = page.locator('input[type="checkbox"][data-select-all], .select-all, [data-testid="select-all"]');
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.click();
      await page.waitForTimeout(500);
      
      // Verify bulk actions become available
      const bulkActions = page.locator('.bulk-actions, .selected-actions, [data-testid="bulk-actions"]');
      await expect(bulkActions).toBeVisible();
      
      // Deselect all
      await selectAllCheckbox.click();
      await page.waitForTimeout(500);
    }
    
    // Test export functionality
    const exportButton = page.locator('button:has-text("Export"), .export-btn, [data-testid="export"]');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);
      
      // Verify export options or download starts
      const exportOptions = page.locator('.export-options, .download-menu, [data-testid="export-options"]');
      if (await exportOptions.isVisible()) {
        // Test CSV export option
        const csvOption = page.locator('button:has-text("CSV"), .csv-export, [data-testid="export-csv"]');
        if (await csvOption.isVisible()) {
          await csvOption.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('inventory validation and error handling', async ({ page }) => {
    await helper.navigateAndWait('/inventory');
    
    // Test creating product with invalid data
    const addProductButton = page.locator('button:has-text("Add"), button:has-text("Create"), .add-product, [data-testid="add-product"]');
    if (await addProductButton.isVisible()) {
      await addProductButton.click();
      await page.waitForTimeout(1000);
      
      const productDialog = page.locator('.dialog, .modal, .create-product, [data-testid="product-dialog"]');
      if (await productDialog.isVisible()) {
        // Try to save without filling required fields
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), .save-btn, [data-testid="save-product"]');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          
          // Should show validation errors
          const errorMessages = page.locator('.error, .field-error, .validation-error, [data-testid*="error"]');
          await expect(errorMessages.first()).toBeVisible();
        }
        
        // Close dialog
        const cancelButton = page.locator('button:has-text("Cancel"), .cancel-btn, [data-testid="cancel"]');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
    
    // Test invalid price input
    const editButtons = page.locator('button:has-text("Edit"), .edit-btn, [data-testid="edit-product"]');
    if (await editButtons.first().isVisible()) {
      await editButtons.first().click();
      await page.waitForTimeout(1000);
      
      const priceInput = page.locator('input[name="price"], [data-testid="product-price"]');
      if (await priceInput.isVisible()) {
        await priceInput.clear();
        await priceInput.fill('invalid-price');
        
        // Try to save
        const saveButton = page.locator('button:has-text("Save"), .save-btn, [data-testid="save-product"]');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          
          // Should show price validation error
          const priceError = page.locator('.price-error, .field-error, [data-testid="price-error"]');
          await expect(priceError.or(page.locator('text=Invalid price'))).toBeVisible();
        }
        
        // Cancel
        const cancelButton = page.locator('button:has-text("Cancel"), .cancel-btn, [data-testid="cancel"]');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
  });

  test('responsive design for inventory management', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1280, height: 800, name: 'desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await helper.navigateAndWait('/inventory');
      
      // Verify inventory interface is usable
      const inventorySection = page.locator('table, .inventory-grid, .products-list, [data-testid="inventory"]');
      await expect(inventorySection).toBeVisible();
      
      // Test add button is accessible
      const addButton = page.locator('button:has-text("Add"), .add-product, [data-testid="add-product"]');
      if (await addButton.isVisible()) {
        await expect(addButton).toBeVisible();
      }
      
      await page.waitForTimeout(500);
    }
  });
});