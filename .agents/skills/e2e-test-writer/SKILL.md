---
name: e2e-test-writer
description: Write, run, and configure Playwright E2E tests for the Helpdesk monorepo. Use when writing tests, setting up mock data, running test suites, or modifying Playwright configurations.
---

# Playwright E2E Testing Guidelines

This skill provides instructions for writing, structuring, and executing Playwright end-to-end tests for the **Helpdesk** application.

## Testing Architecture

1. **Testing Environment**:
   - Configuration is defined in [server/.env.test](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/server/.env.test) (uses the `helpdesk_test` database and port `5001`).
   - Playwright is configured in [playwright.config.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/playwright.config.ts) to start both the server and client automatically.
   
2. **Lifecycle Hooks**:
   - [global-setup.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/e2e/global-setup.ts): Spawns [test-setup.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/scripts/test-setup.ts) to reset the test database schema (`prisma db push`) before tests run.
   - [global-teardown.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/e2e/global-teardown.ts): Runs teardown or cleanup procedures after all tests finish.

3. **Running Tests**:
   - `bun run test:setup`: Explicitly resets the test database.
   - `bun run test:e2e`: Runs the test database setup followed by the Playwright test suite.
   - `bun run test:install-browsers`: Downloads Playwright browser binaries.

## Best Practices for Writing E2E Tests

1. **Isolation**:
   - Each test file should operate independently. Ensure any state created (such as testing accounts) is cleaned up or uses unique identifiers to avoid conflicts.
2. **Authenticating in Tests**:
   - Use the pre-seeded users (like `admin@example.com` or `agent@example.com`) to log in via the Login page UI before executing protected routes checks.
3. **Locators**:
   - Prefer user-facing locators (e.g. `page.getByRole('button', { name: 'Sign In' })`, `page.getByLabel('Email Address')`) over CSS selectors for robustness.
