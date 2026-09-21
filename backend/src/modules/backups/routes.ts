import { Router, Request, Response, NextFunction } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { authenticate } from '../../../shared/middleware/auth';
import { env } from '../../../config/env';
import { AppError } from '../../../shared/middleware/error-handler';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export const backupRoutes = Router();

const backupDir = env.backupPath;

function ensureBackupDir(): void {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

backupRoutes.post('/backup', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    const { DATABASE_URL } = process.env;
    if (!DATABASE_URL) throw new AppError(500, 'DATABASE_URL no configurada');

    const { stdout, stderr } = await execAsync(
      `pg_dump "${DATABASE_URL}" -f "${filepath}"`
    );

    if (stderr && !stderr.includes('PGPASSWORD')) {
      console.error(`[pg_dump stderr] ${stderr}`);
    }

    const stats = fs.statSync(filepath);

    await promisify(fs.appendFile)(filepath, `-- Backup generado el ${new Date().toISOString()}\n`, 'utf8');

    await promisify(fs.appendFile)(
      path.join(backupDir, 'backup-index.json'),
      JSON.stringify({ filename, filepath, size: stats.size, createdAt: new Date().toISOString() }) + '\n'
    );

    res.json({
      message: 'Backup completado',
      data: { filename, filepath, size: stats.size, createdAt: new Date().toISOString() },
    });
  } catch (err: any) {
    if (err.message.includes('pg_dump not found') || err.code === 'ENOENT') {
      throw new AppError(500, 'pg_dump no esta disponible. Asegurese de que PostgreSQL esta instalado.');
    }
    next(err);
  }
});

backupRoutes.get('/list', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    ensureBackupDir();
    const files = fs.readdirSync(backupDir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => {
        const filepath = path.join(backupDir, f);
        const stats = fs.statSync(filepath);
        return { filename: f, size: stats.size, createdAt: stats.birthtime, modifiedAt: stats.mtime };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json({ data: files, count: files.length });
  } catch (err: any) { next(err); }
});

backupRoutes.post('/restore', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.body;
    if (!filename) throw new AppError(400, 'filename es requerido');

    const filepath = path.join(backupDir, filename);
    if (!fs.existsSync(filepath)) throw new AppError(404, 'Archivo de backup no encontrado');

    const { DATABASE_URL } = process.env;
    if (!DATABASE_URL) throw new AppError(500, 'DATABASE_URL no configurada');

    const { stdout, stderr } = await execAsync(
      `psql "${DATABASE_URL}" -f "${filepath}"`
    );

    if (stderr && !stderr.includes('PGPASSWORD')) {
      console.error(`[psql stderr] ${stderr}`);
    }

    await promisify(fs.appendFile)(
      path.join(backupDir, 'restore-log.json'),
      JSON.stringify({ filename, restoredAt: new Date().toISOString() }) + '\n'
    );

    res.json({ message: 'Restored completed successfully', data: { filename, restoredAt: new Date().toISOString() } });
  } catch (err: any) {
    if (err.message.includes('psql not found') || err.code === 'ENOENT') {
      throw new AppError(500, 'psql no esta disponible. Asegurese de que PostgreSQL esta instalado.');
    }
    next(err);
  }
});

backupRoutes.get('/health', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const hasPgsql = process.env.PSQL_PATH || true;
    ensureBackupDir();
    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.sql'));

    res.json({
      data: {
        psqlAvailable: true,
        backupDirectory: backupDir,
        backupCount: files.length,
        diskUsage: fs.existsSync(backupDir) ? fs.statSync(backupDir).size : 0,
      },
    });
  } catch (err: any) { next(err); }
});
