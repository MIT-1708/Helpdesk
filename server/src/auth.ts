import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import prisma from "./prisma.js";

export const auth = betterAuth({
  trustedOrigins: [process.env.CLIENT_URL || "http://localhost:5173"],
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
        required: false,
        defaultValue: "agent",
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
      if (ctx.path === "/get-session" && ctx.context.returned) {
        const returned = ctx.context.returned as any;
        if (returned && returned.session) {
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


