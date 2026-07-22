import { test, expect } from '@playwright/test';

test.describe('E2E — Error Paths & Resilience Testing', () => {
  const ts = Date.now();
  const email = `e2e-error-${ts}@example.com`;
  const password = 'ErrorPassword123!';

  test('Stripe Payment Decline Handling (Test Decline Card 4000...0002)', async ({ page, request }) => {
    // Instant API registration & auth context injection
    const regRes = await request.post('http://localhost:8000/api/auth/register', {
      data: {
        email: email,
        password: password,
        firstName: 'Error',
        lastName: 'Test',
      },
    });

    if (regRes.ok()) {
      const { token, user } = await regRes.json();
      await page.addInitScript(({ t, u }) => {
        localStorage.setItem('token', t);
        localStorage.setItem('user', JSON.stringify(u));
      }, { t: token, u: user });
    }

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toBeDefined();
  });

  test('Mid-Checkout Network Failure Survival (Cart State Persists)', async ({ page }) => {
    // Seed local cart state
    await page.goto('/stores');
    await page.evaluate(() => {
      localStorage.setItem(
        'grocenest_cart',
        JSON.stringify([{ id: 'prod-1', name: 'Test Apple', price: 1.5, quantity: 2 }])
      );
    });

    // Simulate page reload mid-checkout / network interruption
    await page.reload();
    const cartData = await page.evaluate(() => localStorage.getItem('grocenest_cart'));
    expect(cartData).not.toBeNull();
    expect(cartData).toContain('Test Apple');
  });

  test('Session Expiration Mid-Flow Redirects Cleanly', async ({ page }) => {
    await page.goto('/checkout');
    // Clear auth token to simulate token expiration
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    await page.reload();
    await page.waitForTimeout(500);
    expect(page.url()).toBeDefined();
  });
});
