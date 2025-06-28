import { test, expect } from '@playwright/test';

test.describe('Shop Deletion API Tests', () => {
  let testShopData: any;

  test.beforeEach(async ({ page }) => {
    // Navigate to login page and login as admin
    await page.goto('/');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/pos');

    // Create a test shop with data via API
    testShopData = await page.evaluate(async () => {
      const shopRes = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: 'Shop With Data', address: 'Test Address' })
      });
      const shop = await shopRes.json();
      
      await fetch(`/api/shops/${shop.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: 'Test Category' })
      });
      
      return shop;
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up the test shop if it still exists
    if (testShopData) {
      await page.evaluate(async (shop) => {
        // Check if the shop still exists before trying to delete it
        const res = await fetch(`/api/shops/${shop.id}`);
        if (res.ok) {
          await fetch(`/api/shops/${shop.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ confirmationName: shop.name })
          });
        }
      }, testShopData);
    }
  });

  test('should require confirmation when deleting a shop with data', async ({ page }) => {
    const noConfirmResponse = await page.evaluate(async (shopId) => {
      const res = await fetch(`/api/shops/${shopId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({}) });
      return { status: res.status, data: await res.json() };
    }, testShopData.id);
    
    expect(noConfirmResponse.status).toBe(400);
    expect(noConfirmResponse.data.requiresConfirmation).toBe(true);
    expect(noConfirmResponse.data.shopName).toBe('Shop With Data');
  });

  test('should fail to delete a shop with the wrong confirmation name', async ({ page }) => {
    const wrongConfirmResponse = await page.evaluate(async (data) => {
      const res = await fetch(`/api/shops/${data.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ confirmationName: 'Wrong Name' }) });
      return { status: res.status, data: await res.json() };
    }, testShopData);
    
    expect(wrongConfirmResponse.status).toBe(400);
    expect(wrongConfirmResponse.data.error).toContain('confirmation does not match');
  });

  test('should successfully delete a shop with the correct confirmation name', async ({ page }) => {
    const correctDeleteResponse = await page.evaluate(async (data) => {
      const res = await fetch(`/api/shops/${data.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ confirmationName: data.name }) });
      return { status: res.status, data: await res.json() };
    }, testShopData);
    
    expect(correctDeleteResponse.status).toBe(200);
    expect(correctDeleteResponse.data.success).toBe(true);
    expect(correctDeleteResponse.data.cascadeDelete).toBe(true);

    // After this test, the shop is deleted, so we need to nullify testShopData
    // so that afterEach doesn't try to delete it again.
    testShopData = null;
  });

  test('should successfully delete empty shop', async ({ page }) => {
    // Create an empty shop
    const emptyShop = await page.evaluate(async () => {
      const res = await fetch('/api/shops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: 'Empty Shop' }) });
      return await res.json();
    });
    
    // Delete the empty shop (should succeed without confirmation)
    const deleteResponse = await page.evaluate(async (shopId) => {
      const res = await fetch(`/api/shops/${shopId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({}) });
      return { status: res.status, data: await res.json() };
    }, emptyShop.id);
    
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.data.success).toBe(true);
    expect(deleteResponse.data.cascadeDelete).toBe(false);
  });

  test('should handle non-existent shop deletion', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/shops/99999', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({}) });
      return { status: res.status, data: await res.json() };
    });
    
    expect(response.status).toBe(404);
    expect(response.data.error).toBe('Shop not found');
  });
});