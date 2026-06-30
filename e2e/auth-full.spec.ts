import { test, expect } from '@playwright/test';

const fullStack = process.env.RUN_FULL_E2E === 'true';

test.describe('Full-stack auth & navigation', () => {
  test.skip(!fullStack, 'Set RUN_FULL_E2E=true with backend + MongoDB running');

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill('admin@test.afios.local');
    await page.locator('#login-password').fill('WrongPassword!1');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10_000 });
  });

  test('authenticates seeded admin', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill('admin@test.afios.local');
    await page.locator('#login-password').fill('TestAdmin!Pass2026');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/mission-control|dashboard|projects/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/login/);
  });

  test('admin navigates to projects', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill('admin@test.afios.local');
    await page.locator('#login-password').fill('TestAdmin!Pass2026');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/mission-control|dashboard|projects/, { timeout: 15_000 });
    await page.goto('/projects');
    await expect(page).toHaveURL(/projects/);
  });
});
