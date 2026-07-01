import express from 'express';
import prisma from '../prisma.js';
import { z } from 'zod';
import { requireSession } from './tickets.js';

const router = express.Router({ mergeParams: true });

// Submit a reply to a ticket
router.post('/', requireSession, async (req, res, next) => {
  try {
    const ticketId = Number(req.params.ticketId);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID format.' });
    }

    const bodySchema = z.object({
      body: z.string().min(1, 'Reply message cannot be empty.').max(10000, 'Reply message is too long (maximum 10,000 characters).'),
      bodyHtml: z.string().max(20000, 'HTML reply body cannot exceed 20,000 characters.').optional(),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid parameters.' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const session = (req as any).session;
    const senderEmail = session.user.email;
    const senderName = session.user.name || 'Agent';

    const newMessage = await prisma.message.create({
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
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
      },
    });

    return res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
});

export default router;
