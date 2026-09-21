import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(`[ERROR] ${err.message}`, err.stack);
  
  if (err.message.includes('Unique constraint')) {
    res.status(409).json({ error: 'Registro duplicado detectado' });
    return;
  }
  
  if (err.message.includes('Foreign key')) {
    res.status(400).json({ error: 'Referencia invalida detectada' });
    return;
  }

  res.status(500).json({ error: err.message || 'Error interno del servidor' });
}

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
