import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../../config/database';
import { authenticate, AuthRequest } from '../../../shared/middleware/auth';
import { validateBody } from '../../../shared/middleware/validation';
import { z } from 'zod';
import { env } from '../../../config/env';

export const inventoryRoutes = Router();

const createMoveSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(999999),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const adjustSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0).max(999999),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const initialInventorySchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0).max(999999),
  reference: z.string().optional(),
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

inventoryRoutes.get('/moves', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const type = (req.query.type as string) || '';
    const productId = (req.query.productId as string) || '';
    const skip = (page - 1) * limit;
    const where: any = {};
    if (type) where.type = type;
    if (productId) where.productId = productId;
    const [moves, total] = await Promise.all([
      prisma.inventoryMove.findMany({
        where, skip, take: limit,
        include: { product: true, user: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryMove.count({ where }),
    ]);
    respond(res, { moves, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Movimientos de inventario');
  } catch { res.status(500).json({ error: 'Error al obtener movimientos' }); }
});

inventoryRoutes.get('/moves/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const move = await prisma.inventoryMove.findUnique({
      where: { id: req.params.id },
      include: { product: true, user: true },
    });
    if (!move) { res.status(404).json({ error: 'Movimiento no encontrado' }); return; }
    respond(res, move, 'Movimiento obtenido');
  } catch { res.status(500).json({ error: 'Error al obtener movimiento' }); }
});

inventoryRoutes.get('/kardex/:productId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.productId },
      include: { category: true, brand: true },
    });
    if (!product) { res.status(404).json({ error: 'Producto no encontrado' }); return; }
    const moves = await prisma.inventoryMove.findMany({
      where: { productId: req.params.productId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    let runningStock = product.stock - moves.reduce((sum, m) => {
      if (['ENTRADA', 'AJUSTE_POSITIVO', 'INVENTARIO_INICIAL', 'DEVOLUCION_COMPRA'].includes(m.type)) return sum + m.quantity;
      if (['SALIDA', 'AJUSTE_NEGATIVO', 'VENTA', 'MERMA', 'DAÑADO'].includes(m.type)) return sum - m.quantity;
      return sum;
    }, 0);
    const kardex = moves.map(move => {
      const sign = ['ENTRADA', 'AJUSTE_POSITIVO', 'INVENTARIO_INICIAL', 'DEVOLUCION_COMPRA'].includes(move.type) ? '+' : '-';
      if (['ENTRADA', 'AJUSTE_POSITIVO', 'INVENTARIO_INICIAL', 'DEVOLUCION_COMPRA'].includes(move.type)) {
        runningStock += move.quantity;
      } else if (['SALIDA', 'AJUSTE_NEGATIVO', 'VENTA', 'MERMA', 'DAÑADO'].includes(move.type)) {
        runningStock -= move.quantity;
      }
      return {
        id: move.id, type: move.type, quantity: move.quantity,
        stockBefore: move.stockBefore, stockAfter: move.stockAfter,
        reference: move.reference, notes: move.notes,
        createdAt: move.createdAt, user: move.user,
        runningStock, sign,
      };
    });
    respond(res, { product: { id: product.id, name: product.name, sku: product.sku, currentStock: product.stock }, kardex, totalMoves: moves.length }, 'Kardex del producto');
  } catch { res.status(500).json({ error: 'Error al obtener kardex' }); }
});

inventoryRoutes.get('/low-stock', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const products = await prisma.product.findMany({
      where: { active: true, stock: { lte: 1 } },
      include: { category: true, brand: true },
      orderBy: { stock: 'asc' }, skip, take: limit,
    });
    respond(res, { products, pagination: { page, limit, total: products.length } }, 'Productos con stock bajo');
  } catch { res.status(500).json({ error: 'Error al obtener productos con stock bajo' }); }
});

