import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;

autoUpdater.logger = log;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function sendUpdate(payload: unknown) {
  mainWindow?.webContents.send('update-status', payload);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#111018',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  if (app.isPackaged) setTimeout(() => autoUpdater.checkForUpdates().catch(log.error), 4000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('app-version', () => app.getVersion());
ipcMain.handle('check-update', async () => {
  if (!app.isPackaged) return { state: 'development', message: 'Geliştirme sürümünde güncelleme aranmaz.' };
  const result = await autoUpdater.checkForUpdates();
  return { state: 'checked', version: result?.updateInfo.version };
});
ipcMain.handle('download-update', () => autoUpdater.downloadUpdate());
ipcMain.handle('install-update', () => autoUpdater.quitAndInstall(false, true));
ipcMain.handle('open-external', (_event, url: string) => shell.openExternal(url));

autoUpdater.on('checking-for-update', () => sendUpdate({ state: 'checking' }));
autoUpdater.on('update-available', info => sendUpdate({ state: 'available', version: info.version }));
autoUpdater.on('update-not-available', info => sendUpdate({ state: 'current', version: info.version }));
autoUpdater.on('download-progress', progress => sendUpdate({ state: 'downloading', percent: progress.percent }));
autoUpdater.on('update-downloaded', info => sendUpdate({ state: 'downloaded', version: info.version }));
autoUpdater.on('error', error => sendUpdate({ state: 'error', message: error.message }));
