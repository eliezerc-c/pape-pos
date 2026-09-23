import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import prisma from '../../config/database';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';
import { validateBody } from '../../shared/middleware/validation';
import { ensureStorageDir, generateUniqueName, validateImageFile, getImagePath } from '../../shared/services/storage';
import { env } from '../../config/env';
import { z } from 'zod';

export const productRoutes = Router();

ensureStorageDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.storagePath),
  filename: (_req, file, cb) => cb(null, generateUniqueName(file.originalname)),
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const result = validateImageFile(file);
  if (!result.valid) cb(new Error(result.error || 'Invalid file'));
  else cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const createProductSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    categoryId: z.string().min(1),
    brandId: z.string().optional().or(z.literal('')),
    sku: z.string().max(50).optional(),
    barcode: z.string().optional(),
    unit: z.string().max(10).default('UNI'),
    purchasePrice: z.coerce.number().min(0).max(999999.99),
    salePrice: z.coerce.number().min(0).max(999999.99),
    wholesalePrice: z.coerce.number().min(0).max(999999.99).optional(),
    stock: z.coerce.number().int().min(0).default(0),
    stockMin: z.coerce.number().int().min(0).default(1),
    stockMax: z.coerce.number().int().optional(),
    location: z.string().optional(),
});

const updateProductSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    sku: z.string().min(1).max(50).optional(),
    barcode: z.string().optional(),
    unit: z.string().max(10).optional(),
    purchasePrice: z.coerce.number().min(0).max(999999.99).optional(),
    salePrice: z.coerce.number().min(0).max(999999.99).optional(),
    wholesalePrice: z.coerce.number().min(0).max(999999.99).optional(),
    stock: z.coerce.number().int().min(0).optional(),
    stockMin: z.coerce.number().int().min(0).optional(),
    stockMax: z.coerce.number().int().optional(),
    location: z.string().optional(),
    active: z.boolean().optional(),
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

productRoutes.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const categoryId = (req.query.categoryId as string) || '';
    const brandId = (req.query.brandId as string) || '';
    const active = req.query.active as string;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (active === 'true') where.active = true;
    if (active === 'false') where.active = false;
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: limit,
        include: { category: true, brand: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
    respond(res, { products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Productos obtenidos');
  } catch { res.status(500).json({ error: 'Error al obtener productos' }); }
});

productRoutes.get('/barcode/:barcode', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { barcode: req.params.barcode },
      include: { category: true, brand: true, images: true },
    });
    if (!product) { res.status(404).json({ error: 'Producto no encontrado con ese barcode' }); return; }
    respond(res, product, 'Producto encontrado por barcode');
  } catch { res.status(500).json({ error: 'Error al buscar producto' }); }
});

productRoutes.get('/low-stock', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true, stock: { lt: 1 } },
      include: { category: true, brand: true },
      orderBy: { stock: 'asc' },
    });
    respond(res, products, 'Productos con stock bajo');
  } catch { res.status(500).json({ error: 'Error al obtener productos con stock bajo' }); }
});

productRoutes.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, brand: true, images: true },
    });
    if (!product) { res.status(404).json({ error: 'Producto no encontrado' }); return; }
    respond(res, product, 'Producto obtenido');
  } catch { res.status(500).json({ error: 'Error al obtener producto' }); }
});

