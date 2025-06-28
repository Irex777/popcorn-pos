import { test, expect } from '@playwright/test';

test.describe('Settings Page Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display settings page layout', async ({ page }) => {
    await expect(page).toHaveScreenshot('settings-main-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should show user preferences section', async ({ page }) => {
    const preferencesCard = page.locator('section').filter({ hasText: 'Preferences' }).first();
    
    if (await preferencesCard.isVisible()) {
      await expect(preferencesCard).toHaveScreenshot('settings-preferences-section.png');
    }
  });

  test('should display language selection', async ({ page }) => {
    const languageSelect = page.locator('button[role="combobox"]').filter({ hasText: /Czech|English|Deutsch/i }).first();
    
    if (await languageSelect.isVisible()) {
      await languageSelect.click();
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('settings-language-dropdown.png');
    }
  });

  test('should show currency settings for admin', async ({ page }) => {
    const currencySelect = page.locator('button[role="combobox"]').filter({ hasText: /CZK|USD|EUR/i }).first();
    
    if (await currencySelect.isVisible()) {
      await currencySelect.click();
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('settings-currency-dropdown.png');
    }
  });

  test('should display account security section', async ({ page }) => {
    const securitySection = page.locator('section').filter({ hasText: 'Account' }).first();
    
    if (await securitySection.isVisible()) {
      await expect(securitySection).toHaveScreenshot('settings-account-security.png');
    }
  });

  test('should show password change form', async ({ page }) => {
    const passwordForm = page.locator('form').filter({ has: page.locator('input[name="currentPassword"]') }).first();
    
    if (await passwordForm.isVisible()) {
      await expect(passwordForm).toHaveScreenshot('settings-password-form.png');
    }
  });
});

test.describe('Settings Admin Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display app name settings for admin', async ({ page }) => {
    const appNameSection = page.locator('section').filter({ hasText: 'Popcorn POS' }).first();
    
    if (await appNameSection.isVisible()) {
      await expect(appNameSection).toHaveScreenshot('settings-app-name-section.png');
    }
  });

  test('should show shop management section', async ({ page }) => {
    const shopSection = page.locator('section').filter({ hasText: 'Shop Management' }).first();
    
    if (await shopSection.isVisible()) {
      await expect(shopSection).toHaveScreenshot('settings-shop-management.png');
    }
  });

  test('should display create shop form', async ({ page }) => {
    const createShopCard = page.locator('form[id="createShopForm"]').first();
    
    if (await createShopCard.isVisible()) {
      await expect(createShopCard).toHaveScreenshot('settings-create-shop-form.png');
    }
  });

  test('should show existing shops list', async ({ page }) => {
    const existingShopsCard = page.locator('div').filter({ hasText: 'Existing Shops' }).first();
    
    if (await existingShopsCard.isVisible()) {
      await expect(existingShopsCard).toHaveScreenshot('settings-existing-shops.png');
    }
  });

  test('should display user management section', async ({ page }) => {
    const userSection = page.locator('section').filter({ hasText: 'User Management' }).first();
    
    if (await userSection.isVisible()) {
      await expect(userSection).toHaveScreenshot('settings-user-management.png');
    }
  });

  test('should show create user form', async ({ page }) => {
    const createUserForm = page.locator('form[id="createUserForm"]').first();
    
    if (await createUserForm.isVisible()) {
      await expect(createUserForm).toHaveScreenshot('settings-create-user-form.png');
    }
  });

  test('should display user type selection', async ({ page }) => {
    const userTypeSection = page.locator('div').filter({ hasText: 'User Type' }).first();
    
    if (await userTypeSection.isVisible()) {
      await expect(userTypeSection).toHaveScreenshot('settings-user-type-selection.png');
      
      // Test admin user selection
      const adminRadio = page.locator('input[id="admin-user"]');
      if (await adminRadio.isVisible()) {
        await adminRadio.click();
        await page.waitForTimeout(300);
        await expect(page.locator('form[id="createUserForm"]')).toHaveScreenshot('settings-admin-user-selected.png');
      }
    }
  });

  test('should show existing users list', async ({ page }) => {
    const existingUsersCard = page.locator('div').filter({ hasText: 'Existing Users' }).first();
    
    if (await existingUsersCard.isVisible()) {
      await expect(existingUsersCard).toHaveScreenshot('settings-existing-users.png');
    }
  });

  test('should display Stripe settings section', async ({ page }) => {
    const stripeSection = page.locator('section').filter({ hasText: 'Stripe Settings' }).first();
    
    if (await stripeSection.isVisible()) {
      await expect(stripeSection).toHaveScreenshot('settings-stripe-section.png');
    }
  });

  test('should show Stripe configuration form', async ({ page }) => {
    const stripeForm = page.locator('form').filter({ has: page.locator('input[name="publishableKey"]') }).first();
    
    if (await stripeForm.isVisible()) {
      await expect(stripeForm).toHaveScreenshot('settings-stripe-form.png');
    }
  });

  test('should display system test section', async ({ page }) => {
    const systemTestSection = page.locator('section').filter({ hasText: 'System Test' }).first();
    
    if (await systemTestSection.isVisible()) {
      await expect(systemTestSection).toHaveScreenshot('settings-system-test.png');
    }
  });

  test('should show shop deletion buttons', async ({ page }) => {
    const existingShopsCard = page.locator('div').filter({ hasText: 'Manage Shops' }).first();
    
    if (await existingShopsCard.isVisible()) {
      // Look for delete buttons (trash icons) in shop rows
      const deleteButtons = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' });
      
      if (await deleteButtons.count() > 0) {
        await expect(existingShopsCard).toHaveScreenshot('settings-shops-with-delete-buttons.png');
      }
    }
  });

  test('should test shop deletion button appearance', async ({ page }) => {
    const existingShopsCard = page.locator('div').filter({ hasText: 'Manage Shops' }).first();
    
    if (await existingShopsCard.isVisible()) {
      // Find a delete button (trash icon with destructive styling)
      const deleteButton = page.locator('button').filter({ has: page.locator('svg[class*="text-destructive"]') }).first();
      
      if (await deleteButton.isVisible()) {
        // Hover over the delete button to show any hover states
        await deleteButton.hover();
        await page.waitForTimeout(300);
        
        await expect(existingShopsCard).toHaveScreenshot('settings-shop-delete-button-hover.png');
      }
    }
  });
});

