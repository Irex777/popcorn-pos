import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-utils';

test.describe('Authentication Flow Validation Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Protected Route Access', () => {
    test('should redirect to login when accessing protected routes without auth', async ({ page }) => {
      const protectedRoutes = [
        '/pos',
        '/inventory',
        '/categories', 
        '/analytics',
        '/settings',
        '/history',
        '/server',
        '/kitchen',
        '/host'
      ];

      for (const route of protectedRoutes) {
        // Clear any existing auth state
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });

        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        // Should either redirect to login or show login form
        const url = page.url();
        const hasLoginForm = await page.locator('form, input[type="password"], button:has-text("Login")').isVisible();
        
        const isOnLoginPage = url.includes('/login') || url.includes('/auth') || hasLoginForm;
        
        expect(isOnLoginPage).toBe(true);
      }
    });

    test('should maintain auth state across page refreshes', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Should be authenticated (in demo mode)
      await expect(page.locator('main')).toBeVisible();
      
      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still be authenticated
      await expect(page.locator('main')).toBeVisible();
    });

    test('should handle session expiration gracefully', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Simulate session expiration by clearing storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        // Clear any cookies
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
      });
      
      // Try to navigate to a protected route
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      // Should redirect to login or show login form
      const hasLoginForm = await page.locator('form, input[type="password"], button:has-text("Login")').isVisible();
      expect(hasLoginForm).toBe(true);
    });
  });

  test.describe('Login Form Validation', () => {
    test('should validate login form inputs', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for login form
      const loginForm = page.locator('form, .login-form').first();
      
      if (await loginForm.isVisible()) {
        const submitButton = loginForm.locator('button[type="submit"], button:has-text("Login")');
        
        if (await submitButton.isVisible()) {
          // Try to submit empty form
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Should show validation errors
          const errorMessages = page.locator('.error, .text-red, .text-destructive');
          const hasErrors = await errorMessages.count() > 0;
          
          // Should either show errors or prevent submission
          expect(hasErrors || await submitButton.isDisabled()).toBe(true);
        }
      }
    });

    test('should handle login errors gracefully', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loginForm = page.locator('form, .login-form').first();
      
      if (await loginForm.isVisible()) {
        // Fill with invalid credentials
        await helpers.fillForm({
          'input[type="text"], input[name="username"]': 'invalid_user',
          'input[type="password"], input[name="password"]': 'wrong_password'
        });
        
        const submitButton = loginForm.locator('button[type="submit"], button:has-text("Login")');
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          // Should show error message or stay on login page
          const errorMessages = page.locator('.error, .text-red, .text-destructive');
          const hasErrors = await errorMessages.count() > 0;
          const stillOnLogin = await loginForm.isVisible();
          
          expect(hasErrors || stillOnLogin).toBe(true);
        }
      }
    });
  });

  test.describe('Authentication State Management', () => {
    test('should handle user context properly', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Check if user info is displayed
      const userInfo = page.locator('.user-info, .username, .user-menu');
      
      if (await userInfo.isVisible()) {
        const userText = await userInfo.textContent();
        expect(userText).toBeTruthy();
        expect(userText).not.toContain('undefined');
        expect(userText).not.toContain('null');
      }
    });

    test('should handle shop context properly', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Check if shop info is displayed
      const shopInfo = page.locator('.shop-info, .current-shop, .shop-name');
      
      if (await shopInfo.isVisible()) {
        const shopText = await shopInfo.textContent();
        expect(shopText).toBeTruthy();
        expect(shopText).not.toContain('undefined');
        expect(shopText).not.toContain('null');
      }
    });

    test('should handle missing shop selection', async ({ page }) => {
      await helpers.navigateAndWait('/analytics');
      
      // Look for no shop selected message
      const noShopMessage = page.locator('text=No shop selected, text=Select a shop, text=Please select a shop');
      
      if (await noShopMessage.isVisible()) {
        // Should show proper message, not crash
        const messageText = await noShopMessage.textContent();
        expect(messageText).toBeTruthy();
        expect(messageText).not.toContain('undefined');
      }
    });
  });

  test.describe('Authorization Levels', () => {
    test('should handle admin-only features properly', async ({ page }) => {
      await helpers.navigateAndWait('/settings');
      
      // Look for admin-only sections
      const adminSections = page.locator('.admin-only, [data-admin-only]');
      
      if (await adminSections.count() > 0) {
        // Should either show admin content or hide it gracefully
        const isVisible = await adminSections.first().isVisible();
        
        if (isVisible) {
          // Should not show raw permission keys
          const rawKeys = await adminSections.locator('text=/^auth\\./').count();
          expect(rawKeys).toBe(0);
        }
      }
    });

    test('should handle role-based access control', async ({ page }) => {
      await helpers.navigateAndWait('/settings');
      
      // Look for role-specific content
      const roleElements = page.locator('[data-role], .role-');
      
      if (await roleElements.count() > 0) {
        // Should not show undefined role text
        const roleText = await roleElements.first().textContent();
        if (roleText) {
          expect(roleText).not.toContain('undefined');
          expect(roleText).not.toContain('null');
        }
      }
    });
  });

  test.describe('Logout Functionality', () => {
    test('should handle logout properly', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Look for logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), .logout');
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
        
        // Should redirect to login or show login form
        const hasLoginForm = await page.locator('form, input[type="password"], button:has-text("Login")').isVisible();
        expect(hasLoginForm).toBe(true);
      }
    });

    test('should clear auth state on logout', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Check initial auth state
      const isAuthenticated = await page.locator('main').isVisible();
      
      if (isAuthenticated) {
        // Look for logout button
        const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), .logout');
        
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
          await page.waitForTimeout(1000);
          
          // Try to access protected route
          await page.goto('/settings');
          await page.waitForLoadState('networkidle');
          
          // Should not be able to access
          const hasLoginForm = await page.locator('form, input[type="password"], button:has-text("Login")').isVisible();
          expect(hasLoginForm).toBe(true);
        }
      }
    });
  });

  test.describe('Demo Mode Authentication', () => {
    test('should handle demo mode properly', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // In demo mode, should have access to all features
      await expect(page.locator('main')).toBeVisible();
      
      // Should be able to navigate to all pages
      const pages = ['/inventory', '/analytics', '/settings'];
      
      for (const pagePath of pages) {
        await helpers.navigateAndWait(pagePath);
        await expect(page.locator('main')).toBeVisible();
      }
    });

    test('should show demo mode indicator if applicable', async ({ page }) => {
      await helpers.navigateAndWait('/pos');
      
      // Look for demo mode indicator
      const demoIndicator = page.locator('text=Demo, text=Demo Mode, .demo-mode');
      
      if (await demoIndicator.isVisible()) {
        const demoText = await demoIndicator.textContent();
        expect(demoText).toBeTruthy();
        expect(demoText).not.toContain('undefined');
      }
    });
  });

  test.describe('Authentication Error Handling', () => {
    test('should handle network errors during auth', async ({ page }) => {
      // Block auth-related network requests
      await page.route('**/auth/**', route => {
        route.abort();
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should handle gracefully - either show error or fallback
      const hasError = await page.locator('.error, .text-red, text=Error').isVisible();
      const hasLoginForm = await page.locator('form, input[type="password"]').isVisible();
      
      expect(hasError || hasLoginForm).toBe(true);
    });

    test('should handle malformed auth responses', async ({ page }) => {
      // Mock invalid auth response
      await page.route('**/auth/**', route => {
        route.fulfill({
          status: 200,
          body: 'invalid json'
        });
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should handle gracefully
      const hasError = await page.locator('.error, .text-red').isVisible();
      const hasLoginForm = await page.locator('form, input[type="password"]').isVisible();
      
      expect(hasError || hasLoginForm).toBe(true);
    });
  });
});