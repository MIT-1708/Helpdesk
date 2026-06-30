import { test, expect } from '@playwright/test';

test.describe('User Directory CRUD Operations (Admin-only)', () => {

  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Verify successful login
    await expect(page).toHaveURL('/');
    
    // Navigate to /users directory
    await page.goto('/users');
    await expect(page.locator('text=User Directory')).toBeVisible();
  });

  test('should support creating, updating, and deleting a support agent', async ({ page }) => {
    // 1. CREATE USER
    // Open the creation modal
    await page.click('button:has-text("New User")');
    await expect(page.locator('text=Create New User')).toBeVisible();

    // Fill in form details
    const agentEmail = `test-agent-${Date.now()}@example.com`;
    await page.fill('input[placeholder="John Doe"]', 'Test Agent');
    await page.fill('input[placeholder="john@example.com"]', agentEmail);
    await page.fill('input[placeholder="••••••••"]', 'agentsecurepwd123');
    
    // Submit the form
    await page.click('button:has-text("Create User")');

    // Verify modal is closed and new user is visible in list
    await expect(page.locator('text=Create New User')).not.toBeVisible();
    await expect(page.locator(`text=${agentEmail}`)).toBeVisible();
    await expect(page.locator('text=Test Agent')).toBeVisible();

    // 2. READ & UPDATE USER
    // Find the user card with the matching email using data-testid
    const card = page.locator('[data-testid="user-card"]', { hasText: agentEmail });
    await card.locator('button[title="Edit User"]').click();

    // Verify edit modal opened
    await expect(page.locator('text=Edit User Details')).toBeVisible();
    
    // Update name
    await page.fill('input[placeholder="John Doe"]', 'Test Agent Updated');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Verify edit modal is closed and updated name is visible
    await expect(page.locator('text=Edit User Details')).not.toBeVisible();
    await expect(page.locator('text=Test Agent Updated')).toBeVisible();

    // 3. DELETE USER
    // Click delete button for the updated user
    await card.locator('button[title="Delete User"]').click();

    // Verify delete confirmation modal is shown
    await expect(page.locator('text=Delete User Account')).toBeVisible();
    
    // Confirm delete
    await page.click('button[data-testid="confirm-delete-button"]');

    // Verify modal is closed and user is removed from directory
    await expect(page.locator('text=Delete User Account')).not.toBeVisible();
    await expect(page.locator(`text=${agentEmail}`)).not.toBeVisible();
  });
});
