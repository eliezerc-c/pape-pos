import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../../config/database';
import { authenticate, AuthRequest } from '../../../shared/middleware/auth';
import { validateBody } from '../../../shared/middleware/validation';
import { hashPassword, generateToken } from '../../../shared/services/auth';
import { env } from '../../../config/env';
import { z } from 'zod';
import bcrypt from 'bcrypt';

export const userRoutes = Router();

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  username: z.string().min(3).max(50),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).max(100),
  roleId: z.string().min(1),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  roleId: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
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
      data: {
        userId: userId || null,
        action,
        entity,
        entityId,
        ip,
        details: details || {},
      },
    });
  } catch {
    // Silently fail if audit log creation fails
  }
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.userId) { res.status(401).json({ error: 'No autorizado' }); return; }
  prisma.user.findUnique({
    where: { id: req.userId },
    include: { role: true },
  }).then(user => {
    if (!user || user.role.name !== 'ADMIN') {
      res.status(403).json({ error: 'Se requiere rol de administrador' });
      return;
    }
    next();
  }).catch(() => {
    res.status(500).json({ error: 'Error al verificar permisos' });
  });
}

userRoutes.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contrasena requeridos' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    const token = generateToken(user.id, user.roleId);
    respond(res, {
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
    }, 'Login exitoso');
  } catch (err: any) {
    res.status(500).json({ error: 'Error en el login' });
  }
});

userRoutes.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { role: true },
    });
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    respond(res, {
      id: user.id, name: user.name, username: user.username,
      email: user.email, status: user.status, role: user.role,
      lastLogin: user.lastLogin, createdAt: user.createdAt,
    }, 'Usuario obtenido');
  } catch { res.status(500).json({ error: 'Error al obtener usuario' }); }
});

userRoutes.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    respond(res, { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Usuarios obtenidos');
  } catch { res.status(500).json({ error: 'Error al obtener usuarios' }); }
});

userRoutes.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { role: true },
    });
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    respond(res, {
      id: user.id, name: user.name, username: user.username,
      email: user.email, status: user.status, role: user.role,
      lastLogin: user.lastLogin, createdAt: user.createdAt,
    }, 'Usuario obtenido');
  } catch { res.status(500).json({ error: 'Error al obtener usuario' }); }
});

userRoutes.post('/', authenticate, requireAdmin, validateBody(createUserSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, username, email, password, roleId } = req.body;
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: { not: null, equals: email || '' } }] },
    });
    if (existingUser) {
      res.status(409).json({ error: 'El usuario o email ya existe' });
      return;
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, username, email: email || null, passwordHash, roleId, status: 'ACTIVE' },
      include: { role: true },
    });
    await createAuditLog(req.userId, 'CREATE_USER', 'User', user.id, { username, roleId }, getClientIp(req));
    respond(res, { id: user.id, name: user.name, username: user.username, email: user.email, status: user.status, role: user.role }, 'Usuario creado');
  } catch (err: any) {
    if (err.message?.includes('Unique constraint')) {
      res.status(409).json({ error: 'Usuario o email ya existe' }); return;
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

userRoutes.put('/:id', authenticate, requireAdmin, validateBody(updateUserSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, username, email, status, roleId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email || null;
    if (status !== undefined) updateData.status = status;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (username) {
      const existing = await prisma.user.findFirst({
        where: { username, NOT: { id: req.params.id } },
      });
      if (existing) { res.status(409).json({ error: 'El username ya existe' }); return; }
    }
    const updated = await prisma.user.update({
      where: { id: req.params.id }, data: updateData, include: { role: true },
    });
    await createAuditLog(req.userId, 'UPDATE_USER', 'User', updated.id, { changes: updateData }, getClientIp(req));
    respond(res, { id: updated.id, name: updated.name, username: updated.username, email: updated.email, status: updated.status, role: updated.role }, 'Usuario actualizado');
  } catch (err: any) {
    if (err.message?.includes('Unique constraint')) {
      res.status(409).json({ error: 'El username ya existe' }); return;
    }
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

userRoutes.put('/:id/password', authenticate, validateBody(changePasswordSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) { res.status(400).json({ error: 'Contrasena actual incorrecta' }); return; }
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash: newHash } });
    await createAuditLog(req.userId, 'CHANGE_PASSWORD', 'User', user.id, {}, getClientIp(req));
    respond(res, null, 'Contrasena actualizada');
  } catch { res.status(500).json({ error: 'Error al cambiar contrasena' }); }
});

userRoutes.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    if (user.status === 'SUSPENDED') {
      await prisma.user.delete({ where: { id: req.params.id } });
      await createAuditLog(req.userId, 'DELETE_USER', 'User', user.id, {}, getClientIp(req));
      respond(res, null, 'Usuario eliminado');
    } else {
      await prisma.user.update({ where: { id: req.params.id }, data: { status: 'SUSPENDED' } });
      await createAuditLog(req.userId, 'SUSPEND_USER', 'User', user.id, {}, getClientIp(req));
      respond(res, null, 'Usuario suspendido');
    }
  } catch { res.status(500).json({ error: 'Error al eliminar usuario' }); }
});

userRoutes.put('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ error: 'Estado invalido' }); return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id }, data: { status }, include: { role: true },
    });
    await createAuditLog(req.userId, 'UPDATE_USER_STATUS', 'User', user.id, { status }, getClientIp(req));
    respond(res, { id: user.id, status: user.status }, 'Estado actualizado');
  } catch { res.status(500).json({ error: 'Error al actualizar estado' }); }
});
