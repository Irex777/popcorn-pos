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
    const preferencesSection = page.locator('.preferences, .user-settings, .settings-section').first();
    
    if (await preferencesSection.isVisible()) {
      await expect(preferencesSection).toHaveScreenshot('settings-preferences.png');
    }
  });

  test('should display language selection', async ({ page }) => {
    const languageSelect = page.locator('select, .language-selector, .locale-picker').first();
    
    if (await languageSelect.isVisible()) {
      await expect(languageSelect).toHaveScreenshot('settings-language-selection.png');
    }
  });

  test('should show currency settings', async ({ page }) => {
    const currencySection = page.locator('.currency, select[name*="currency"]').first();
    
    if (await currencySection.isVisible()) {
      await expect(currencySection).toHaveScreenshot('settings-currency.png');
    }
  });

  test('should display theme toggle', async ({ page }) => {
    const themeToggle = page.locator('.theme-toggle, .dark-mode, button', { hasText: /theme|dark|light/i }).first();
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('settings-theme-changed.png', {
        fullPage: true,
        animations: 'disabled'
      });
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