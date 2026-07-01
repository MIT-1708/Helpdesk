import express from 'express';
import prisma from '../prisma.js';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { TicketStatus, TicketCategory } from '@helpdesk/core';
import { boss } from '../queue.js';

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
    await boss.send('classify-ticket', { ticketId: newTicket.id });
  }

  return res.json({
    message: 'New ticket created from inbound email successfully.',
    ticket: newTicket,
  });
});

export default router;
