"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSession = void 0;
const express_1 = __importDefault(require("express"));
const prisma_js_1 = __importDefault(require("../prisma.js"));
const zod_1 = require("zod");
const node_1 = require("better-auth/node");
const auth_js_1 = require("../auth.js");
const core_1 = require("@helpdesk/core");
const groq_1 = require("@ai-sdk/groq");
const ai_1 = require("ai");
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
exports.requireSession = requireSession;
const getTicketsQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(core_1.TicketStatus).optional(),
    category: zod_1.z.nativeEnum(core_1.TicketCategory).optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['id', 'subject', 'status', 'category', 'createdAt', 'senderEmail']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(10),
});
router.get('/', exports.requireSession, async (req, res, next) => {
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
// Fetch all assignable agents/admins
router.get('/assignees', exports.requireSession, async (req, res, next) => {
    try {
        const assignees = await prisma_js_1.default.user.findMany({
            where: {
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return res.json(assignees);
    }
    catch (error) {
        next(error);
    }
});
// Assign ticket to an agent/admin
router.patch('/:id/assign', exports.requireSession, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ticket ID format.' });
        }
        let { agentId } = req.body;
        if (agentId === '') {
            agentId = null;
        }
        if (agentId !== null && typeof agentId !== 'string') {
            return res.status(400).json({ error: 'Invalid agentId format. Must be a string or null.' });
        }
        if (agentId) {
            const agent = await prisma_js_1.default.user.findUnique({
                where: { id: agentId },
            });
            if (!agent || agent.deletedAt !== null) {
                return res.status(404).json({ error: 'Agent not found or is inactive.' });
            }
        }
        const updatedTicket = await prisma_js_1.default.ticket.update({
            where: { id },
            data: {
                assignedToId: agentId,
            },
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
        return res.json(updatedTicket);
    }
    catch (error) {
        next(error);
    }
});
const updateTicketBodySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(core_1.TicketStatus).optional(),
    category: zod_1.z.nativeEnum(core_1.TicketCategory).nullable().optional(),
});
// Update ticket status and/or category
router.patch('/:id', exports.requireSession, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ticket ID format.' });
        }
        const parsed = updateTicketBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid parameters.' });
        }
        const { status, category } = parsed.data;
        const ticket = await prisma_js_1.default.ticket.findUnique({
            where: { id },
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found.' });
        }
        const data = {};
        if (status !== undefined) {
            data.status = status;
        }
        if (category !== undefined) {
            const categoryMap = {
                'General Question': 'GENERAL',
                'Technical Question': 'TECHNICAL',
                'Refund Request': 'REFUND',
            };
            data.category = category ? categoryMap[category] : null;
        }
        const updatedTicket = await prisma_js_1.default.ticket.update({
            where: { id },
            data,
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
        return res.json(updatedTicket);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', exports.requireSession, async (req, res, next) => {
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
// Summarize ticket conversation history
router.post('/:id/summarize', exports.requireSession, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ticket ID format.' });
        }
        const ticket = await prisma_js_1.default.ticket.findUnique({
            where: { id },
            include: {
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
        const conversationParts = [
            `Subject: ${ticket.subject}`,
            `Description: ${ticket.body}`,
        ];
        if (ticket.messages && ticket.messages.length > 0) {
            conversationParts.push('\nConversation History:');
            ticket.messages.forEach((msg, idx) => {
                // Skip the very first message if it's just the creation description
                if (idx > 0) {
                    conversationParts.push(`- [${msg.senderType === 'agent' ? 'Agent' : 'Customer'} (${msg.sender || 'Unknown'} - ${msg.senderEmail})]: ${msg.body}`);
                }
            });
        }
        const conversationText = conversationParts.join('\n');
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return res.status(503).json({ error: 'AI service is not configured. GROQ_API_KEY is missing.' });
        }
        const groq = (0, groq_1.createGroq)({ apiKey: groqApiKey });
        const systemPrompt = `You are an expert customer support assistant. Your task is to analyze the support ticket's conversation history and provide a concise, high-level summary of the issue, what has been discussed or resolved so far, and any outstanding next steps.

Rules:
- Be clear, concise, and objective.
- Present the summary in a clean bulleted format (e.g. Main Issue, Action Taken, Next Steps).
- Do NOT include any preamble (like "Here is the summary:") — return ONLY the summary text.`;
        const { text } = await (0, ai_1.generateText)({
            model: groq('llama-3.3-70b-versatile'),
            system: systemPrompt,
            prompt: `Please summarize the following ticket conversation history:\n\n${conversationText}`,
        });
        return res.json({ summary: text.trim() });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
