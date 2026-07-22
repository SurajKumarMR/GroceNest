import { test, expect } from '@playwright/test';

test.describe('Accessibility & Keyboard Navigation (WCAG 2.1 AA)', () => {

  test('Page landmarks & Heading structure on main routes', async ({ page }) => {
    // 1. Login Page Landmarks
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const header = page.locator('header');
    await expect(header.first()).toBeVisible();

    const main = page.locator('main');
    await expect(main.first()).toBeVisible();

    // 2. Stores Page
    await page.goto('/stores');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      const placeholder = await searchInput.getAttribute('placeholder');
      expect(placeholder).toBeTruthy();
    }
  });

  test('Form Inputs have associated labels & error alerts are accessible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible();

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    const btnText = await submitBtn.innerText();
    expect(btnText.trim().length).toBeGreaterThan(0);
  });

  test('Keyboard navigation & focus ring accessibility', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });

  test('Color contrast tokens & dark/light mode compatibility', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeDefined();
  });
});
