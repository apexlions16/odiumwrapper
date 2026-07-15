import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('odiumDesktop', {
  getVersion: () => ipcRenderer.invoke('app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-update'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  onUpdateStatus: (listener: (payload: unknown) => void) => {
    const handler = (_event: unknown, payload: unknown) => listener(payload);
    ipcRenderer.on('update-status', handler);
    return () => ipcRenderer.removeListener('update-status', handler);
  }
});
