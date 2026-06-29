# Project Memory - Antigravity

This file serves as a memory/rules reference for the Antigravity agent when working on the **Helpdesk** project.

## Technical Instructions

### 1. Fetching Documentation via Context7
- **Rule**: Whenever you need to use, configure, debug, or write code for any third-party libraries, frameworks, SDKs, APIs, or CLI tools (e.g., React, Vite, Express, Tailwind, bun, Docker, etc.), you **MUST** query the `context7` MCP server first to obtain up-to-date documentation.
- **Workflow**:
  1. Call `resolve-library-id` with the library/package name to resolve its Context7-compatible library ID (e.g., `/reactjs/react.dev`).
  2. Call `query-docs` with the resolved library ID and your specific query to retrieve current API specs, patterns, and code snippets.
- **Goal**: Prevent the use of outdated patterns or deprecated library features.

### 2. Frontend Theming and Component Standards
- **Component Suite**: The client uses **Shadcn UI** components (located in `client/src/components/ui/`).
- **Styling system**: Uses **Tailwind CSS v4** with a native CSS `@theme inline` block defined in [index.css](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/client/src/index.css).
- **Theme Palette**: The project is configured with a default light mode (white background) and custom **Orange** accents:
  - Primary color: `oklch(0.608 0.207 48.07)`
  - Active elements, buttons, and loading states must use semantic colors (`bg-primary`, `text-foreground`, `border-border`) rather than hardcoded indigo/blue classes.
- **Path Aliases**: Path resolution `@/` points to `client/src/`. To avoid `tsc` deprecation errors in TypeScript 5.5+, `"baseUrl"` has been omitted from `tsconfig.json` and `tsconfig.app.json` while keeping relative path mappings.

### 3. Authentication Architecture
- **Framework**: Powered by **Better Auth** (v1.x).
- **Database Adapter**: Backed by **Prisma Adapter** (`prismaAdapter`) connected to PostgreSQL.
- **Methods**: **Email and Password** credentials.
  - Sign-up is disabled on the backend by default (`disableSignUp: true` unless overridden by `BYPASS_DISABLE_SIGNUP="true"` env variable).
- **Custom Schema Fields**:
  - The `user` object has a custom `role` field (string, defaults to `"agent"`, values: `"admin"` or `"agent"`).
- **Client API Integration**:
  - Configured in [auth-client.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/client/src/lib/auth-client.ts) (connects to server at `http://localhost:5000`).
  - Utilizes `inferAdditionalFields<typeof auth>()` to properly propagate and type-check the custom `role` field on the client side.
  - Exposes hooks/methods: `useSession`, `signIn`, `signUp`, `signOut`.
- **Rate Limiting**: Configured in [auth.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/server/src/auth.ts). It is conditionally enabled in production (`process.env.NODE_ENV === 'production'`) or if `process.env.ENABLE_RATE_LIMIT === 'true'` to avoid rate-limiting E2E tests and local development. Uses memory storage.
- **Session Token Sanitization**: A global `after` hook in [auth.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/server/src/auth.ts) and a custom `/api/me` endpoint in [index.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/server/src/index.ts) automatically strip the `token` field from returning session objects.

### 4. Admin Routing & User Management
- **Admin-only Page**: The `/users` route is implemented at [Users.tsx](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/client/src/pages/Users.tsx).
- **Admin Routing Protection**: The client routing uses a custom `AdminRoute` wrapper inside [App.tsx](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/client/src/App.tsx) which restricts access to users with `role === 'admin'`. Unauthorized users are redirected to the homepage (`/`), and unauthenticated users are redirected to `/login`.
- **Database Seeding & Users**:
  - The default admin account is seeded via `bun prisma/seed.ts` (requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`).
  - An agent user is available for testing (`agent@example.com` / `password123` with role `"agent"`).

### 5. Testing & Playwright Configuration
- **Testing environment**: Configure via [server/.env.test](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/server/.env.test) (uses `helpdesk_test` database and port `5001`).
- **Playwright setup**: Configured in [playwright.config.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/playwright.config.ts) to run server and client during tests. Utilizes global lifecycle hooks [global-setup.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/e2e/global-setup.ts) and [global-teardown.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/e2e/global-teardown.ts).
- **Database Preparation**: Triggered automatically on test startup via Playwright global setup (which calls [scripts/test-setup.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/scripts/test-setup.ts)). Can also be run manually with `bun run test:setup`.
- **Scripts**:
  - `bun run test:setup` - Sets up/resets the test database.
  - `bun run test:e2e` - Starts E2E test execution.
  - `bun run test:install-browsers` - Installs Playwright browser dependencies.

---
*Last Updated: 2026-06-29 per user request to maintain project memory for Antigravity.*
