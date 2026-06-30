import express from 'express';
import prisma from '../prisma.js';
import { adminAuthHelper } from '../auth.js';
import { createUserSchema, updateUserSchema } from '@helpdesk/core';
import { hashPassword } from 'better-auth/crypto';
import { validateBody } from '../middleware/validate.js';

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
router.post('/', validateBody(createUserSchema), async (req, res) => {
  const { name, email, password } = req.body;

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

// Update a user (Admin only)
router.put('/:id', validateBody(updateUserSchema), async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Check if new email is taken by another user
  if (email.toLowerCase() !== user.email.toLowerCase()) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (emailTaken) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }
  }

  // Update name and email in the user table
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
    },
  });

  // Always update accountId in credential account when email is changed
  await prisma.account.updateMany({
    where: {
      userId: id,
      providerId: 'credential',
    },
    data: {
      accountId: email.toLowerCase(),
    },
  });

  // If password is provided, hash it and update in account table
  if (password) {
    const hashedPassword = await hashPassword(password);
    await prisma.account.updateMany({
      where: {
        userId: id,
        providerId: 'credential',
      },
      data: {
        password: hashedPassword,
      },
    });
  }

  res.json(updatedUser);
});

export default router;
