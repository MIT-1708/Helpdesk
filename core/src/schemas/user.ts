import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters.'),
  email: z.string().trim().min(1, 'Email is required.').email('Invalid email format.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters.'),
  email: z.string().trim().min(1, 'Email is required.').email('Invalid email format.'),
  password: z.string().trim().optional().refine((val) => !val || val.length >= 8, {
    message: 'Password must be at least 8 characters.',
  }),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

