import { test, expect } from '@playwright/test';

test.describe('Ticket Assignment E2E and API Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Sign in as Admin
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should allow Admin to navigate from directory to ticket details page', async ({ page }) => {
    // Navigate to tickets page
    await page.goto('/tickets');
    await expect(page.locator('text=Tickets Directory')).toBeVisible();

    // Click on the first ticket subject Link
    const firstTicketLink = page.locator('table tbody tr').first().locator('a').first();
    const ticketSubject = await firstTicketLink.innerText();
    console.log(`Testing ticket: "${ticketSubject}"`);
    
    await firstTicketLink.click();
    
    // Should be on the ticket details page
    await expect(page).toHaveURL(/\/tickets\/\d+/);
    await expect(page.locator('text=Customer Details')).toBeVisible();
  });
});
