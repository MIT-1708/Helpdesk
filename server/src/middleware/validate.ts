
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const validation = schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: validation.error.issues[0]?.message || 'Invalid input data.',
    });
  }
  req.body = validation.data;
  next();
};
