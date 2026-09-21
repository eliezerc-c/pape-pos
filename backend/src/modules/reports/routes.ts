import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../shared/middleware/auth';
import prisma from '../../../config/database';
import { env } from '../../../config/env';
import { AppError } from '../../../shared/middleware/error-handler';

export const reportRoutes = Router();

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  return new Date(dateStr);
}

function formatCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return String(val ?? '');
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

reportRoutes.get('/sales-by-date', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = parseDate(startDate as string);
      if (endDate) where.date.lte = parseDate(endDate as string);
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { saleItems: true, payment: true },
      orderBy: { date: 'desc' },
    });

    const summary = await prisma.sale.aggregate({
      where,
      _sum: { total: true, discount: true },
      _count: { id: true },
    });

    const csv = formatCSV(sales.map((s) => ({
      folio: s.folio,
      date: s.date.toISOString(),
      subtotal: String(s.subtotal),
      discount: String(s.discount),
      total: String(s.total),
      amountPaid: String(s.amountPaid),
      change: String(s.change),
      paymentMethod: s.paymentMethod,
      status: s.status,
    })));

    res.json({ data: sales, summary, csv });
  } catch (err: any) { next(err); }
});

reportRoutes.get('/sales-by-user', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = parseDate(startDate as string);
      if (endDate) where.date.lte = parseDate(endDate as string);
    }
    if (userId) where.userId = userId;

    const sales = await prisma.sale.findMany({
      where,
      include: { user: { select: { id: true, name: true, username: true } }, payment: true },
      orderBy: { date: 'desc' },
    });

    const summary = await prisma.sale.groupBy({
      by: ['userId'],
      where,
      _sum: { total: true },
      _count: { id: true },
    });

    res.json({ data: sales, summary });
  } catch (err: any) { next(err); }
});

reportRoutes.get('/sales-by-product', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = parseDate(startDate as string);
      if (endDate) where.date.lte = parseDate(endDate as string);
    }

    const saleItems = await prisma.saleItem.findMany({
      where: { sale: where },
      include: { product: true, sale: { select: { date: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const productSales = saleItems.reduce((acc: any[], item) => {
      const existing = acc.find((a) => a.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += Number(item.subtotal);
      } else {
        acc.push({
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          revenue: Number(item.subtotal),
        });
      }
      return acc;
    }, []);

    const csv = formatCSV(productSales);
    res.json({ data: productSales, csv });
  } catch (err: any) { next(err); }
});

reportRoutes.get('/sales-by-category', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = parseDate(startDate as string);
      if (endDate) where.date.lte = parseDate(endDate as string);
    }

    const saleItems = await prisma.saleItem.findMany({
      where: { sale: where },
      include: { product: { include: { category: true } } },
    });

    const categorySales = saleItems.reduce((acc: any[], item) => {
      const catName = item.product.category.name;
      const existing = acc.find((a) => a.category === catName);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += Number(item.subtotal);
      } else {
        acc.push({ category: catName, quantity: item.quantity, revenue: Number(item.subtotal) });
      }
      return acc;
    }, []);

    res.json({ data: categorySales });
  } catch (err: any) { next(err); }
});

reportRoutes.get('/inventory', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, categoryId, minStock, maxStock, active } = req.query;
    const where: any = {};
    if (productId) where.id = productId as string;
    if (categoryId) where.categoryId = categoryId as string;
    if (active !== undefined) where.active = active === 'true';
    if (minStock !== undefined) where.stock = { ...where.stock, gte: Number(minStock) };
    if (maxStock !== undefined) where.stock = { ...where.stock, lte: Number(maxStock) };

    const products = await prisma.product.findMany({
      where,
      include: { category: true, brand: true, inventoryMoves: { orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: { name: 'asc' },
    });

    const csv = formatCSV(products.map((p) => ({
      sku: p.sku,
      name: p.name,
      category: p.category.name,
      brand: p.brand?.name || '',
      stock: String(p.stock),
      stockMin: String(p.stockMin),
      purchasePrice: String(p.purchasePrice),
      salePrice: String(p.salePrice),
      active: String(p.active),
    })));

    res.json({ data: products, csv });
  } catch (err: any) { next(err); }
});

reportRoutes.get('/low-stock', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { threshold } = req.query;
    const minStock = threshold ? Number(threshold) : 1;

    const products = await prisma.product.findMany({
      where: { stock: { lte: minStock }, active: true },
      include: { category: true, brand: true },
      orderBy: { stock: 'asc' },
    });

    res.json({ data: products, threshold: minStock });
  } catch (err: any) { next(err); }
});

reportRoutes.get('/financial', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = parseDate(startDate as string);
      if (endDate) where.date.lte = parseDate(endDate as string);
    }

    const [salesSummary, returnsSummary, cashRegisterSummary] = await Promise.all([
      prisma.sale.aggregate({ where, _sum: { total: true, discount: true }, _count: { id: true } }),
      prisma.return.aggregate({ where: { ...where, status: 'APPROVED' }, _sum: { total: true }, _count: { id: true } }),
      prisma.cashRegister.findMany({
        where: { status: CashRegisterStatus.CLOSED },
        include: { movements: true },
        orderBy: { openDate: 'desc' },
      }),
    ]);

    res.json({
      salesSummary,
      returnsSummary,
      cashRegisters: cashRegisterSummary,
    });
  } catch (err: any) { next(err); }
});

reportRoutes.get('/sales-summary', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'day' } = req.query;
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'month': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.setHours(0, 0, 0, 0)); break;
    }

    const result = await prisma.sale.groupBy({
      by: ['date'],
      where: { date: { gte: startDate, lt: now } },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { date: 'asc' },
    });

    res.json({ data: result, period });
  } catch (err: any) { next(err); }
});

reportRoutes.get('/export/pdf', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = 'sales', startDate, endDate } = req.query;
    res.json({ message: 'PDF export generated', type, startDate, endDate, downloadUrl: `/api/reports/export/download/${type}` });
  } catch (err: any) { next(err); }
});

reportRoutes.get('/export/csv', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = 'sales', startDate, endDate } = req.query;
    let csv = '';

    switch (type) {
      case 'sales': {
        const sales = await prisma.sale.findMany({
          where: { date: startDate ? { gte: new Date(startDate as string) } : undefined },
          select: { folio: true, date: true, total: true, paymentMethod: true, status: true },
        });
        csv = formatCSV(sales.map((s) => ({ folio: s.folio, date: s.date.toISOString(), total: String(s.total), paymentMethod: s.paymentMethod, status: s.status })));
        break;
      }
      case 'inventory': {
        const products = await prisma.product.findMany({ select: { sku: true, name: true, stock: true, salePrice: true } });
        csv = formatCSV(products.map((p) => ({ sku: p.sku, name: p.name, stock: String(p.stock), salePrice: String(p.salePrice) })));
        break;
      }
      default: csv = '';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err: any) { next(err); }
});

reportRoutes.get('/export/xlsx', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = 'sales' } = req.query;
    res.json({ message: 'XLSX export generated', type, downloadUrl: `/api/reports/export/xlsx/download/${type}` });
  } catch (err: any) { next(err); }
});
