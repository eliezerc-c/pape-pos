import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../shared/middleware/auth';
import { validateBody } from '../../../shared/middleware/validation';
import prisma from '../../../config/database';
import { AppError } from '../../../shared/middleware/error-handler';

export const settingsRoutes = Router();

const businessSettingsSchema = {
  safeParse: (body: any) => {
    if (!body.businessName) return { success: false, error: { fieldErrors: { businessName: 'businessName es requerido' } } };
    return { success: true, data: body };
  },
};

const updateSettingsSchema = {
  safeParse: (body: any) => {
    return { success: true, data: body };
  },
};

settingsRoutes.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      const created = await prisma.businessSettings.create({ data: {} });
      res.json(created);
      return;
    }

    res.json(settings);
  } catch (err: any) { next(err); }
});

settingsRoutes.put('/', authenticate, validateBody(updateSettingsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessName, address, phone, logo, currency, taxRate, folioPrefix, ticketFormat, defaultStockMin, allowNegativeStock } = req.body;

    let settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: {
          businessName: businessName || 'Papeleria',
          address,
          phone,
          logo,
          currency: currency || 'PEN',
          taxRate: taxRate || 18,
          folioPrefix: folioPrefix || 'V',
          ticketFormat: ticketFormat || 'STANDARD',
          defaultStockMin: defaultStockMin || 1,
          allowNegativeStock: allowNegativeStock || false,
        },
      });
    } else {
      settings = await prisma.businessSettings.update({
        where: { id: 'default' },
        data: {
          businessName: businessName ?? settings.businessName,
          address: address ?? settings.address,
          phone: phone ?? settings.phone,
          logo: logo ?? settings.logo,
          currency: currency ?? settings.currency,
          taxRate: taxRate ?? settings.taxRate,
          folioPrefix: folioPrefix ?? settings.folioPrefix,
          ticketFormat: ticketFormat ?? settings.ticketFormat,
          defaultStockMin: defaultStockMin ?? settings.defaultStockMin,
          allowNegativeStock: allowNegativeStock ?? settings.allowNegativeStock,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: (req as any).userId,
        action: 'SETTINGS_UPDATE',
        entity: 'BusinessSettings',
        entityId: settings.id,
        details: req.body,
      },
    });

    res.json({ message: 'Configuracion actualizada', data: settings });
  } catch (err: any) { next(err); }
});

settingsRoutes.get('/users', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      include: { role: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.user.count({ where });

    res.json({
      data: users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err: any) { next(err); }
});

settingsRoutes.get('/roles', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({
      include: { users: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(roles);
  } catch (err: any) { next(err); }
});