productRoutes.post('/', authenticate, requireAdmin, upload.single('image'), validateBody(createProductSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, categoryId, brandId, sku, barcode, unit, purchasePrice, salePrice, wholesalePrice, stock, stockMin, stockMax, location } = req.body;
    const existingSku = await prisma.product.findFirst({ where: { sku } });
    if (existingSku) { res.status(409).json({ error: 'SKU ya existe' }); return; }
    if (barcode) {
      const existingBarcode = await prisma.product.findFirst({ where: { barcode } });
      if (existingBarcode) { res.status(409).json({ error: 'Barcode ya existe' }); return; }
    }
    let imagePath: string | null = null;
    if (req.file) {
      const validation = validateImageFile(req.file as Express.Multer.File);
      if (!validation.valid) { res.status(400).json({ error: validation.error }); return; }
      imagePath = getImagePath((req.file as Express.Multer.File).filename);
    }
    const product = await prisma.product.create({
      data: {
        name, description, categoryId, brandId: brandId || null, sku,
        barcode: barcode || null, unit, purchasePrice, salePrice,
        wholesalePrice: wholesalePrice || null, stock: stock || 0,
        stockMin: stockMin || 1, stockMax, location, imagePrimary: imagePath,
      },
      include: { category: true, brand: true },
    });
    await createAuditLog(req.userId, 'CREATE_PRODUCT', 'Product', product.id, { sku, name }, getClientIp(req));
    respond(res, product, 'Producto creado');
  } catch (err: any) {
    if (err.message?.includes('Unique constraint')) { res.status(409).json({ error: 'SKU o barcode ya existe' }); return; }
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

productRoutes.put('/:id', authenticate, requireAdmin, upload.single('image'), validateBody(updateProductSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) { res.status(404).json({ error: 'Producto no encontrado' }); return; }
    const updateData: any = {};
    const fields = ['name', 'description', 'categoryId', 'brandId', 'sku', 'barcode', 'unit', 'purchasePrice', 'salePrice', 'wholesalePrice', 'stock', 'stockMin', 'stockMax', 'location', 'active'];
    for (const field of fields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }
    if (req.body.sku) {
      const existing = await prisma.product.findFirst({ where: { sku: req.body.sku, NOT: { id: req.params.id } } });
      if (existing) { res.status(409).json({ error: 'SKU ya existe' }); return; }
    }
    if (req.body.barcode) {
      const existing = await prisma.product.findFirst({ where: { barcode: req.body.barcode, NOT: { id: req.params.id } } });
      if (existing) { res.status(409).json({ error: 'Barcode ya existe' }); return; }
    }
    if (req.file) {
      const validation = validateImageFile(req.file as Express.Multer.File);
      if (!validation.valid) { res.status(400).json({ error: validation.error }); return; }
      updateData.imagePrimary = getImagePath((req.file as Express.Multer.File).filename);
    }
    const updated = await prisma.product.update({
      where: { id: req.params.id }, data: updateData, include: { category: true, brand: true, images: true },
    });
    await createAuditLog(req.userId, 'UPDATE_PRODUCT', 'Product', updated.id, { changes: updateData }, getClientIp(req));
    respond(res, updated, 'Producto actualizado');
  } catch (err: any) {
    if (err.message?.includes('Unique constraint')) { res.status(409).json({ error: 'SKU o barcode ya existe' }); return; }
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

productRoutes.post('/:id/images', authenticate, requireAdmin, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) { res.status(404).json({ error: 'Producto no encontrado' }); return; }
    if (!req.file) { res.status(400).json({ error: 'No se proporciono imagen' }); return; }
    const validation = validateImageFile(req.file as Express.Multer.File);
    if (!validation.valid) { res.status(400).json({ error: validation.error }); return; }
    const image = await prisma.productImage.create({
      data: {
        productId: req.params.id,
        fileName: (req.file as Express.Multer.File).originalname,
        filePath: getImagePath((req.file as Express.Multer.File).filename),
        fileSize: (req.file as Express.Multer.File).size,
        mimeType: (req.file as Express.Multer.File).mimetype,
        isPrimary: false, order: await prisma.productImage.count({ where: { productId: req.params.id } }),
      },
    });
    respond(res, image, 'Imagen agregada');
  } catch { res.status(500).json({ error: 'Error al agregar imagen' }); }
});

productRoutes.get('/:id/images', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const images = await prisma.productImage.findMany({
      where: { productId: req.params.id },
      orderBy: { order: 'asc' },
    });
    respond(res, images, 'Imagenes del producto');
  } catch { res.status(500).json({ error: 'Error al obtener imagenes' }); }
});

productRoutes.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) { res.status(404).json({ error: 'Producto no encontrado' }); return; }
    await prisma.productImage.deleteMany({ where: { productId: req.params.id } });
    await prisma.product.delete({ where: { id: req.params.id } });
    await createAuditLog(req.userId, 'DELETE_PRODUCT', 'Product', product.id, {}, getClientIp(req));
    respond(res, null, 'Producto eliminado');
  } catch { res.status(500).json({ error: 'Error al eliminar producto' }); }
});

productRoutes.put('/:id/toggle', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) { res.status(404).json({ error: 'Producto no encontrado' }); return; }
    const updated = await prisma.product.update({
      where: { id: req.params.id }, data: { active: !product.active }, include: { category: true, brand: true },
    });
    await createAuditLog(req.userId, 'TOGGLE_PRODUCT', 'Product', updated.id, { active: updated.active }, getClientIp(req));
    respond(res, updated, 'Estado del producto actualizado');
  } catch { res.status(500).json({ error: 'Error al actualizar estado del producto' }); }
});
