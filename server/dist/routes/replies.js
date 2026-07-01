"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.polishReplySchema = exports.replyBodySchema = void 0;
const express_1 = __importDefault(require("express"));
const prisma_js_1 = __importDefault(require("../prisma.js"));
const zod_1 = require("zod");
const groq_1 = require("@ai-sdk/groq");
const ai_1 = require("ai");
const tickets_js_1 = require("./tickets.js");
const router = express_1.default.Router({ mergeParams: true });
// ── Schemas ──────────────────────────────────────────────────────────────────
exports.replyBodySchema = zod_1.z.object({
    body: zod_1.z.string().min(1, 'Reply message cannot be empty.').max(10000, 'Reply message is too long (maximum 10,000 characters).'),
    bodyHtml: zod_1.z.string().max(20000, 'HTML reply body cannot exceed 20,000 characters.').optional(),
});
exports.polishReplySchema = zod_1.z.object({
    draftReply: zod_1.z.string().min(1, 'Draft reply cannot be empty.'),
    ticketBody: zod_1.z.string().optional(),
    customerName: zod_1.z.string().optional(),
});
// ── Routes ───────────────────────────────────────────────────────────────────
// Submit a reply to a ticket
router.post('/', tickets_js_1.requireSession, async (req, res, next) => {
    try {
        const ticketId = Number(req.params.ticketId);
        if (isNaN(ticketId)) {
            return res.status(400).json({ error: 'Invalid ticket ID format.' });
        }
        const parsed = exports.replyBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid parameters.' });
        }
        const ticket = await prisma_js_1.default.ticket.findUnique({
            where: { id: ticketId },
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found.' });
        }
        const session = req.session;
        const senderEmail = session.user.email;
        const senderName = session.user.name || 'Agent';
        const newMessage = await prisma_js_1.default.message.create({
            data: {
                ticketId,
                sender: senderName,
                senderEmail,
                senderType: 'agent',
                body: parsed.data.body,
                bodyHtml: parsed.data.bodyHtml ?? null,
            },
        });
        // Update ticket's updatedAt
        await prisma_js_1.default.ticket.update({
            where: { id: ticketId },
            data: {
                updatedAt: new Date(),
            },
        });
        return res.status(201).json(newMessage);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/tickets/:ticketId/messages/polish
 * Takes a rough agent reply draft and returns a polished version using Groq.
 */
router.post('/polish', tickets_js_1.requireSession, async (req, res, next) => {
    try {
        const parsed = exports.polishReplySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body.' });
        }
        const { draftReply, ticketBody, customerName } = parsed.data;
        const agentName = req.session?.user?.name || 'Support Agent';
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return res.status(503).json({ error: 'AI service is not configured. GROQ_API_KEY is missing.' });
        }
        const groq = (0, groq_1.createGroq)({ apiKey: groqApiKey });
        const systemPrompt = `You are an expert customer support writing assistant. Your task is to polish and improve a support agent's draft reply.

Rules:
- Fix grammar, spelling, and punctuation errors.
- Improve clarity and conciseness.
- Make the tone professional, warm, and helpful.
- Keep the original meaning and intent completely intact.
- Do NOT add new information or promises that weren't in the original draft.
- Address the customer by their first name (${customerName ?? 'the customer'}) at the start of the reply if not already done.
- End the reply with a proper sign-off using the agent's name: ${agentName}.
- Do NOT include any preamble like "Here is the polished reply:" — return ONLY the improved reply text itself.`;
        const userPrompt = ticketBody
            ? `Customer's Message:
${ticketBody}

Agent's Draft Reply to polish:
${draftReply}`
            : `Agent's Draft Reply to polish:
${draftReply}`;
        const { text } = await (0, ai_1.generateText)({
            model: groq('llama-3.3-70b-versatile'),
            system: systemPrompt,
            prompt: userPrompt,
        });
        return res.json({ polishedReply: text.trim() });
    }
    catch (error) {
        console.error('AI polish-reply error:', error);
        next(error);
    }
});
exports.default = router;
