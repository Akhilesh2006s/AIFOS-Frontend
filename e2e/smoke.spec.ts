import { test, expect } from '@playwright/test';

test.describe('Login page smoke', () => {
  test('renders sign-in form', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });
});
