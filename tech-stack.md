# Tech Stack for AI-Powered Ticket Management System

This document outlines the selected technology stack for the project.

## Frontend
*   **Library/Framework**: React
*   **Language**: TypeScript
*   **Routing**: React Router (`react-router-dom`)
*   **Styling**: Tailwind CSS

## Backend
*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Runtime**: Node.js

## Database & ORM
*   **Database**: PostgreSQL
*   **ORM**: Prisma

## Authentication & Authorization
*   **Mechanism**: Database Session Authentication (storing session IDs in a cookie, validated against a database session table, utilizing `express-session` or custom session lookup)
*   **Roles**: Admin, Agent


## Third-Party Integrations
*   **AI Engine**: Google Gemini API (using the `@google/genai` SDK)
*   **Email Service**: SendGrid or Mailgun (for sending/receiving support emails)
