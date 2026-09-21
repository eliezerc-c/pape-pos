import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, CashRegisterStatus } from '@prisma/client';
import { authenticate } from '../../shared/middleware/auth';
import { validateBody } from '../../shared/middleware/validation';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../shared/middleware/error-handler';

export const cashRegisterRoutes = Router();

const openSchema = {
  safeParse: (body: any) => {
    if (!body.initialFund || body.initialFund <= 0) {
      return { success: false, error: { fieldErrors: { initialFund: 'El fondo inicial es requerido y debe ser > 0' } } };
    }
    return { success: true, data: body };
  },
};

const closeSchema = {
  safeParse: (body: any) => {
    if (!body.countedCash || body.countedCash < 0) {
      return { success: false, error: { fieldErrors: { countedCash: 'El efectivo contado es requerido y debe ser >= 0' } } };
    }
    return { success: true, data: body };
  },
};

cashRegisterRoutes.post('/open', authenticate, validateBody(openSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { initialFund } = req.body;
    const userId = (req as any).userId;

    const existing = await prisma.cashRegister.findFirst({
      where: { userId, status: CashRegisterStatus.OPEN },
    });

    if (existing) throw new AppError(400, 'Ya existe una caja abierta');

    const cashRegister = await prisma.cashRegister.create({
      data: {
        userId,
        openDate: new Date(),
        initialFund,
        expectedCash: initialFund,
        status: CashRegisterStatus.OPEN,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CASH_REGISTER_OPEN',
        entity: 'CashRegister',
        entityId: cashRegister.id,
        details: { initialFund },
      },
    });

    res.status(201).json({ message: 'Caja abierta', data: cashRegister });
  } catch (err: any) {
    next(err);
  }
});

cashRegisterRoutes.post('/close', authenticate, validateBody(closeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { countedCash } = req.body;
    const userId = (req as any).userId;

    const cashRegister = await prisma.cashRegister.findFirst({
      where: { userId, status: CashRegisterStatus.OPEN },
      orderBy: { openDate: 'desc' },
    });

    if (!cashRegister) throw new AppError(400, 'No hay una caja abierta');

    const difference = Number(countedCash) - Number(cashRegister.expectedCash);

    const updated = await prisma.cashRegister.update({
      where: { id: cashRegister.id },
      data: {
        closeDate: new Date(),
        countedCash,
        difference,
        status: CashRegisterStatus.CLOSED,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CASH_REGISTER_CLOSE',
        entity: 'CashRegister',
        entityId: updated.id,
        details: { countedCash, expectedCash: cashRegister.expectedCash, difference },
      },
    });

    res.json({ message: 'Caja cerrada', data: { ...updated, difference } });
  } catch (err: any) {
    next(err);
  }
});

cashRegisterRoutes.get('/current', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    const cashRegister = await prisma.cashRegister.findFirst({
      where: { userId, status: CashRegisterStatus.OPEN },
      orderBy: { openDate: 'desc' },
      include: { movements: { orderBy: { createdAt: 'desc' }, take: 20 }, sales: { take: 5, orderBy: { date: 'desc' } } },
    });

    if (!cashRegister) { res.status(404).json({ error: 'No hay una caja abierta' }); return; }
    res.json(cashRegister);
  } catch (err: any) {
    next(err);
  }
});

cashRegisterRoutes.get('/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, userId: filterUserId } = req.query;
    const where: any = {};
    if (filterUserId) where.userId = filterUserId;

    const cashRegisters = await prisma.cashRegister.findMany({
      where,
      include: { user: { select: { id: true, name: true, username: true } }, movements: true },
      orderBy: { openDate: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.cashRegister.count({ where });

    res.json({
      data: cashRegisters,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err: any) {
    next(err);
  }
});
