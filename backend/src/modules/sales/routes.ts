import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, SaleStatus, MoveType } from '@prisma/client';
import { authenticate } from '../../../shared/middleware/auth';
import { validateBody } from '../../../shared/middleware/validation';
import prisma from '../../../config/database';
import { env } from '../../../config/env';
import { AppError } from '../../../shared/middleware/error-handler';

export const saleRoutes = Router();

const saleItemSchema = {
  productId: String,
  quantity: Number,
  unitPrice: Number,
  discount: { type: Number, default: 0 },
};

const createSaleSchema = {
  safeParse: (body: any) => {
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return { success: false, error: { fieldErrors: { items: 'At least one item is required' } } };
    }
    if (!body.amountPaid || body.amountPaid <= 0) {
      return { success: false, error: { fieldErrors: { amountPaid: 'amountPaid is required and must be > 0' } } };
    }
    return { success: true, data: body };
  },
};

function formatFolio(number: number, prefix: string = 'V'): string {
  return `${prefix}-${String(number).padStart(6, '0')}`;
}

saleRoutes.post('/', authenticate, validateBody(createSaleSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, amountPaid, discount = 0, paymentMethod = 'EFECTIVO', cashRegisterId } = req.body;
    const userId = (req as any).userId;

    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      const settings = await tx.businessSettings.findUnique({ where: { id: 'default' } }) ??
        await tx.businessSettings.create({ data: {} });
      const prefix = settings.folioPrefix || 'V';

      const lastSale = await tx.sale.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { folio: true },
      });

      let nextNumber = 1;
      if (lastSale?.folio) {
        const match = lastSale.folio.match(/(\d+)/);
        if (match) nextNumber = parseInt(match[1], 10) + 1;
      }

      const folio = formatFolio(nextNumber, prefix);

      const productIds = items.map((item: any) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) throw new AppError(404, `Producto ${item.productId} no encontrado`);
        if (product.stock < item.quantity) {
          throw new AppError(400, `Stock insuficiente para ${product.name}`);
        }
      }

      const subtotal = items.reduce((sum: number, item: any) => {
        return sum + (item.unitPrice * item.quantity) - (item.discount || 0);
      }, 0);

      const total = subtotal - discount;
      const change = paymentMethod === 'EFECTIVO' ? amountPaid - total : 0;

      if (paymentMethod === 'EFECTIVO' && amountPaid < total) {
        throw new AppError(400, 'El monto en efectivo debe ser mayor o igual al total');
      }

      const sale = await tx.sale.create({
        data: {
          folio,
          userId,
          subtotal,
          discount,
          total,
          amountPaid,
          change,
          paymentMethod,
          status: SaleStatus.COMPLETED,
          cashRegisterId: cashRegisterId || null,
        },
      });

      await tx.saleItem.createMany({
        data: items.map((item: any) => ({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          subtotal: (item.unitPrice * item.quantity) - (item.discount || 0),
        })),
      });

      for (const item of items) {
        const product = productMap.get(item.productId);
        const newStock = product.stock - item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });
        await tx.inventoryMove.create({
          data: {
            productId: item.productId,
            type: MoveType.VENTA,
            quantity: item.quantity,
            reference: folio,
            referenceId: sale.id,
            notes: `Venta ${folio}`,
            stockBefore: product.stock,
            stockAfter: newStock,
            userId,
          },
        });
      }

      const payment = await tx.payment.create({
        data: {
          saleId: sale.id,
          amount: total,
          method: paymentMethod,
          change,
        },
      });

      if (cashRegisterId) {
        await tx.cashRegister.update({
          where: { id: cashRegisterId },
          data: {
            expectedCash: { increment: total },
            salesCount: { increment: 1 },
          },
        });
      }

      return { sale, payment, folio, change: Number(change), total: Number(total) };
    });

    res.status(201).json({
      message: 'Venta registrada',
      data: {
        id: result.sale.id,
        folio: result.folio,
        total: result.total,
        change: result.change,
        paymentMethod: result.payment?.method,
        items,
      },
    });
  } catch (err: any) {
    if (err.message.includes('Insufficient stock') || err.message.includes('stock')) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

saleRoutes.post('/:id/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).userId;

    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { saleItems: true, cashRegisterId: true as any },
      });

      if (!sale) throw new AppError(404, 'Venta no encontrada');
      if (sale.status === SaleStatus.CANCELLED) throw new AppError(400, 'La venta ya fue cancelada');

      for (const item of sale.saleItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const newStock = product.stock + item.quantity;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          });
          await tx.inventoryMove.create({
            data: {
              productId: item.productId,
              type: MoveType.DEVOLUCION_COMPRA,
              quantity: item.quantity,
              reference: sale.folio,
              referenceId: sale.id,
              notes: `Reintegro por cancelacion de venta ${sale.folio}`,
              stockBefore: product.stock,
              stockAfter: newStock,
              userId,
            },
          });
        }
      }

      await tx.sale.update({
        where: { id },
        data: {
          status: SaleStatus.CANCELLED,
          cancelReason: reason || 'Sin motivo',
          cancelledBy: userId,
          cancelledAt: new Date(),
        },
      });

      await tx.payment.deleteMany({ where: { saleId: id } });

      if (sale.cashRegisterId) {
        await tx.cashRegister.update({
          where: { id: sale.cashRegisterId },
          data: {
            expectedCash: { decrement: sale.total },
            salesCount: { decrement: 1 },
          },
        });
      }

      return { message: 'Venta cancelada y stock reintegrado' };
    });

    res.json(result);
  } catch (err: any) {
    next(err);
  }
});

