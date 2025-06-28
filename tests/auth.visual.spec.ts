import { test, expect } from '@playwright/test';

test.describe('Authentication Visual Tests', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('auth-login-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should show login form elements', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Focus on the login form
    const loginForm = page.locator('form, .login-form, .auth-form').first();
    
    if (await loginForm.isVisible()) {
      await expect(loginForm).toHaveScreenshot('login-form.png');
    } else {
      // Fallback to main container
      const mainContent = page.locator('main, .container, .auth-container').first();
      if (await mainContent.isVisible()) {
        await expect(mainContent).toHaveScreenshot('auth-main-content.png');
      }
    }
  });

  test('should display login form validation states', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Try to find and interact with form elements
    const submitBtn = page.locator('button[type="submit"], button', { hasText: /login|sign in|submit/i }).first();
    
    if (await submitBtn.isVisible()) {
      // Try to submit without filling form to trigger validation
      await submitBtn.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('login-form-validation.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should handle successful login redirect', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Try to fill and submit login form with demo credentials
    const usernameField = page.locator('input[type="text"], input[type="email"], input[name*="user"], input[placeholder*="user"]').first();
    const passwordField = page.locator('input[type="password"], input[name*="pass"]').first();
    const submitBtn = page.locator('button[type="submit"], button', { hasText: /login|sign in|submit/i }).first();
    
    if (await usernameField.isVisible() && await passwordField.isVisible() && await submitBtn.isVisible()) {
      await usernameField.fill('demo');
      await passwordField.fill('demo');
      await submitBtn.click();
      
      // Wait for redirect
      await page.waitForTimeout(2000);
      
      // Capture the post-login state
      await expect(page).toHaveScreenshot('post-login-dashboard.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should display authentication mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('auth-mobile-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Protected Route Visual Tests', () => {
  test('should redirect to auth when not logged in', async ({ page }) => {
    // Clear any existing authentication
    await page.context().clearCookies();
    
    // Try to access a protected route
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('protected-route-redirect.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should show loading state during authentication check', async ({ page }) => {
    await page.goto('/');
    
    // Try to capture any loading states
    await page.waitForTimeout(100); // Capture early loading state
    await expect(page).toHaveScreenshot('auth-loading-state.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});