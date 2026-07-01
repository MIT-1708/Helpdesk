"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.boss = void 0;
exports.startQueue = startQueue;
const pg_boss_1 = require("pg-boss");
const prisma_js_1 = __importDefault(require("./prisma.js"));
const groq_1 = require("@ai-sdk/groq");
const ai_1 = require("ai");
// Initialize pg-boss with the database connection string
const boss = new pg_boss_1.PgBoss(process.env.DATABASE_URL);
exports.boss = boss;
boss.on('error', (error) => console.error('PgBoss Queue Error:', error));
// Classification worker logic
async function handleClassifyTicketJob(jobs) {
    const job = jobs[0];
    if (!job) {
        console.warn('[Queue Worker] Received empty jobs array.');
        return;
    }
    const { ticketId } = job.data;
    console.log(`[Queue Worker] Processing ticket classification for ID: ${ticketId}`);
    try {
        const ticket = await prisma_js_1.default.ticket.findUnique({
            where: { id: ticketId },
        });
        if (!ticket) {
            console.warn(`[Queue Worker] Ticket #${ticketId} not found. Skipping classification.`);
            return;
        }
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            console.warn('[Queue Worker] AI ticket classification skipped: GROQ_API_KEY is missing.');
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
            prompt: `Subject: ${ticket.subject}\nBody: ${ticket.body}`,
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
            console.log(`[Queue Worker] Ticket #${ticketId} automatically classified as ${category}`);
        }
        else {
            console.warn(`[Queue Worker] AI returned invalid category classification for ticket #${ticketId}: "${text}"`);
        }
    }
    catch (error) {
        console.error(`[Queue Worker] Failed to automatically classify ticket #${ticketId}:`, error);
        throw error; // Throw so pg-boss knows the job failed and can retry
    }
}
// Start queue and register workers
async function startQueue() {
    await boss.start();
    console.log('[Queue] PgBoss queue engine started.');
    // Explicitly create queue to prevent missing queue warnings
    await boss.createQueue('classify-ticket');
    // Register worker for 'classify-ticket'
    await boss.work('classify-ticket', handleClassifyTicketJob);
    console.log('[Queue] Worker registered for "classify-ticket" job.');
}
