import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { env } from '../../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string; roleId: string };
    req.userId = decoded.id;
    req.userRole = decoded.roleId;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalido' });
  }
}

export function requireRole(...roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userId) { res.status(401).json({ error: 'No autorizado' }); return; }
    if (!req.userRole) { res.status(403).json({ error: 'Sin permisos' }); return; }
    next();
  };
}
