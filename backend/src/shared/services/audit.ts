import prisma from '../../config/database';
import { Request } from 'express';

export interface AuditLogData {
  action: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, any>;
  ip?: string;
}

export async function createAuditLog(
  userId: string | null,
  { action, entity, entityId, details, ip }: AuditLogData
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        ip,
        details,
      },
    });
  } catch {
    console.error(`[AUDIT] Failed to create audit log for action: ${action}`);
  }
}

export async function createAuditLogFromRequest(
  req: Request,
  { action, entity, entityId, details }: AuditLogData
): Promise<void> {
  const userId = (req as any).userId || null;
  const ip = req.ip || req.socket.remoteAddress || null;

  await createAuditLog(userId, { action, entity, entityId, details, ip });
}

export async function getAuditLogs(
  filters?: { userId?: string; action?: string; entity?: string; page?: number; limit?: number }
): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
  const { userId, action, entity, page = 1, limit = 20 } = filters || {};

  const where: any = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entity) where.entity = entity;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getAuditLogById(id: string): Promise<any | null> {
  return prisma.auditLog.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, username: true } } },
  });
}

export async function cleanupAuditLogs(beforeDate: Date): Promise<void> {
  await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: beforeDate } },
  });
}