saleRoutes.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) {
      where.OR = [
        { folio: { contains: String(search), mode: 'insensitive' } },
        { user: { name: { contains: String(search), mode: 'insensitive' } } },
      ];
    }
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: { saleItems: { include: { product: true } }, payment: true, user: { select: { id: true, name: true, username: true } } },
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.sale.count({ where }),
    ]);
    res.json({
      data: sales,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err: any) {
    next(err);
  }
});

saleRoutes.get('/summary', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todaySales, monthSales] = await Promise.all([
      prisma.sale.aggregate({
        where: { date: { gte: today }, status: SaleStatus.COMPLETED },
        _count: true,
        _sum: { total: true },
      }),
      prisma.sale.aggregate({
        where: { date: { gte: monthStart }, status: SaleStatus.COMPLETED },
        _count: true,
        _sum: { total: true },
      }),
    ]);

    res.json({
      data: {
        todaySales: todaySales._count || 0,
        todayTransactions: todaySales._count || 0,
        totalRevenue: Number(monthSales._sum?.total || 0),
        totalProducts: await prisma.product.count(),
        lowStockProducts: await prisma.product.count({ where: { stock: { lte: 5 } } }),
      },
    });
  } catch (err: any) {
    next(err);
  }
});

saleRoutes.get('/today', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: {
        userId,
        date: { gte: today },
      },
      include: { saleItems: { include: { product: true } }, payment: true },
      orderBy: { date: 'desc' },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);

    res.json({
      data: sales,
      summary: { totalSales, totalRevenue, today: today.toISOString() },
    });
  } catch (err: any) {
    next(err);
  }
});

saleRoutes.get('/user', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 20 } = req.query;

    const sales = await prisma.sale.findMany({
      where: { userId },
      include: { saleItems: { include: { product: true } }, payment: true },
      orderBy: { date: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.sale.count({ where: { userId } });

    res.json({
      data: sales,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err: any) {
    next(err);
  }
});

saleRoutes.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { saleItems: { include: { product: true } }, payment: true, user: { select: { id: true, name: true, username: true } } },
    });

    if (!sale) { res.status(404).json({ error: 'Venta no encontrada' }); return; }
    res.json(sale);
  } catch (err: any) {
    next(err);
  }
});

saleRoutes.get('/:folio', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { folio } = req.params;
    const sale = await prisma.sale.findFirst({
      where: { folio },
      include: { saleItems: { include: { product: true } }, payment: true, user: { select: { id: true, name: true, username: true } } },
    });

    if (!sale) { res.status(404).json({ error: 'Venta no encontrada con folio: ' + folio }); return; }
    res.json(sale);
  } catch (err: any) {
    next(err);
  }
});
