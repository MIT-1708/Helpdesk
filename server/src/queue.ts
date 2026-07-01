import { PgBoss, Job } from 'pg-boss';
import prisma from './prisma.js';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

// Initialize pg-boss with the database connection string
const boss = new PgBoss(process.env.DATABASE_URL!);

boss.on('error', (error: any) => console.error('PgBoss Queue Error:', error));

// Classification worker logic
async function handleClassifyTicketJob(jobs: any[]) {
  const job = jobs[0];
  if (!job) {
    console.warn('[Queue Worker] Received empty jobs array.');
    return;
  }
  const { ticketId } = job.data;
  console.log(`[Queue Worker] Processing ticket classification for ID: ${ticketId}`);

  try {
    const ticket = await prisma.ticket.findUnique({
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

    const groq = createGroq({ apiKey: groqApiKey });

    const systemPrompt = `You are an expert customer support triaging assistant. Your task is to analyze the support ticket (subject and body) and classify it into exactly one of the following categories:
- GENERAL (for general inquiries, questions, account help, feedback, etc.)
- TECHNICAL (for server issues, bugs, system errors, login issues, database connection errors, etc.)
- REFUND (for billing inquiries, invoice issues, payment problems, refund requests, cancellation queries, etc.)

Rules:
- Output exactly one of these three words: GENERAL, TECHNICAL, or REFUND.
- Do NOT include any punctuation, explanation, preamble, or extra text. Output ONLY the uppercase word.`;

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      prompt: `Subject: ${ticket.subject}\nBody: ${ticket.body}`,
    });

    const category = text.trim().toUpperCase();

    // Map upper enum name to database values
    const categoryMapping: Record<string, string> = {
      GENERAL: 'GENERAL',
      TECHNICAL: 'TECHNICAL',
      REFUND: 'REFUND',
    };

    const targetCategory = categoryMapping[category];

    if (targetCategory) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          category: targetCategory as any,
        },
      });
      console.log(`[Queue Worker] Ticket #${ticketId} automatically classified as ${category}`);
    } else {
      console.warn(`[Queue Worker] AI returned invalid category classification for ticket #${ticketId}: "${text}"`);
    }
  } catch (error) {
    console.error(`[Queue Worker] Failed to automatically classify ticket #${ticketId}:`, error);
    throw error; // Throw so pg-boss knows the job failed and can retry
  }
}

// Start queue and register workers
export async function startQueue() {
  await boss.start();
  console.log('[Queue] PgBoss queue engine started.');
  
  // Explicitly create queue to prevent missing queue warnings
  await boss.createQueue('classify-ticket');
  
  // Register worker for 'classify-ticket'
  await boss.work('classify-ticket', handleClassifyTicketJob);
  console.log('[Queue] Worker registered for "classify-ticket" job.');
}

export { boss };
