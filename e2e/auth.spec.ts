import { test, expect } from '@playwright/test';

test.describe('Authentication & Role-Based Access Control', () => {

  test('should redirect unauthenticated user to login page', async ({ page }) => {
    // Attempt to visit root page
    await page.goto('/');
    
    // Expect to be redirected to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow Admin to log in and access Admin-only Users page', async ({ page }) => {
    // Go to login page
    await page.goto('/login');

    // Fill in admin credentials
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect or error alert
    try {
      await page.waitForFunction(() => {
        return window.location.pathname === '/' || !!document.querySelector('.text-destructive');
      }, null, { timeout: 5000 });
    } catch (e) {}

    // Should redirect to homepage
    await expect(page).toHaveURL('/');

    // Navbar should display "Users" link
    const usersLink = page.locator('text=Users');
    await expect(usersLink).toBeVisible();

    // Clicking "Users" should navigate to /users
    await usersLink.click();
    await expect(page).toHaveURL('/users');

    // Should see "User Management" heading
    await expect(page.locator('text=User Management')).toBeVisible();
  });

  test('should allow Agent to log in but restrict access to Users page', async ({ page }) => {
    // Go to login page
    await page.goto('/login');

    // Fill in agent credentials
    await page.fill('input[id="email"]', 'agent@example.com');
    await page.fill('input[id="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect or error alert
    try {
      await page.waitForFunction(() => {
        return window.location.pathname === '/' || !!document.querySelector('.text-destructive');
      }, null, { timeout: 5000 });
    } catch (e) {}

    // Should redirect to homepage
    await expect(page).toHaveURL('/');

    // Navbar should NOT display "Users" link
    const usersLink = page.locator('text=Users');
    await expect(usersLink).not.toBeVisible();

    // Attempting to visit /users directly should redirect back to home (/)
    await page.goto('/users');
    await expect(page).toHaveURL('/');
  });
});
