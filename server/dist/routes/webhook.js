"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_js_1 = __importDefault(require("../prisma.js"));
const zod_1 = require("zod");
const validate_js_1 = require("../middleware/validate.js");
const core_1 = require("@helpdesk/core");
const groq_1 = require("@ai-sdk/groq");
const ai_1 = require("ai");
const router = express_1.default.Router();
const inboundEmailSchema = zod_1.z.object({
    from: zod_1.z.string().email('Invalid sender email format.').max(255, 'Email cannot exceed 255 characters.'),
    name: zod_1.z.string().max(255, 'Name cannot exceed 255 characters.').optional(),
    subject: zod_1.z.string().min(1, 'Subject cannot be empty.').max(255, 'Subject cannot exceed 255 characters.'),
    body: zod_1.z.string().min(1, 'Body cannot be empty.').max(1000, 'Body cannot exceed 50,000 characters.'),
    bodyHtml: zod_1.z.string().max(3000, 'HTML Body cannot exceed 100,000 characters.').optional(),
    category: zod_1.z.nativeEnum(core_1.TicketCategory).optional(),
});
router.post('/inbound-email', (0, validate_js_1.validateBody)(inboundEmailSchema), async (req, res) => {
    const { from, name, subject, body, bodyHtml, category } = req.body;
    // 1. Threading detection: Check if subject contains [Ticket #<Int>]
    const ticketIdMatch = subject.match(/\[Ticket #(\d+)\]/);
    if (ticketIdMatch) {
        const ticketId = parseInt(ticketIdMatch[1], 10);
        const existingTicket = await prisma_js_1.default.ticket.findUnique({
            where: { id: ticketId },
        });
        if (existingTicket) {
            // Create new message under the existing ticket
            const newMessage = await prisma_js_1.default.message.create({
                data: {
                    ticketId: existingTicket.id,
                    sender: 'student',
                    senderEmail: from.toLowerCase(),
                    senderType: 'customer',
                    body: body,
                },
            });
            // Re-open ticket and bump updatedAt
            const updatedTicket = await prisma_js_1.default.ticket.update({
                where: { id: existingTicket.id },
                data: {
                    status: core_1.TicketStatus.OPEN,
                    updatedAt: new Date(),
                },
            });
            return res.json({
                message: 'Reply appended to existing ticket successfully.',
                ticket: updatedTicket,
                newMessage,
            });
        }
    }
    const categoryMap = {
        'General Question': 'GENERAL',
        'Technical Question': 'TECHNICAL',
        'Refund Request': 'REFUND',
    };
    // 2. Create new Ticket if no thread matched
    const newTicket = await prisma_js_1.default.ticket.create({
        data: {
            subject: subject,
            body: body,
            bodyHtml: bodyHtml || null,
            senderEmail: from.toLowerCase(),
            senderName: name || null,
            status: core_1.TicketStatus.OPEN,
            category: category ? (categoryMap[category] || null) : null,
            messages: {
                create: {
                    sender: 'student',
                    senderEmail: from.toLowerCase(),
                    senderType: 'customer',
                    body: body,
                },
            },
        },
        include: {
            messages: true,
        },
    });
    // Trigger background classification if no category is specified
    if (!category) {
        classifyTicketInBackground(newTicket).catch((err) => {
            console.error('Failed to trigger background ticket classification:', err);
        });
    }
    return res.json({
        message: 'New ticket created from inbound email successfully.',
        ticket: newTicket,
    });
});
async function classifyTicketInBackground(ticket) {
    const { id: ticketId, subject, body } = ticket;
    try {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            console.warn('AI ticket classification skipped: GROQ_API_KEY is missing.');
            return;
        }
        const groq = (0, groq_1.createGroq)({ apiKey: groqApiKey });
        const systemPrompt = `You are an expert customer support triaging assistant. Your task is to analyze the support ticket (subject and body) and classify it into exactly one of the following categories:
- GENERAL (for general inquiries, questions, account help, feedback, etc.)
- TECHNICAL (for server issues, bugs, system errors, login issues, database connection errors, etc.)
- REFUND (for billing inquiries, invoice issues, payment problems, refund requests, cancellation queries, etc.)

Rules:
- Output exactly one of these three words: GENERAL, TECHNICAL, or REFUND.
- Do NOT include any punctuation, explanation, preamble, or extra text. Output ONLY the uppercase word.`;
        const { text } = await (0, ai_1.generateText)({
            model: groq('llama-3.3-70b-versatile'),
            system: systemPrompt,
            prompt: `Subject: ${subject}\nBody: ${body}`,
        });
        const category = text.trim().toUpperCase();
        // Map upper enum name to database values
        const categoryMapping = {
            GENERAL: 'GENERAL',
            TECHNICAL: 'TECHNICAL',
            REFUND: 'REFUND',
        };
        const targetCategory = categoryMapping[category];
        if (targetCategory) {
            await prisma_js_1.default.ticket.update({
                where: { id: ticketId },
                data: {
                    category: targetCategory,
                },
            });
            console.log(`[AI Classification] Ticket #${ticketId} automatically classified as ${category}`);
        }
        else {
            console.warn(`[AI Classification] AI returned invalid category classification for ticket #${ticketId}: "${text}"`);
        }
    }
    catch (error) {
        console.error(`[AI Classification] Failed to automatically classify ticket #${ticketId}:`, error);
    }
}
exports.default = router;
