import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import prisma from "./prisma.js";

export const auth = betterAuth({
  trustedOrigins: [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
  ].filter(Boolean) as string[],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.BYPASS_DISABLE_SIGNUP === "true" ? false : true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "agent",
      },
      deletedAt: {
        type: "date",
        required: false,
      },
    },
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === "production" || process.env.ENABLE_RATE_LIMIT === "true",
    storage: "memory",
    window: 60, // 60 seconds
    max: 50,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 10,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.context.returned) {
        const returned = ctx.context.returned as any;
        if (returned && returned.user) {
          const dbUser = await prisma.user.findUnique({
            where: { id: returned.user.id },
          });
          if (dbUser && dbUser.deletedAt) {
            return ctx.json({
              error: "Your account has been deleted.",
              session: null,
              user: null,
            }, { status: 401 });
          }
        }
        if (returned && returned.session && ctx.path === "/get-session") {
          const { token, ...sanitizedSession } = returned.session;
          return ctx.json({
            ...returned,
            session: sanitizedSession,
          });
        }
      }
    }),
  },
});

export const adminAuthHelper = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false, // Always allow programmatic signup via admin API helper
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "agent",
      },
      deletedAt: {
        type: "date",
        required: false,
      },
    },
  },
});




