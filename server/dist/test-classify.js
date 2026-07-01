"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const groq_1 = require("@ai-sdk/groq");
const ai_1 = require("ai");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const prisma = new client_1.PrismaClient();
async function classifyTicketInBackground(ticketId, subject, body) {
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
        console.log('Calling Groq API...');
        const { text } = await (0, ai_1.generateText)({
            model: groq('llama-3.3-70b-versatile'),
            system: systemPrompt,
            prompt: `Subject: ${subject}\nBody: ${body}`,
        });
        const category = text.trim().toUpperCase();
        console.log('AI returned category string:', category);
        // Map upper enum name to database values
        const categoryMapping = {
            GENERAL: client_1.TicketCategory.GENERAL,
            TECHNICAL: client_1.TicketCategory.TECHNICAL,
            REFUND: client_1.TicketCategory.REFUND,
        };
        const targetCategory = categoryMapping[category];
        if (targetCategory) {
            await prisma.ticket.update({
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
async function run() {
    const ticket = await prisma.ticket.findFirst({ orderBy: { id: 'desc' } });
    if (ticket) {
        console.log('Running classification on ticket #', ticket.id);
        await classifyTicketInBackground(ticket.id, ticket.subject, ticket.body);
    }
    await prisma.$disconnect();
}
run();
