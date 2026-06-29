# Project Memory - Antigravity

This file serves as a memory/rules reference for the Antigravity agent when working on the **Helpdesk** project.

## Technical Instructions

### 1. Fetching Documentation via Context7
- **Rule**: Whenever you need to use, configure, debug, or write code for any third-party libraries, frameworks, SDKs, APIs, or CLI tools (e.g., React, Vite, Express, Tailwind, bun, Docker, etc.), you **MUST** query the `context7` MCP server first to obtain up-to-date documentation.
- **Workflow**:
  1. Call `resolve-library-id` with the library/package name to resolve its Context7-compatible library ID (e.g., `/reactjs/react.dev`).
  2. Call `query-docs` with the resolved library ID and your specific query to retrieve current API specs, patterns, and code snippets.
- **Goal**: Prevent the use of outdated patterns or deprecated library features.

---
*Created per user request to maintain project memory for Antigravity.*
