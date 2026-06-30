"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_js_1 = __importDefault(require("../prisma.js"));
const auth_js_1 = require("../auth.js");
const core_1 = require("@helpdesk/core");
const crypto_1 = require("better-auth/crypto");
const validate_js_1 = require("../middleware/validate.js");
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
router.post('/', (0, validate_js_1.validateBody)(core_1.createUserSchema), async (req, res) => {
    const { name, email, password } = req.body;
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
// Update a user (Admin only)
router.put('/:id', (0, validate_js_1.validateBody)(core_1.updateUserSchema), async (req, res) => {
    const { id } = req.params;
    const { name, email, password } = req.body;
    // Check if user exists
    const user = await prisma_js_1.default.user.findUnique({
        where: { id },
    });
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }
    // Check if new email is taken by another user
    if (email.toLowerCase() !== user.email.toLowerCase()) {
        const emailTaken = await prisma_js_1.default.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (emailTaken) {
            return res.status(400).json({ error: 'A user with this email already exists.' });
        }
    }
    // Update name and email in the user table
    const updatedUser = await prisma_js_1.default.user.update({
        where: { id },
        data: {
            name: name.trim(),
            email: email.toLowerCase(),
        },
    });
    // Always update accountId in credential account when email is changed
    await prisma_js_1.default.account.updateMany({
        where: {
            userId: id,
            providerId: 'credential',
        },
        data: {
            accountId: email.toLowerCase(),
        },
    });
    // If password is provided, hash it and update in account table
    if (password) {
        const hashedPassword = await (0, crypto_1.hashPassword)(password);
        await prisma_js_1.default.account.updateMany({
            where: {
                userId: id,
                providerId: 'credential',
            },
            data: {
                password: hashedPassword,
            },
        });
    }
    res.json(updatedUser);
});
exports.default = router;
