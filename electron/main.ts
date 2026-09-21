import { join } from 'path';
import { existsSync } from 'fs';
import { app, BrowserWindow, ipcMain, Menu, Tray, nativeTheme } from 'electron';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = process.env.NODE_ENV !== 'production';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

interface ServerStatus {
  status: string;
  timestamp: string;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'Papeleria POS',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
    icon: join(__dirname, 'assets', 'icon.png'),
    show: false,
  });

  const appUrl = isDev ? backendUrl : `file://${join(__dirname, 'frontend', 'index.html')}`;
  mainWindow.loadURL(appUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Archivo',
      submenu: [
        { role: 'quit', label: 'Salir' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar Todo' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar Recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de Desarrollador' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Restablecer Zoom' },
        { role: 'zoomIn', label: 'Ampliar' },
        { role: 'zoomOut', label: 'Reducir' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla Completa' },
      ],
    },
    {
      label: 'Ventana',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'close', label: 'Cerrar' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Acerca de',
          click: () => {
            mainWindow?.webContents.send('show-about');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function checkBackendStatus(): Promise<ServerStatus> {
  try {
    const response = await fetch(`${backendUrl}/health`);
    const data = await response.json();
    return { status: 'online', timestamp: data.timestamp };
  } catch {
    return { status: 'offline', timestamp: new Date().toISOString() };
  }
}

async function performBackup(): Promise<{ success: boolean; message: string; path: string }> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const backupPath = join(app.getPath('userData'), 'backups');
  const backupFile = join(backupPath, `backup-${new Date().toISOString().slice(0, 10)}.sql`);

  const execAsync = promisify(exec);

  try {
    if (!existsSync(backupPath)) {
      await import('fs').then(fs => fs.mkdirSync(backupPath, { recursive: true }));
    }

    const backupCommand = `pg_dump -U postgres -h localhost -d pape_pos -f "${backupFile}"`;
    await execAsync(backupCommand);

    return { success: true, message: 'Backup completado exitosamente', path: backupFile };
  } catch (err: any) {
    return { success: false, message: `Error en backup: ${err.message}`, path: '' };
  }
}

async function performRestore(filePath: string): Promise<{ success: boolean; message: string }> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const restoreCommand = `psql -U postgres -h localhost -d pape_pos -f "${filePath}"`;
    await execAsync(restoreCommand);

    return { success: true, message: 'Restauracion completada exitosamente' };
  } catch (err: any) {
    return { success: false, message: `Error en restauracion: ${err.message}` };
  }
}

function setupIpcHandlers(): void {
  ipcMain.handle('app:status', async () => {
    const status = await checkBackendStatus();
    return status;
  });

  ipcMain.handle('app:backup', async () => {
    return await performBackup();
  });

  ipcMain.handle('app:restore', async (_event, filePath: string) => {
    return await performRestore(filePath);
  });

  ipcMain.handle('app:getTheme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.handle('app:setTheme', (_event, useDark: boolean) => {
    nativeTheme.themeSource = useDark ? 'dark' : 'light';
    return nativeTheme.shouldUseDarkColors;
  });

  ipcMain.handle('app:openFile', async () => {
    const { dialog } = await import('electron');
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [{ name: 'SQL Files', extensions: ['sql'] }],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('app:getVersion', () => app.getVersion());

  ipcMain.handle('app:getUserPath', (event, name: string) => app.getPath(name));
}

function setupTray(): void {
  try {
    const iconPath = join(__dirname, 'assets', 'icon.png');
    if (existsSync(iconPath)) {
      tray = new Tray(iconPath);
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Mostrar', click: () => mainWindow?.show() },
        { label: 'Ocultar', click: () => mainWindow?.hide() },
        { type: 'separator' },
        { label: 'Salir', click: () => { app.isQuiting = true; app.quit(); } },
      ]);
      tray.setToolTip('Papeleria POS');
      tray.setContextMenu(contextMenu);
      tray.on('click', () => { mainWindow?.show(); });
    }
  } catch {
    // Tray is optional, fail silently
  }
}

app.whenReady().then(() => {
  createWindow();
  createMenu();
  setupIpcHandlers();
  setupTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.isQuiting = true;
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
});

process.on('uncaughtException', (error) => {
  console.error('[Electron] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Electron] Unhandled Rejection:', reason);
});
