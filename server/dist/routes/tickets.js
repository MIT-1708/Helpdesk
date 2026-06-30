"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_js_1 = __importDefault(require("../prisma.js"));
const zod_1 = require("zod");
const node_1 = require("better-auth/node");
const auth_js_1 = require("../auth.js");
const core_1 = require("@helpdesk/core");
const router = express_1.default.Router();
// Middleware to verify session for both Admin and Agent
const requireSession = async (req, res, next) => {
    try {
        const session = await auth_js_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).json({ error: 'Unauthorized: No active session' });
        }
        req.session = session;
        next();
    }
    catch (error) {
        next(error);
    }
};
const getTicketsQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(core_1.TicketStatus).optional(),
    category: zod_1.z.nativeEnum(core_1.TicketCategory).optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['id', 'subject', 'status', 'category', 'createdAt', 'senderEmail']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(10),
});
router.get('/', requireSession, async (req, res, next) => {
    try {
        const parsed = getTicketsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid query parameters.' });
        }
        const { status, category, search, sortBy, sortOrder, page, pageSize } = parsed.data;
        // Build filters
        const where = {};
        if (status) {
            where.status = status;
        }
        const categoryMap = {
            'General Question': 'GENERAL',
            'Technical Question': 'TECHNICAL',
            'Refund Request': 'REFUND',
        };
        if (category) {
            where.category = categoryMap[category];
        }
        if (search) {
            where.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { body: { contains: search, mode: 'insensitive' } },
                { senderEmail: { contains: search, mode: 'insensitive' } },
                { senderName: { contains: search, mode: 'insensitive' } },
            ];
        }
        const totalCount = await prisma_js_1.default.ticket.count({ where });
        // Retrieve tickets sorted and paginated
        const tickets = await prisma_js_1.default.ticket.findMany({
            where,
            orderBy: {
                [sortBy]: sortOrder,
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        return res.json({
            tickets,
            pagination: {
                totalCount,
                page,
                pageSize,
                totalPages: Math.ceil(totalCount / pageSize),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', requireSession, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ticket ID format.' });
        }
        const ticket = await prisma_js_1.default.ticket.findUnique({
            where: { id },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found.' });
        }
        return res.json(ticket);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
