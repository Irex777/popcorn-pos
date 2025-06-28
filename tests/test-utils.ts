import { Page, expect } from '@playwright/test';

/**
 * Test utilities for Popcorn POS visual testing
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the page to be fully loaded with content
   */
  async waitForPageLoad(timeout = 5000) {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
    
    // Wait for any common loading indicators to disappear
    const loadingIndicators = this.page.locator('.loading, .spinner, .skeleton');
    await loadingIndicators.waitFor({ state: 'hidden', timeout }).catch(() => {
      // Ignore if no loading indicators found
    });
  }

  /**
   * Navigate to a page and wait for it to load
   */
  async navigateAndWait(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Take a screenshot with consistent settings
   */
  async takeScreenshot(name: string, options: any = {}) {
    await expect(this.page).toHaveScreenshot(name, {
      fullPage: true,
      animations: 'disabled',
      ...options
    });
  }

  /**
   * Take a screenshot of a specific element
   */
  async takeElementScreenshot(selector: string, name: string) {
    const element = this.page.locator(selector);
    if (await element.isVisible()) {
      await expect(element).toHaveScreenshot(name);
      return true;
    }
    return false;
  }

  /**
   * Simulate user authentication bypass
   */
  async bypassAuth() {
    // Set demo mode in localStorage if needed
    await this.page.evaluate(() => {
      localStorage.setItem('demo-mode', 'true');
    });
  }

  /**
   * Set viewport for responsive testing
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  /**
   * Toggle dark mode if available
   */
  async toggleDarkMode() {
    const themeToggle = this.page.locator('button', { hasText: /dark|theme|mode/i }).first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await this.page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  /**
   * Fill form fields safely
   */
  async fillForm(fields: Record<string, string>) {
    for (const [selector, value] of Object.entries(fields)) {
      const field = this.page.locator(selector);
      if (await field.isVisible()) {
        await field.fill(value);
      }
    }
  }

  /**
   * Click element if visible
   */
  async clickIfVisible(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    if (await element.isVisible()) {
      await element.click();
      await this.page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  /**
   * Test common user interactions
   */
  async testCommonInteractions(screenshotPrefix: string) {
    // Test hover states
    const interactiveElements = this.page.locator('button, a, .clickable');
    const count = await interactiveElements.count();
    
    if (count > 0) {
      const firstElement = interactiveElements.first();
      await firstElement.hover();
      await this.page.waitForTimeout(300);
      await this.takeScreenshot(`${screenshotPrefix}-hover-state.png`);
    }

    // Test focus states
    const focusableElements = this.page.locator('input, button, select, textarea');
    const focusCount = await focusableElements.count();
    
    if (focusCount > 0) {
      const firstFocusable = focusableElements.first();
      await firstFocusable.focus();
      await this.page.waitForTimeout(300);
      await this.takeScreenshot(`${screenshotPrefix}-focus-state.png`);
    }
  }
}

/**
 * Common test data for forms
 */
export const testData = {
  auth: {
    username: 'demo',
    password: 'demo123',
    email: 'demo@example.com'
  },
  product: {
    name: 'Test Product',
    price: '9.99',
    description: 'A test product for visual testing'
  },
  category: {
    name: 'Test Category',
    color: '#ff0000',
    description: 'A test category'
  }
};

/**
 * Common selectors used across tests
 */
export const selectors = {
  // Navigation
  nav: 'nav, .navigation, header',
  menu: '.menu, .hamburger, .mobile-menu',
  
  // Forms
  form: 'form, .form, .form-container',
  submitButton: 'button[type="submit"], .submit-btn',
  
  // Loading states
  loading: '.loading, .spinner, .skeleton, .loading-spinner',
  
  // Common UI elements
  modal: '.modal, .dialog, .popup',
  toast: '.toast, .notification, .alert',
  dropdown: '.dropdown, .select-menu',
  
  // Content areas
  main: 'main, .main-content, .container',
  sidebar: 'aside, .sidebar, .side-panel',
  header: 'header, .header, .top-bar',
  footer: 'footer, .footer, .bottom-bar'
};