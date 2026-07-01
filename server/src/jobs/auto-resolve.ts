import prisma from '../prisma.js';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { TicketStatus } from '@helpdesk/core';
import fs from 'fs';
import path from 'path';

// Load the knowledge base once at module level for efficiency
function loadKnowledgeBase(): string {
  const kbPath = path.resolve(process.cwd(), 'knowledge-base.md');
  try {
    return fs.readFileSync(kbPath, 'utf-8');
  } catch (error) {
    console.error('[Auto-Resolve] Failed to load knowledge-base.md:', error);
    return '';
  }
}

export async function handleAutoResolveJob(jobs: any[]) {
  const job = jobs[0];
  if (!job) {
    console.warn('[Auto-Resolve] Received empty jobs array.');
    return;
  }

  const { ticketId } = job.data;
  console.log(`[Auto-Resolve] Processing ticket #${ticketId}`);

  try {
    // 1. Set ticket status to PROCESSING
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: TicketStatus.PROCESSING },
    });

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      console.warn(`[Auto-Resolve] Ticket #${ticketId} not found. Skipping.`);
      return;
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.warn('[Auto-Resolve] Skipped: GROQ_API_KEY is missing. Setting ticket to open.');
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.OPEN },
      });
      return;
    }

    // 2. Load the knowledge base
    const knowledgeBase = loadKnowledgeBase();
    if (!knowledgeBase) {
      console.warn('[Auto-Resolve] Knowledge base is empty. Setting ticket to open.');
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.OPEN },
      });
      return;
    }

    // 3. Ask the AI to resolve
    const groq = createGroq({ apiKey: groqApiKey });

    const systemPrompt = `You are a professional and friendly customer support assistant for "MIT PATEL", an online programming education platform. Your task is to determine if you can confidently answer the customer's support ticket using ONLY the knowledge base provided below.

KNOWLEDGE BASE:
${knowledgeBase}

RESOLUTION RULES:
- You MUST only use information from the knowledge base above. Do NOT make up answers or add information not in the knowledge base.
- If the knowledge base contains a clear, complete answer to the customer's question, respond with a helpful reply.
- You MUST follow the escalation rules in the knowledge base. If ANY escalation rule applies, you MUST NOT resolve the ticket.
- If the question is vague, requires account-specific investigation, or the knowledge base doesn't cover it well enough, do NOT attempt to resolve.

REPLY FORMATTING & TONE RULES (only when canResolve is true):
- Start with a warm, personal greeting using the customer's first name (e.g., "Hi Sarah," or "Hello Alice,").
- Follow the greeting with exactly two newline characters (\\n\\n) so there is a full blank line space.
- Use a professional yet friendly and empathetic tone throughout. The customer should feel heard and valued.
- Structure the reply clearly with short paragraphs. Separate each paragraph with exactly two newline characters (\\n\\n).
- Use numbered steps or bullet points where appropriate, but make sure they are clearly separated.
- Directly address the customer's specific question — do not give generic responses.
- Follow the body of the message with exactly two newline characters (\\n\\n).
- End with a reassuring closing line (e.g., "If you have any other questions, feel free to reach out — we're happy to help!").
- Follow the closing line with exactly two newline characters (\\n\\n).
- Sign off exactly like this (with a double newline before "Best regards,"):
  
  Best regards,
  MIT PATEL Support Team
- Do NOT use markdown headers (#), bold (**), or code blocks. Use plain text only.
- Ensure the final reply is JSON-safe by properly escaping all newlines as \\n in the JSON string value.

RESPONSE FORMAT:
You must respond with valid JSON only, no markdown, no code fences:
{"canResolve": true, "reply": "Your helpful response here..."}
or
{"canResolve": false}`;

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      prompt: `Customer Name: ${ticket.senderName || 'Customer'}\nCustomer Email: ${ticket.senderEmail}\nSubject: ${ticket.subject}\nMessage: ${ticket.body}`,
    });

    // 4. Parse the AI response
    let result: { canResolve: boolean; reply?: string };
    try {
      result = JSON.parse(text.trim());
    } catch {
      console.warn(`[Auto-Resolve] AI returned invalid JSON for ticket #${ticketId}. Setting to open. Raw: "${text}"`);
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.OPEN },
      });
      return;
    }

    if (result.canResolve && result.reply) {
      // 5a. AI resolved — create reply message and mark resolved
      await prisma.message.create({
        data: {
          ticketId,
          sender: 'AI Assistant',
          senderEmail: 'ai@helpdesk.system',
          senderType: 'agent',
          body: result.reply,
        },
      });

      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.RESOLVED,
          updatedAt: new Date(),
        },
      });

      console.log(`[Auto-Resolve] Ticket #${ticketId} resolved by AI.`);
    } else {
      // 5b. AI could not resolve — set to open for human agents
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.OPEN,
          assignedToId: null,
        },
      });

      console.log(`[Auto-Resolve] Ticket #${ticketId} requires human attention. Set to open.`);
    }
  } catch (error) {
    console.error(`[Auto-Resolve] Failed for ticket #${ticketId}:`, error);

    // On error, ensure the ticket is set to open so it doesn't get stuck
    try {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.OPEN,
          assignedToId: null,
        },
      });
    } catch (updateError) {
      console.error(`[Auto-Resolve] Failed to set ticket #${ticketId} to open after error:`, updateError);
    }

    throw error;
  }
}
