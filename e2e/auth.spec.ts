import { test, expect } from '@playwright/test';

test.describe('Authentication & Role-Based Access Control (RBAC)', () => {

  test.describe('1. Unauthenticated Route Guards', () => {
    test('should redirect unauthenticated user from home (/) to /login', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated user from /users to /login', async ({ page }) => {
      await page.goto('/users');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('2. Client-Side Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should show error messages when fields are left blank', async ({ page }) => {
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should show error message for invalid email format', async ({ page }) => {
      await page.fill('input[id="email"]', 'not-an-email');
      await page.fill('input[id="password"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    });

    test('should show error message for password under 6 characters', async ({ page }) => {
      await page.fill('input[id="email"]', 'admin@example.com');
      await page.fill('input[id="password"]', '12345');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
    });
  });

  test.describe('3. Server-Side Authentication Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display server error banner for non-existent email', async ({ page }) => {
      await page.fill('input[id="email"]', 'doesnotexist@example.com');
      await page.fill('input[id="password"]', 'password123');
      await page.click('button[type="submit"]');

      const errorBanner = page.locator('.text-destructive');
      await expect(errorBanner).toBeVisible();
      await expect(errorBanner).toContainText('Invalid email or password');
    });

    test('should display server error banner for incorrect password', async ({ page }) => {
      await page.fill('input[id="email"]', 'admin@example.com');
      await page.fill('input[id="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      const errorBanner = page.locator('.text-destructive');
      await expect(errorBanner).toBeVisible();
      await expect(errorBanner).toContainText('Invalid email or password');
    });
  });

  test.describe('4. Successful Login & Layout Adjustments by Role', () => {
    test('should authenticate Admin, display role label and show Users page link', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[id="email"]', 'admin@example.com');
      await page.fill('input[id="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Verify redirect
      await expect(page).toHaveURL('/');

      // Verify header details
      await expect(page.locator('text=System Administrator')).toBeVisible();
      await expect(page.getByText('admin', { exact: true })).toBeVisible();

      // Navbar should display "Users" link
      const usersLink = page.locator('text=Users');
      await expect(usersLink).toBeVisible();

      // Navigate to /users via link
      await usersLink.click();
      await expect(page).toHaveURL('/users');
      await expect(page.locator('text=User Directory')).toBeVisible();

      // Verify seeded users are visible in the directory
      await expect(page.locator('[data-testid="user-card"]', { hasText: 'System Administrator' })).toBeVisible();
      await expect(page.locator('[data-testid="user-card"]', { hasText: 'Support Agent' })).toBeVisible();
    });

    test('should authenticate Agent, display role label and hide Users page link', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[id="email"]', 'agent@example.com');
      await page.fill('input[id="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Verify redirect
      await expect(page).toHaveURL('/');

      // Verify header details
      await expect(page.locator('text=Support Agent')).toBeVisible();
      await expect(page.getByText('agent', { exact: true })).toBeVisible();

      // Navbar should NOT display "Users" link
      const usersLink = page.locator('text=Users');
      await expect(usersLink).not.toBeVisible();

      // Direct navigation to /users should redirect to /
      await page.goto('/users');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('5. Sign Out Flow & Session Expiration', () => {
    test('should successfully sign out and deny access to protected routes', async ({ page }) => {
      // Sign in as Agent
      await page.goto('/login');
      await page.fill('input[id="email"]', 'agent@example.com');
      await page.fill('input[id="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');

      // Click Sign Out
      await page.click('button:has-text("Sign Out")');

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);

      // Attempting to visit root (/) should redirect back to /login
      await page.goto('/');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('6. Authenticated Redirects (Public Only Routes)', () => {
    test('should redirect logged-in user to homepage if they attempt to visit /login', async ({ page }) => {
      // Sign in
      await page.goto('/login');
      await page.fill('input[id="email"]', 'agent@example.com');
      await page.fill('input[id="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');

      // Attempt to go to /login directly
      await page.goto('/login');
      
      // Should redirect back to /
      await expect(page).toHaveURL('/');
    });
  });
});
