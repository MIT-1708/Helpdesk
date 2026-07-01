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

  test('should allow Admin to assign and unassign a ticket via the UI', async ({ page }) => {
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
    await expect(page.locator('text=Assignment')).toBeVisible();

    // Trigger assignment editing
    const changeAssignButton = page.locator('button:has-text("Change")').or(page.locator('button:has-text("Assign")')).first();
    await changeAssignButton.click();

    // Wait for the select dropdown to appear
    const selectDropdown = page.locator('[data-testid="assignee-select"]');
    await expect(selectDropdown).toBeVisible();

    // Select "Support Agent" (role agent)
    await selectDropdown.selectOption({ label: 'Support Agent (agent)' });

    // The selection automatically fires the PATCH call and re-fetches
    // Verify that the assigned agent is now "Support Agent"
    await expect(page.locator('text=Support Agent')).toBeVisible();

    // Verify "Unassign" link is now visible
    const unassignButton = page.locator('button:has-text("Unassign")');
    await expect(unassignButton).toBeVisible();

    // Click "Unassign"
    await unassignButton.click();

    // Verify it updates back to "Unassigned"
    await expect(page.locator('text=Unassigned')).toBeVisible();
  });

  test('should validate agentId on the backend API', async ({ page }) => {
    // Navigate to tickets page first to ensure we are logged in and on the correct origin
    await page.goto('/tickets');

    // Perform API requests inside the browser window context (inheriting session credentials)
    const apiResult = await page.evaluate(async () => {
      const baseUrl = window.location.origin.replace('5174', '5001'); // points to backend port 5001
      
      // Fetch tickets to get the first ticket's ID dynamically
      const ticketsResponse = await fetch(`${baseUrl}/api/tickets`, { credentials: 'include' });
      const ticketsData = await ticketsResponse.json();
      const ticketId = ticketsData.tickets[0].id;

      // Try to assign to a non-existent agent ID
      const resInvalid = await fetch(`${baseUrl}/api/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'non-existent-agent-id' }),
        credentials: 'include',
      });
      const dataInvalid = await resInvalid.json();

      return {
        invalidStatus: resInvalid.status,
        invalidError: dataInvalid.error,
      };
    });

    // Assert that the backend rejected the invalid agent ID with 404
    expect(apiResult.invalidStatus).toBe(404);
    expect(apiResult.invalidError).toContain('Agent not found');
  });

  test('should allow Admin to update ticket status and category via properties card', async ({ page }) => {
    // Navigate to tickets page
    await page.goto('/tickets');
    await expect(page.locator('text=Tickets Directory')).toBeVisible();

    // Click on the first ticket subject Link
    const firstTicketLink = page.locator('table tbody tr').first().locator('a').first();
    await firstTicketLink.click();

    // Should be on details page
    await expect(page).toHaveURL(/\/tickets\/\d+/);
    await expect(page.locator('text=Customer Details')).toBeVisible();

    // Get the status select element
    const statusSelect = page.locator('[data-testid="status-select"]');
    await expect(statusSelect).toBeVisible();

    // Select "resolved" status
    await statusSelect.selectOption('resolved');

    // Verify header status badge displays "Resolved"
    await expect(page.locator('span:has-text("Resolved")').first()).toBeVisible();

    // Get the category select element
    const categorySelect = page.locator('[data-testid="category-select"]');
    await expect(categorySelect).toBeVisible();

    // Select "Technical Question" category
    await categorySelect.selectOption('Technical Question');

    // Verify header category badge displays "Technical Question"
    await expect(page.locator('span:has-text("Technical Question")').first()).toBeVisible();
  });
});
