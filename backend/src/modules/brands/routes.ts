import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../../config/database';
import { authenticate, AuthRequest } from '../../../shared/middleware/auth';
import { validateBody } from '../../../shared/middleware/validation';
import { z } from 'zod';

export const brandRoutes = Router();

const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const updateBrandSchema = z.object({
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

brandRoutes.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [brands, total] = await Promise.all([
      prisma.brand.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.brand.count({ where }),
    ]);
    respond(res, { brands, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Marcas obtenidas');
  } catch { res.status(500).json({ error: 'Error al obtener marcas' }); }
});

brandRoutes.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id }, include: { products: { take: 5 } },
    });
    if (!brand) { res.status(404).json({ error: 'Marca no encontrada' }); return; }
    respond(res, brand, 'Marca obtenida');
  } catch { res.status(500).json({ error: 'Error al obtener marca' }); }
});

brandRoutes.post('/', authenticate, requireAdmin, validateBody(createBrandSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const existing = await prisma.brand.findFirst({ where: { name } });
    if (existing) { res.status(409).json({ error: 'Marca ya existe' }); return; }
    const brand = await prisma.brand.create({ data: { name, description } });
    await createAuditLog(req.userId, 'CREATE_BRAND', 'Brand', brand.id, { name }, getClientIp(req));
    respond(res, brand, 'Marca creada');
  } catch (err: any) {
    if (err.message?.includes('Unique constraint')) { res.status(409).json({ error: 'Marca ya existe' }); return; }
    res.status(500).json({ error: 'Error al crear marca' });
  }
});

brandRoutes.put('/:id', authenticate, requireAdmin, validateBody(updateBrandSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const brand = await prisma.brand.findUnique({ where: { id: req.params.id } });
    if (!brand) { res.status(404).json({ error: 'Marca no encontrada' }); return; }
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (name) {
      const existing = await prisma.brand.findFirst({ where: { name, NOT: { id: req.params.id } } });
      if (existing) { res.status(409).json({ error: 'Marca ya existe' }); return; }
    }
    const updated = await prisma.brand.update({ where: { id: req.params.id }, data: updateData });
    await createAuditLog(req.userId, 'UPDATE_BRAND', 'Brand', updated.id, { changes: updateData }, getClientIp(req));
    respond(res, updated, 'Marca actualizada');
  } catch (err: any) {
    if (err.message?.includes('Unique constraint')) { res.status(409).json({ error: 'Marca ya existe' }); return; }
    res.status(500).json({ error: 'Error al actualizar marca' });
  }
});

brandRoutes.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id }, include: { products: true },
    });
    if (!brand) { res.status(404).json({ error: 'Marca no encontrada' }); return; }
    if (brand.products.length > 0) {
      res.status(400).json({ error: 'No se puede eliminar una marca con productos asociados' });
      return;
    }
    await prisma.brand.delete({ where: { id: req.params.id } });
    await createAuditLog(req.userId, 'DELETE_BRAND', 'Brand', brand.id, {}, getClientIp(req));
    respond(res, null, 'Marca eliminada');
  } catch { res.status(500).json({ error: 'Error al eliminar marca' }); }
});

brandRoutes.put('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (typeof status !== 'boolean') { res.status(400).json({ error: 'Status invalido' }); return; }
    const brand = await prisma.brand.update({
      where: { id: req.params.id }, data: { status },
    });
    await createAuditLog(req.userId, 'TOGGLE_BRAND_STATUS', 'Brand', brand.id, { status }, getClientIp(req));
    respond(res, brand, 'Estado de marca actualizado');
  } catch { res.status(500).json({ error: 'Error al actualizar estado de marca' }); }
});
