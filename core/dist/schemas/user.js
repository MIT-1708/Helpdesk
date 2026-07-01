import { z } from 'zod';
export const createUserSchema = z.object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters.').max(255, 'Name cannot exceed 255 characters.'),
    email: z.string().trim().min(1, 'Email is required.').email('Invalid email format.').max(255, 'Email cannot exceed 255 characters.'),
    password: z.string().min(8, 'Password must be at least 8 characters.').max(100, 'Password cannot exceed 100 characters.'),
});
export const updateUserSchema = z.object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters.').max(255, 'Name cannot exceed 255 characters.'),
    email: z.string().trim().min(1, 'Email is required.').email('Invalid email format.').max(255, 'Email cannot exceed 255 characters.'),
    password: z.string().trim().optional().refine((val) => !val || (val.length >= 8 && val.length <= 100), {
        message: 'Password must be between 8 and 100 characters.',
    }),
});
