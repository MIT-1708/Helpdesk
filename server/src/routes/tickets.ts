import express from 'express';
import prisma from '../prisma.js';
import { z } from 'zod';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';
import { TicketStatus, TicketCategory } from '@helpdesk/core';

const router = express.Router();

// Middleware to verify session for both Admin and Agent
const requireSession = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }

    (req as any).session = session;
    next();
  } catch (error) {
    next(error);
  }
};

const getTicketsQuerySchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  search: z.string().optional(),
});

router.get('/', requireSession, async (req, res, next) => {
  try {
    const parsed = getTicketsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid query parameters.' });
    }

    const { status, category, search } = parsed.data;

    // Build filters
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const categoryMap: Record<string, 'GENERAL' | 'TECHNICAL' | 'REFUND'> = {
      'General Question': 'GENERAL',
      'Technical Question': 'TECHNICAL',
      'Refund Request': 'REFUND',
    };

    if (category) {
      where.category = categoryMap[category];
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { senderEmail: { contains: search, mode: 'insensitive' } },
        { senderName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Retrieve tickets sorted by newest first
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.json(tickets);
  } catch (error) {
    next(error);
  }
});

export default router;
