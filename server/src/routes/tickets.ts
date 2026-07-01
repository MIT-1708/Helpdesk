import express from 'express';
import prisma from '../prisma.js';
import { z } from 'zod';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';
import { TicketStatus, TicketCategory } from '@helpdesk/core';

const router = express.Router();

// Middleware to verify session for both Admin and Agent
export const requireSession = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
  sortBy: z.enum(['id', 'subject', 'status', 'category', 'createdAt', 'senderEmail']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

router.get('/', requireSession, async (req, res, next) => {
  try {
    const parsed = getTicketsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid query parameters.' });
    }

    const { status, category, search, sortBy, sortOrder, page, pageSize } = parsed.data;

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

    const totalCount = await prisma.ticket.count({ where });

    // Retrieve tickets sorted and paginated
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
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

    return res.json({
      tickets,
      pagination: {
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Fetch all assignable agents/admins
router.get('/assignees', requireSession, async (req, res, next) => {
  try {
    const assignees = await prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return res.json(assignees);
  } catch (error) {
    next(error);
  }
});

// Assign ticket to an agent/admin
router.patch('/:id/assign', requireSession, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID format.' });
    }

    let { agentId } = req.body;
    if (agentId === '') {
      agentId = null;
    }

    if (agentId !== null && typeof agentId !== 'string') {
      return res.status(400).json({ error: 'Invalid agentId format. Must be a string or null.' });
    }

    if (agentId) {
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
      });
      if (!agent || agent.deletedAt !== null) {
        return res.status(404).json({ error: 'Agent not found or is inactive.' });
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        assignedToId: agentId,
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

    return res.json(updatedTicket);
  } catch (error) {
    next(error);
  }
});

const updateTicketBodySchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).nullable().optional(),
});

// Update ticket status and/or category
router.patch('/:id', requireSession, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID format.' });
    }

    const parsed = updateTicketBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid parameters.' });
    }

    const { status, category } = parsed.data;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const data: any = {};
    if (status !== undefined) {
      data.status = status;
    }
    if (category !== undefined) {
      const categoryMap: Record<string, 'GENERAL' | 'TECHNICAL' | 'REFUND'> = {
        'General Question': 'GENERAL',
        'Technical Question': 'TECHNICAL',
        'Refund Request': 'REFUND',
      };
      data.category = category ? categoryMap[category] : null;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data,
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

    return res.json(updatedTicket);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireSession, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID format.' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    return res.json(ticket);
  } catch (error) {
    next(error);
  }
});

export default router;
