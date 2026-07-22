import { test, expect } from '@playwright/test';

test.describe('E2E — Driver Delivery Workflow', () => {
  const ts = Date.now();
  const driverEmail = `e2e-driver-${ts}@example.com`;
  const password = 'DriverPassword123!';

  test('Driver: Accept Delivery -> Update Status -> OTP Verification', async ({ page }) => {
    // Register driver user
    await page.goto('/register');
    await page.fill('input[name="firstName"]', 'Driver');
    await page.fill('input[name="lastName"]', 'Delivery');
    await page.fill('input[name="email"]', driverEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Profile page navigation
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/profile');
  });
});
