import { Router } from 'express';
import { verifyPassword, generateToken } from '../../shared/services/auth';
import { prisma } from '../../config/database';
import { authenticate } from '../../shared/middleware/auth';

export const authRoutes = Router();

const loginSchema = {
  safeParse: (body: any) => {
    if (!body.username || !body.password) return { success: false, error: { fieldErrors: {} } };
    return { success: true, data: body };
  }
};

authRoutes.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contrasena requeridos' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { username }, include: { role: true } });
    if (!user) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }
    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Usuario inactivo' });
      return;
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    const token = generateToken(user.id, user.roleId);
    res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: { id: user.roleId, name: user.role.name } } });
  } catch (err: any) {
    res.status(500).json({ error: 'Error en el login' });
  }
});

authRoutes.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId },
      include: { role: true }
    });
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    res.json({ user: { id: user.id, name: user.name, username: user.username, role: user.role } });
  } catch { res.status(500).json({ error: 'Error al obtener usuario' }); }
});
