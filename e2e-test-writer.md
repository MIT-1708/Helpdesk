# Testing & Playwright Configuration

This file serves as a reference for the testing setup and configuration for the **Helpdesk** project.

## Testing & Playwright Configuration

- **Testing environment**: Configured via [server/.env.test](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/server/.env.test) (uses the `helpdesk_test` database and port `5001`).
- **Playwright setup**: Configured in [playwright.config.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/playwright.config.ts) to run both the server and client during tests. Utilizes the global lifecycle hooks [global-setup.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/e2e/global-setup.ts) and [global-teardown.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/e2e/global-teardown.ts).
- **Database Preparation**: Triggered automatically on test startup via Playwright's global setup hook (which calls [scripts/test-setup.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/scripts/test-setup.ts)). It can also be run manually with `bun run test:setup`.
- **E2E Spec Location**: Tests are written in the `e2e/` directory (e.g., [auth.spec.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/e2e/auth.spec.ts)).
- **Scripts**:
  - `bun run test:setup` - Sets up, resets, and seeds the test database.
  - `bun run test:e2e` - Starts the E2E test execution.
  - `bun run test:install-browsers` - Installs the Playwright browser dependencies.