inventoryRoutes.post('/entries', authenticate, requireAdmin, validateBody(createMoveSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, quantity, reference, notes } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Producto no encontrado');
      const stockBefore = product.stock;
      const stockAfter = stockBefore + quantity;
      const move = await tx.inventoryMove.create({
        data: { productId, type: 'ENTRADA', quantity, reference: reference || null, notes: notes || null, stockBefore, stockAfter, userId: req.userId! },
      });
      await tx.product.update({ where: { id: productId }, data: { stock: stockAfter } });
      return { move, product };
    });
    await createAuditLog(req.userId, 'INVENTORY_ENTRY', 'Product', productId, { quantity, reference, stockAfter: result.move.stockAfter }, getClientIp(req));
    respond(res, { move: result.move, stockAfter: result.move.stockAfter, productId }, 'Entrada de inventario registrada');
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al registrar entrada' });
  }
});

inventoryRoutes.post('/exits', authenticate, requireAdmin, validateBody(createMoveSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, quantity, reference, notes } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Producto no encontrado');
      if (product.stock < quantity) throw new Error('Stock insuficiente');
      const stockBefore = product.stock;
      const stockAfter = stockBefore - quantity;
      const move = await tx.inventoryMove.create({
        data: { productId, type: 'SALIDA', quantity, reference: reference || null, notes: notes || null, stockBefore, stockAfter, userId: req.userId! },
      });
      await tx.product.update({ where: { id: productId }, data: { stock: stockAfter } });
      return { move, product };
    });
    await createAuditLog(req.userId, 'INVENTORY_EXIT', 'Product', productId, { quantity, reference, stockAfter: result.move.stockAfter }, getClientIp(req));
    respond(res, { move: result.move, stockAfter: result.move.stockAfter, productId }, 'Salida de inventario registrada');
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al registrar salida' });
  }
});

inventoryRoutes.post('/adjust', authenticate, requireAdmin, validateBody(adjustSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, quantity, reference, notes } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Producto no encontrado');
      const stockBefore = product.stock;
      const isPositive = product.stock <= quantity;
      const stockAfter = isPositive ? stockBefore + quantity : stockBefore - quantity;
      const type = isPositive ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO';
      const move = await tx.inventoryMove.create({
        data: { productId, type, quantity, reference: reference || null, notes: notes || null, stockBefore, stockAfter, userId: req.userId! },
      });
      await tx.product.update({ where: { id: productId }, data: { stock: stockAfter } });
      return { move, product };
    });
    await createAuditLog(req.userId, 'INVENTORY_ADJUST', 'Product', productId, { quantity, type: result.move.type, reference }, getClientIp(req));
    respond(res, { move: result.move, stockAfter: result.move.stockAfter, productId }, 'Ajuste de inventario registrado');
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al registrar ajuste' });
  }
});

inventoryRoutes.post('/initial', authenticate, requireAdmin, validateBody(initialInventorySchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, quantity, reference } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Producto no encontrado');
      const move = await tx.inventoryMove.create({
        data: { productId, type: 'INVENTARIO_INICIAL', quantity, reference: reference || null, notes: 'Inventario inicial', stockBefore: 0, stockAfter: quantity, userId: req.userId! },
      });
      await tx.product.update({ where: { id: productId }, data: { stock: quantity } });
      return { move, product };
    });
    await createAuditLog(req.userId, 'INITIAL_INVENTORY', 'Product', productId, { quantity, reference }, getClientIp(req));
    respond(res, { move: result.move, stockAfter: quantity, productId }, 'Inventario inicial registrado');
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al registrar inventario inicial' });
  }
});

inventoryRoutes.get('/moves/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const move = await prisma.inventoryMove.findUnique({
      where: { id: req.params.id },
      include: { product: true, user: true },
    });
    if (!move) { res.status(404).json({ error: 'Movimiento no encontrado' }); return; }
    respond(res, move, 'Movimiento obtenido');
  } catch { res.status(500).json({ error: 'Error al obtener movimiento' }); }
});

inventoryRoutes.get('/stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalProducts, lowStockCount, totalMoves, totalEntries, totalExits] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true, stock: { lte: 1 } } }),
      prisma.inventoryMove.count(),
      prisma.inventoryMove.count({ where: { type: 'ENTRADA' } }),
      prisma.inventoryMove.count({ where: { type: 'SALIDA' } }),
    ]);
    respond(res, { totalProducts, lowStockCount, totalMoves, totalEntries, totalExits }, 'Estadisticas de inventario');
  } catch { res.status(500).json({ error: 'Error al obtener estadisticas' }); }
});
