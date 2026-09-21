import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string, roleId: string): string {
  return jwt.sign({ id: userId, roleId }, env.jwtSecret, { expiresIn: '24h' });
}

export function hashSync(password: string): string {
  return bcrypt.hashSync(password, 12);
}