test.describe('Settings Form Interactions Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should test password change form validation', async ({ page }) => {
    const currentPasswordInput = page.locator('input[name="currentPassword"]');
    const newPasswordInput = page.locator('input[name="newPassword"]');
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    
    if (await currentPasswordInput.isVisible()) {
      await currentPasswordInput.fill('oldpassword');
      await newPasswordInput.fill('newpassword123');
      await confirmPasswordInput.fill('newpassword123');
      
      await expect(page.locator('form').filter({ has: currentPasswordInput })).toHaveScreenshot('settings-password-form-filled.png');
    }
  });

  test('should test shop creation form', async ({ page }) => {
    const shopNameInput = page.locator('input[name="name"]').first();
    const shopAddressInput = page.locator('input[name="address"]').first();
    
    if (await shopNameInput.isVisible()) {
      await shopNameInput.fill('Test Shop Name');
      await shopAddressInput.fill('123 Test Street, Test City');
      
      await expect(page.locator('form[id="createShopForm"]')).toHaveScreenshot('settings-shop-form-filled.png');
    }
  });

  test('should test user creation form with shop assignment', async ({ page }) => {
    const usernameInput = page.locator('input[name="username"]').last();
    const passwordInput = page.locator('input[name="password"]').last();
    
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('testuser');
      await passwordInput.fill('testpassword123');
      
      // Select regular user
      const regularUserRadio = page.locator('input[id="regular-user"]');
      if (await regularUserRadio.isVisible()) {
        await regularUserRadio.click();
        await page.waitForTimeout(300);
        
        // Try to check a shop assignment
        const firstShopCheckbox = page.locator('input[name="shopIds"]').first();
        if (await firstShopCheckbox.isVisible()) {
          await firstShopCheckbox.check();
          await page.waitForTimeout(300);
        }
        
        await expect(page.locator('form[id="createUserForm"]')).toHaveScreenshot('settings-user-form-with-shops.png');
      }
    }
  });

  test('should test Stripe settings form', async ({ page }) => {
    const publishableKeyInput = page.locator('input[name="publishableKey"]');
    const secretKeyInput = page.locator('input[name="secretKey"]');
    const enabledCheckbox = page.locator('input[name="enabled"]');
    
    if (await publishableKeyInput.isVisible()) {
      await publishableKeyInput.fill('pk_test_1234567890');
      await secretKeyInput.fill('sk_test_0987654321');
      
      if (await enabledCheckbox.isVisible()) {
        await enabledCheckbox.check();
      }
      
      await expect(page.locator('form').filter({ has: publishableKeyInput })).toHaveScreenshot('settings-stripe-form-filled.png');
    }
  });

  test('should test shop deletion confirmation handling', async ({ page }) => {
    const existingShopsCard = page.locator('div').filter({ hasText: 'Manage Shops' }).first();
    
    if (await existingShopsCard.isVisible()) {
      // Find a delete button (trash icon)
      const deleteButton = page.locator('button').filter({ has: page.locator('svg[class*="text-destructive"]') }).first();
      
      if (await deleteButton.isVisible()) {
        // Mock the confirm dialog to return false (cancel)
        await page.evaluate(() => {
          window.confirm = () => false;
        });
        
        // Click the delete button
        await deleteButton.click();
        await page.waitForTimeout(300);
        
        // Take screenshot showing the state after cancel
        await expect(existingShopsCard).toHaveScreenshot('settings-shop-delete-cancelled.png');
      }
    }
  });
});

test.describe('Settings Modal Dialogs Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should open edit user dialog', async ({ page }) => {
    const editUserButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).first();
    
    if (await editUserButton.isVisible()) {
      await editUserButton.click();
      await page.waitForTimeout(500);
      
      const dialog = page.locator('div[role="dialog"]');
      if (await dialog.isVisible()) {
        await expect(dialog).toHaveScreenshot('settings-edit-user-dialog.png');
      }
    }
  });

  test('should open edit shop dialog', async ({ page }) => {
    const editShopButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    
    if (await editShopButton.isVisible()) {
      await editShopButton.click();
      await page.waitForTimeout(500);
      
      const dialog = page.locator('div[role="dialog"]');
      if (await dialog.isVisible()) {
        await expect(dialog).toHaveScreenshot('settings-edit-shop-dialog.png');
      }
    }
  });
});

test.describe('Error Pages Visual Tests', () => {
  test('should display 404 not found page', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('404-not-found.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should show payment success page', async ({ page }) => {
    await page.goto('/payment/success');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('payment-success-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should show payment cancel page', async ({ page }) => {
    await page.goto('/payment/cancel');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('payment-cancel-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Dark Mode Visual Tests', () => {
  test('should display all pages correctly in dark mode', async ({ page }) => {
    // Enable dark mode
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    const themeToggle = page.locator('button', { hasText: /dark|theme/i }).first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    }
    
    // Test dark mode on main pages
    const pages = ['/', '/analytics', '/inventory', '/categories', '/history'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const pageName = pagePath === '/' ? 'pos' : pagePath.slice(1);
      await expect(page).toHaveScreenshot(`dark-mode-${pageName}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });
});