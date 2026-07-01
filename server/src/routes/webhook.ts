import express from 'express';
import prisma from '../prisma.js';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { TicketStatus, TicketCategory } from '@helpdesk/core';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { Ticket } from '@prisma/client';

const router = express.Router();

const inboundEmailSchema = z.object({
  from: z.string().email('Invalid sender email format.').max(255, 'Email cannot exceed 255 characters.'),
  name: z.string().max(255, 'Name cannot exceed 255 characters.').optional(),
  subject: z.string().min(1, 'Subject cannot be empty.').max(255, 'Subject cannot exceed 255 characters.'),
  body: z.string().min(1, 'Body cannot be empty.').max(1000, 'Body cannot exceed 50,000 characters.'),
  bodyHtml: z.string().max(3000, 'HTML Body cannot exceed 100,000 characters.').optional(),
  category: z.nativeEnum(TicketCategory).optional(),
});

router.post('/inbound-email', validateBody(inboundEmailSchema), async (req, res) => {
  const { from, name, subject, body, bodyHtml, category } = req.body;

  // 1. Threading detection: Check if subject contains [Ticket #<Int>]
  const ticketIdMatch = subject.match(/\[Ticket #(\d+)\]/);

  if (ticketIdMatch) {
    const ticketId = parseInt(ticketIdMatch[1], 10);
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (existingTicket) {
      // Create new message under the existing ticket
      const newMessage = await prisma.message.create({
        data: {
          ticketId: existingTicket.id,
          sender: 'student',
          senderEmail: from.toLowerCase(),
          senderType: 'customer',
          body: body,
        },
      });

      // Re-open ticket and bump updatedAt
      const updatedTicket = await prisma.ticket.update({
        where: { id: existingTicket.id },
        data: {
          status: TicketStatus.OPEN,
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

  const categoryMap: Record<string, 'GENERAL' | 'TECHNICAL' | 'REFUND'> = {
    'General Question': 'GENERAL',
    'Technical Question': 'TECHNICAL',
    'Refund Request': 'REFUND',
  };

  // 2. Create new Ticket if no thread matched
  const newTicket = await prisma.ticket.create({
    data: {
      subject: subject,
      body: body,
      bodyHtml: bodyHtml || null,
      senderEmail: from.toLowerCase(),
      senderName: name || null,
      status: TicketStatus.OPEN,
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

async function classifyTicketInBackground(ticket: Ticket) {
  const { id: ticketId, subject, body } = ticket;
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.warn('AI ticket classification skipped: GROQ_API_KEY is missing.');
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
      prompt: `Subject: ${subject}\nBody: ${body}`,
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
      console.log(`[AI Classification] Ticket #${ticketId} automatically classified as ${category}`);
    } else {
      console.warn(`[AI Classification] AI returned invalid category classification for ticket #${ticketId}: "${text}"`);
    }
  } catch (error) {
    console.error(`[AI Classification] Failed to automatically classify ticket #${ticketId}:`, error);
  }
}

export default router;
