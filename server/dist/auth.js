"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const api_1 = require("better-auth/api");
const prisma_js_1 = __importDefault(require("./prisma.js"));
exports.auth = (0, better_auth_1.betterAuth)({
    trustedOrigins: [process.env.CLIENT_URL || "http://localhost:5173"],
    database: (0, prisma_1.prismaAdapter)(prisma_js_1.default, {
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
        enabled: true,
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
        after: (0, api_1.createAuthMiddleware)(async (ctx) => {
            if (ctx.path === "/get-session" && ctx.context.returned) {
                const returned = ctx.context.returned;
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
