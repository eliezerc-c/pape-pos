import { contextBridge, ipcRenderer } from 'electron';

interface AppAPI {
  getStatus: () => Promise<{ status: string; timestamp: string }>;
  backup: () => Promise<{ success: boolean; message: string; path: string }>;
  restore: (filePath: string) => Promise<{ success: boolean; message: string }>;
  getTheme: () => Promise<'dark' | 'light'>;
  setTheme: (useDark: boolean) => Promise<'dark' | 'light'>;
  openFile: () => Promise<string | null>;
  getVersion: () => Promise<string>;
  getUserPath: (name: string) => Promise<string>;
  onShowAbout: (callback: () => void) => void;
}

const api: AppAPI = {
  getStatus: () => ipcRenderer.invoke('app:status'),
  backup: () => ipcRenderer.invoke('app:backup'),
  restore: (filePath: string) => ipcRenderer.invoke('app:restore', filePath),
  getTheme: () => ipcRenderer.invoke('app:getTheme'),
  setTheme: (useDark: boolean) => ipcRenderer.invoke('app:setTheme', useDark),
  openFile: () => ipcRenderer.invoke('app:openFile'),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getUserPath: (name: string) => ipcRenderer.invoke('app:getUserPath', name),
  onShowAbout: (callback: () => void) => {
    ipcRenderer.on('show-about', callback);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type { AppAPI };
