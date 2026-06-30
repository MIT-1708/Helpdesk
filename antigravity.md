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

### 5. Data Fetching & Query Management
- **Libraries**: Use **Axios** (`axios`) and **TanStack Query** (`@tanstack/react-query`) for API requests and state management instead of native `fetch` and custom `useEffect` hooks.
- **Credentials**: Ensure `withCredentials: true` is configured in Axios requests to transmit session-based cookies.
- **State Management**:
  - Wrap components inside `<QueryClientProvider client={queryClient}>` at the application root ([App.tsx](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/client/src/App.tsx)).
  - Use `useQuery` for fetching. For loading states, use `isLoading` for the initial skeleton load, and use `isFetching` for handling background refetches / Refresh button loaders.
  - Handle errors via the `error.message` property on the returned query error object.
- **Data Validation**: Always use **Zod** (`zod`) to define request schemas and validate incoming HTTP request payloads on the backend, ensuring unified input validation rules and error responses.
- **Client-Side Form Validation**: Use **React Hook Form** (`react-hook-form`) combined with **Zod** (`zod`) and `@hookform/resolvers/zod` to handle input registration, state tracking, and schema-based validation for forms, ensuring unified validation rules across frontend and backend.
- **Shared Schemas (Monorepo)**: For data validation schemas shared between the client and server (such as `createUserSchema`), define them inside the `@helpdesk/core` workspace package (`core/src/schemas/`). Build the core package using `bun run build:core` from the root workspace, and import the schemas in the client and server projects from `@helpdesk/core` to maintain consistency and prevent duplication.
- **Shared Enums (Monorepo)**: Avoid using magic strings for user roles (such as `'admin'` or `'agent'`). Instead, define and import the shared `UserRole` enum from the `@helpdesk/core` package (e.g. `UserRole.ADMIN`, `UserRole.AGENT`) inside both client and server applications to enforce type-safety and consistency across the codebase.
- **Express Promise Error Handling**: Express v5 automatically catches rejected promises thrown by asynchronous route handlers and middleware functions and forwards them directly to the global error-handling middleware. Therefore, custom `try/catch` blocks or `asyncHandler` wrappers are unnecessary.





### 6. Writing and Executing Component Tests
- **Framework & Libraries**: We use **Vitest** (`vitest`) as the test runner and **React Testing Library** (`@testing-library/react`) for component-level DOM testing.
- **Vite Configuration**: Always ensure [vite.config.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/client/vite.config.ts) imports `defineConfig` from `'vitest/config'` (not `'vite'`) so that the `test` properties are recognized by the TypeScript compiler.
- **Location**: Test files must reside in `__tests__` directories alongside components, e.g., [Users.test.tsx](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/client/src/pages/__tests__/Users.test.tsx).
- **Test Setup & Utilities**:
  - Global DOM cleanup and Jest matchers are configured in [setup.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/client/src/test/setup.ts).
  - Use the custom `renderWithQueryClient` helper from [test-utils.tsx](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/client/src/test/test-utils.tsx) to wrap components that utilize TanStack Query.
- **Mocking Strategy**: Mock external API layers (such as Axios calls) using `vi.mock('axios')` or `vi.spyOn(axios, 'get')` to isolate component logic.
- **Execution Commands**:
  - To run tests once: Run `bun run test:run` inside the `client/` directory.
  - To run tests in interactive watch mode: Run `bun run test` inside the `client/` directory.

### 7. Support Email Inbound Webhook & Ticket Schema
- **Webhook Endpoint**: `POST /api/webhooks/inbound-email` (implemented in [inbound.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/server/src/routes/inbound.ts)).
  - Body payload: `{ from: string, name?: string, subject: string, body: string, bodyHtml?: string }` (validated via Zod schema).
- **Database Schema**:
  - `Ticket` model has direct fields for `body`, `bodyHtml`, `senderEmail`, and `senderName` matching user database requirements.
  - Uses PostgreSQL enums `TicketStatus` (`open`, `resolved`, `closed`) and `TicketCategory` (`GENERAL` -> "General Question", `TECHNICAL` -> "Technical Question", `REFUND` -> "Refund Request") mapped via `@map` in [schema.prisma](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/server/prisma/schema.prisma).
  - Enums are defined and exported from `@helpdesk/core` monorepo package.
- **E2E Webhook Tests**:
  - Located in [inbound.spec.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/e2e/inbound.spec.ts).
  - Run webhook tests: `bun run test:setup; bunx playwright test e2e/inbound.spec.ts`
  - Database resets cleanly with `--accept-data-loss` and `--force-reset` parameters configured in [test-setup.ts](file:///c:/Users/allle/OneDrive/Desktop/Helpdesk/scripts/test-setup.ts).

---
*Last Updated: 2026-06-30 per user request to maintain project memory for Antigravity.*

