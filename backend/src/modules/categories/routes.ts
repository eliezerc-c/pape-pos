import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';
import { validateBody } from '../../shared/middleware/validation';
import { z } from 'zod';

export const categoryRoutes = Router();

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

function respond(res: Response, data: any, message: string, success: boolean = true) {
  res.json({ data, message, success });
}

function getClientIp(req: Request): string {
  return (req.ip || req.socket.remoteAddress || 'unknown').replace(/::ffff:/, '');
}

async function createAuditLog(userId: string, action: string, entity: string | null, entityId: string | null, details: any, ip: string) {
  try {
    await prisma.auditLog.create({
      data: { userId: userId || null, action, entity, entityId, ip, details: details || {} },
    });
  } catch { /* silently fail */ }
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.userId) { res.status(401).json({ error: 'No autorizado' }); return; }
  prisma.user.findUnique({ where: { id: req.userId }, include: { role: true } }).then(user => {
    if (!user || user.role.name !== 'ADMIN') { res.status(403).json({ error: 'Se requiere rol de administrador' }); return; }
    next();
  }).catch(() => res.status(500).json({ error: 'Error al verificar permisos' }));
}

categoryRoutes.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [categories, total] = await Promise.all([
      prisma.category.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.category.count({ where }),
    ]);
    respond(res, { categories, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Categorias obtenidas');
  } catch { res.status(500).json({ error: 'Error al obtener categorias' }); }
});

categoryRoutes.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id }, include: { products: { take: 5 } },
    });
    if (!category) { res.status(404).json({ error: 'Categoria no encontrada' }); return; }
    respond(res, category, 'Categoria obtenida');
  } catch { res.status(500).json({ error: 'Error al obtener categoria' }); }
});

categoryRoutes.post('/', authenticate, requireAdmin, validateBody(createCategorySchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const existing = await prisma.category.findFirst({ where: { name } });
    if (existing) { res.status(409).json({ error: 'Categoria ya existe' }); return; }
    const category = await prisma.category.create({ data: { name, description } });
    await createAuditLog(req.userId, 'CREATE_CATEGORY', 'Category', category.id, { name }, getClientIp(req));
    respond(res, category, 'Categoria creada');
  } catch (err: any) {
    if (err.message?.includes('Unique constraint')) { res.status(409).json({ error: 'Categoria ya existe' }); return; }
    res.status(500).json({ error: 'Error al crear categoria' });
  }
});

categoryRoutes.put('/:id', authenticate, requireAdmin, validateBody(updateCategorySchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!category) { res.status(404).json({ error: 'Categoria no encontrada' }); return; }
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (name) {
      const existing = await prisma.category.findFirst({ where: { name, NOT: { id: req.params.id } } });
      if (existing) { res.status(409).json({ error: 'Categoria ya existe' }); return; }
    }
    const updated = await prisma.category.update({ where: { id: req.params.id }, data: updateData });
    await createAuditLog(req.userId, 'UPDATE_CATEGORY', 'Category', updated.id, { changes: updateData }, getClientIp(req));
    respond(res, updated, 'Categoria actualizada');
  } catch (err: any) {
    if (err.message?.includes('Unique constraint')) { res.status(409).json({ error: 'Categoria ya existe' }); return; }
    res.status(500).json({ error: 'Error al actualizar categoria' });
  }
});

categoryRoutes.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id }, include: { products: true },
    });
    if (!category) { res.status(404).json({ error: 'Categoria no encontrada' }); return; }
    if (category.products.length > 0) {
      res.status(400).json({ error: 'No se puede eliminar una categoria con productos asociados' });
      return;
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    await createAuditLog(req.userId, 'DELETE_CATEGORY', 'Category', category.id, {}, getClientIp(req));
    respond(res, null, 'Categoria eliminada');
  } catch { res.status(500).json({ error: 'Error al eliminar categoria' }); }
});

categoryRoutes.put('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (typeof status !== 'boolean') { res.status(400).json({ error: 'Status invalido' }); return; }
    const category = await prisma.category.update({
      where: { id: req.params.id }, data: { status },
    });
    await createAuditLog(req.userId, 'TOGGLE_CATEGORY_STATUS', 'Category', category.id, { status }, getClientIp(req));
    respond(res, category, 'Estado de categoria actualizado');
  } catch { res.status(500).json({ error: 'Error al actualizar estado de categoria' }); }
});
