"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_js_1 = __importDefault(require("../prisma.js"));
const auth_js_1 = require("../auth.js");
const core_1 = require("@helpdesk/core");
const router = express_1.default.Router();
// Fetch all users (Admin only)
router.get('/', async (req, res) => {
    const users = await prisma_js_1.default.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            image: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    res.json(users);
});
// Create a new agent user (Admin only)
router.post('/', async (req, res) => {
    const validation = core_1.createUserSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues[0]?.message || 'Invalid input data.' });
    }
    const { name, email, password } = validation.data;
    // Check if user already exists
    const existingUser = await prisma_js_1.default.user.findUnique({
        where: { email: email.toLowerCase() },
    });
    if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
    }
    // Call Better Auth helper API to create user with hashed password (always as agent)
    const result = await auth_js_1.adminAuthHelper.api.signUpEmail({
        body: {
            email: email.toLowerCase(),
            password,
            name: name.trim(),
            role: 'agent',
        },
    });
    res.status(201).json(result.user);
});
exports.default = router;
