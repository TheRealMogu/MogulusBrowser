import { contextBridge, ipcRenderer } from 'electron'

type Unlisten = () => void

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Window controls ────────────────────────────────────────────────────
  platform: process.platform,
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close:    () => ipcRenderer.send('window:close'),
  onWindowState: (cb: (state: string) => void): Unlisten => {
    const h = (_: Electron.IpcRendererEvent, s: string) => cb(s)
    ipcRenderer.on('window:state', h)
    return () => ipcRenderer.removeListener('window:state', h)
  },
  getVersion: () => ipcRenderer.invoke('app:version'),

  // ── Privacy / tracker counting ─────────────────────────────────────────
  registerTabWebview: (tabId: string, webContentsId: number) =>
    ipcRenderer.send('tab:register-webview', { tabId, webContentsId }),

  unregisterTab: (tabId: string) =>
    ipcRenderer.send('tab:unregister', tabId),

  resetTrackerCount: (tabId: string) =>
    ipcRenderer.send('tab:reset-tracker-count', tabId),

  onTrackerBlocked: (cb: (tabId: string, count: number) => void): Unlisten => {
    const h = (_: Electron.IpcRendererEvent, payload: { tabId: string; count: number }) =>
      cb(payload.tabId, payload.count)
    ipcRenderer.on('tab:tracker-blocked', h)
    return () => ipcRenderer.removeListener('tab:tracker-blocked', h)
  },

  getSessionStats: (): Promise<{ totalBlockedSession: number }> =>
    ipcRenderer.invoke('privacy:session-stats'),

  // ── Session management ─────────────────────────────────────────────────
  setupWorkspaceSession: (partition: string): Promise<void> =>
    ipcRenderer.invoke('session:setup-workspace', partition),

  clearSession: (partition: string): Promise<void> =>
    ipcRenderer.invoke('session:clear', partition),

  clearAllSessions: (): Promise<void> =>
    ipcRenderer.invoke('session:clear-all'),

  // ── Tab events from main (new window requests) ─────────────────────────
  onOpenUrl: (cb: (url: string) => void): Unlisten => {
    const h = (_: Electron.IpcRendererEvent, url: string) => cb(url)
    ipcRenderer.on('tab:open-url', h)
    return () => ipcRenderer.removeListener('tab:open-url', h)
  },

  // ── Settings ───────────────────────────────────────────────────────────
  getSettings: (): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('settings:get'),

  setSetting: (key: string, value: unknown): Promise<void> =>
    ipcRenderer.invoke('settings:set', key, value),
})
