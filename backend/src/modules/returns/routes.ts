import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, ReturnStatus, MoveType } from '@prisma/client';
import { authenticate } from '../../shared/middleware/auth';
import { validateBody } from '../../shared/middleware/validation';
import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error-handler';

export const returnRoutes = Router();

const createReturnSchema = {
  safeParse: (body: any) => {
    if (!body.saleId) return { success: false, error: { fieldErrors: { saleId: 'saleId es requerido' } } };
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return { success: false, error: { fieldErrors: { items: 'Se requiere al menos un item' } } };
    }
    if (!body.reason) return { success: false, error: { fieldErrors: { reason: 'reason es requerido' } } };
    return { success: true, data: body };
  },
};

returnRoutes.post('/', authenticate, validateBody(createReturnSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { saleId, items, reason } = req.body;
    const userId = (req as any).userId;

    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { saleItems: true },
      });

      if (!sale) throw new AppError(404, 'Venta no encontrada');
      if (sale.status === 'CANCELLED') throw new AppError(400, 'No se puede devolver una venta cancelada');

      let totalReturn = 0;
      const returnItemsData = [];

      for (const item of items) {
        const saleItem = sale.saleItems.find((si) => si.productId === item.productId);
        if (!saleItem) throw new AppError(400, `Producto ${item.productId} no encontrado en la venta`);
        if (item.quantity > saleItem.quantity) throw new AppError(400, 'Cantidad a devolver excede la cantidad vendida');

        const returnSubtotal = item.unitPrice * item.quantity;
        totalReturn += returnSubtotal;

        returnItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          reason: item.reason || reason,
        });

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
              reference: `DEV-${sale.folio}`,
              referenceId: sale.id,
              notes: `Devolucion de venta ${sale.folio}`,
              stockBefore: product.stock,
              stockAfter: newStock,
              userId,
            },
          });
        }
      }

      const ret = await tx.return.create({
        data: {
          saleId,
          userId,
          reason,
          total: totalReturn,
          status: ReturnStatus.APPROVED,
          returnItems: { create: returnItemsData },
        },
      });

      return { ...ret, totalReturn };
    });

    res.status(201).json({ message: 'Devolucion registrada', data: result });
  } catch (err: any) {
    next(err);
  }
});

returnRoutes.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, saleId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (saleId) where.saleId = saleId;

    const returns = await prisma.return.findMany({
      where,
      include: { sale: { select: { id: true, folio: true, date: true } }, user: { select: { id: true, name: true, username: true } }, returnItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.return.count({ where });

    res.json({
      data: returns,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err: any) {
    next(err);
  }
});
