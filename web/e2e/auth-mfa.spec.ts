import { test, expect } from '@playwright/test';

test.describe('E2E — Auth & MFA Workflow', () => {
  const ts = Date.now();
  const testEmail = `e2e-auth-${ts}@example.com`;
  const testPassword = 'E2ePassword123!';

  test('Signup -> Auto-Login -> Profile Access', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Fill signup form
    await page.fill('input[name="firstName"]', 'E2E');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Profile page navigation
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/profile');
  });
});
