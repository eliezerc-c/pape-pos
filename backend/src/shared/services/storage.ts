import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';

export function ensureStorageDir(): void {
  const dirs = [env.storagePath, path.join(env.storagePath, 'temp')];
  dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
}

export function generateUniqueName(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const unique = `${base}-${Date.now()}-${Math.random().toString(36).substr(2, 8)}${ext}`;
  return unique;
}

export function validateImageFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedMimes.includes(file.mimetype)) {
    return { valid: false, error: 'Formato no permitido. Usa JPG, JPEG, PNG o WEBP' };
  }
  if (file.size > maxSize) {
    return { valid: false, error: 'Imagen demasiado grande. Maximo 5MB' };
  }
  return { valid: true };
}

export function getImagePath(fileName: string): string {
  return path.join(env.storagePath, fileName);
}
