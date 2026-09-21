import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';
import { validateBody } from '../../shared/middleware/validation';
import { z } from 'zod';

export const paymentRoutes = Router();

const createPaymentSchema = z.object({
  saleId: z.string().min(1),
  amount: z.number().min(0),
  method: z.string().optional().default('EFECTIVO'),
  change: z.number().min(0).optional().default(0),
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

paymentRoutes.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, include: { sale: true } }),
      prisma.payment.count(),
    ]);
    respond(res, { payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Pagos obtenidos');
  } catch { res.status(500).json({ error: 'Error al obtener pagos' }); }
});

paymentRoutes.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { sale: true } });
    if (!payment) { res.status(404).json({ error: 'Pago no encontrado' }); return; }
    respond(res, payment, 'Pago obtenido');
  } catch { res.status(500).json({ error: 'Error al obtener pago' }); }
});

paymentRoutes.get('/sale/:saleId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await prisma.payment.findUnique({ where: { saleId: req.params.saleId }, include: { sale: true } });
    if (!payment) { res.status(404).json({ error: 'Pago no encontrado para esta venta' }); return; }
    respond(res, payment, 'Pago obtenido');
  } catch { res.status(500).json({ error: 'Error al obtener pago' }); }
});

paymentRoutes.post('/', authenticate, validateBody(createPaymentSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { saleId, amount, method, change } = req.body;
    const existingPayment = await prisma.payment.findUnique({ where: { saleId } });
    if (existingPayment) { res.status(409).json({ error: 'Ya existe un pago para esta venta' }); return; }
    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) { res.status(404).json({ error: 'Venta no encontrada' }); return; }
    const payment = await prisma.payment.create({
      data: { saleId, amount, method: method || 'EFECTIVO', change: change || 0 },
      include: { sale: true },
    });
    await createAuditLog(req.userId, 'CREATE_PAYMENT', 'Payment', payment.id, { saleId, amount, method }, getClientIp(req));
    respond(res, payment, 'Pago registrado');
  } catch (err: any) {
    if (err.message?.includes('Unique constraint')) { res.status(409).json({ error: 'Ya existe un pago para esta venta' }); return; }
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});
