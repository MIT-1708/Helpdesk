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
const queue_js_1 = require("../queue.js");
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
        await queue_js_1.boss.send('classify-ticket', { ticketId: newTicket.id });
    }
    return res.json({
        message: 'New ticket created from inbound email successfully.',
        ticket: newTicket,
    });
});
exports.default = router;
