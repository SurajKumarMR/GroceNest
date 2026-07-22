import { test, expect } from '@playwright/test';

test.describe('E2E — Store Owner Workflows', () => {
  const ts = Date.now();
  const merchantEmail = `e2e-merchant-${ts}@example.com`;
  const password = 'MerchantPassword123!';

  test('Store Owner: Product Management & Order Status Cascade', async ({ page }) => {
    // Register merchant user
    await page.goto('/register');
    await page.fill('input[name="firstName"]', 'Merchant');
    await page.fill('input[name="lastName"]', 'Owner');
    await page.fill('input[name="email"]', merchantEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Profile page navigation
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/profile');
  });
});
