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

  // ── History ────────────────────────────────────────────────────────────
  addHistory: (entry: { url: string; title: string; favicon?: string; visitedAt: number }) =>
    ipcRenderer.invoke('history:add', entry),
  getHistory: (limit?: number) => ipcRenderer.invoke('history:get', limit),
  searchHistory: (query: string) => ipcRenderer.invoke('history:search', query),
  clearHistory: () => ipcRenderer.invoke('history:clear'),

  // ── Bookmarks ──────────────────────────────────────────────────────────
  addBookmark: (entry: { url: string; title: string; favicon?: string }) =>
    ipcRenderer.invoke('bookmarks:add', entry),
  removeBookmark: (id: string) => ipcRenderer.invoke('bookmarks:remove', id),
  getBookmarks: () => ipcRenderer.invoke('bookmarks:get'),
  isBookmarked: (url: string): Promise<boolean> =>
    ipcRenderer.invoke('bookmarks:is-bookmarked', url),

  // ── Downloads ──────────────────────────────────────────────────────────
  getDownloads: () => ipcRenderer.invoke('downloads:get'),
  onDownloadStarted: (cb: (info: unknown) => void): Unlisten => {
    const h = (_: Electron.IpcRendererEvent, info: unknown) => cb(info)
    ipcRenderer.on('download:started', h)
    return () => ipcRenderer.removeListener('download:started', h)
  },
  onDownloadUpdated: (cb: (info: unknown) => void): Unlisten => {
    const h = (_: Electron.IpcRendererEvent, info: unknown) => cb(info)
    ipcRenderer.on('download:updated', h)
    return () => ipcRenderer.removeListener('download:updated', h)
  },
  onDownloadDone: (cb: (info: unknown) => void): Unlisten => {
    const h = (_: Electron.IpcRendererEvent, info: unknown) => cb(info)
    ipcRenderer.on('download:done', h)
    return () => ipcRenderer.removeListener('download:done', h)
  },

  // ── Webview preload ────────────────────────────────────────────────────
  getWebviewPreloadPath: (): Promise<string> =>
    ipcRenderer.invoke('webview:preload-path'),

  // ── Settings ───────────────────────────────────────────────────────────
  getSettings: (): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('settings:get'),
  setSetting: (key: string, value: unknown): Promise<void> =>
    ipcRenderer.invoke('settings:set', key, value),
})
