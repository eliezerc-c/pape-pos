import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

export const securityHeaders = helmet();

export const corsConfig = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});

export function validateBody(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Datos invalidos', details: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };
}
