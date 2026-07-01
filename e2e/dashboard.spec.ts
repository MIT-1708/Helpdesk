import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Sign in as Admin
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should display key performance indicator cards', async ({ page }) => {
    // The home page is now the dashboard
    await expect(page.locator('text=Helpdesk Dashboard')).toBeVisible();

    // Verify presence of KPI cards
    await expect(page.locator('[data-testid="total-tickets"]')).toBeVisible();
    await expect(page.locator('[data-testid="open-tickets"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-resolved-tickets"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-success-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-resolution-time"]')).toBeVisible();

    // Verify Category Distribution
    await expect(page.getByRole('heading', { name: 'Category Distribution' })).toBeVisible();

    // Verify Recent Activity Feed
    await expect(page.getByRole('heading', { name: 'Recent Activity Feed' })).toBeVisible();
  });

  test('should allow clicking refresh button to reload stats', async ({ page }) => {
    const refreshBtn = page.locator('button:has-text("Refresh")').first();
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    // Verify it doesn't crash and remains on the dashboard
    await expect(page.locator('text=Helpdesk Dashboard')).toBeVisible();
  });
});
