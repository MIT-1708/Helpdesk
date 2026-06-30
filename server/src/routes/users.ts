import express from 'express';
import prisma from '../prisma.js';
import { adminAuthHelper } from '../auth.js';
import { createUserSchema } from '@helpdesk/core';

const router = express.Router();

// Fetch all users (Admin only)
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  res.json(users);
});

// Create a new agent user (Admin only)
router.post('/', async (req, res) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.issues[0]?.message || 'Invalid input data.' });
  }

  const { name, email, password } = validation.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingUser) {
    return res.status(400).json({ error: 'A user with this email already exists.' });
  }

  // Call Better Auth helper API to create user with hashed password (always as agent)
  const result = await adminAuthHelper.api.signUpEmail({
    body: {
      email: email.toLowerCase(),
      password,
      name: name.trim(),
      role: 'agent',
    },
  });

  res.status(201).json(result.user);
});

export default router;
