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
  newWindow: () => ipcRenderer.invoke('window:new'),

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
  importBookmarks: (): Promise<number> =>
    ipcRenderer.invoke('bookmarks:import-from-file'),

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

  // ── Extensions ────────────────────────────────────────────────────────
  listExtensions: () => ipcRenderer.invoke('extensions:list'),
  installExtension: () => ipcRenderer.invoke('extensions:install'),
  removeExtension: (id: string) => ipcRenderer.invoke('extensions:remove', id),

  // ── Permissions ────────────────────────────────────────────────────────
  onPermissionRequest: (cb: (data: { domain: string; permission: string }) => void): Unlisten => {
    const h = (_: Electron.IpcRendererEvent, data: { domain: string; permission: string }) => cb(data)
    ipcRenderer.on('permission:request', h)
    return () => ipcRenderer.removeListener('permission:request', h)
  },
  getSitePermissions: (domain: string) => ipcRenderer.invoke('permissions:get-site', domain),
  setSitePermission: (domain: string, permission: string, status: string) =>
    ipcRenderer.invoke('permissions:set-site', domain, permission, status),
  clearPermissions: () => ipcRenderer.invoke('permissions:clear'),

  // ── Auto-updater ───────────────────────────────────────────────────────
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('update:check'),
  downloadUpdate: (): Promise<void> => ipcRenderer.invoke('update:download'),
  installUpdate: (): void => ipcRenderer.send('update:install'),
  onUpdateAvailable: (cb: (info: { version: string }) => void): Unlisten => {
    const h = (_: Electron.IpcRendererEvent, info: { version: string }) => cb(info)
    ipcRenderer.on('update:available', h)
    return () => ipcRenderer.removeListener('update:available', h)
  },
  onUpdateNotAvailable: (cb: () => void): Unlisten => {
    const h = () => cb()
    ipcRenderer.on('update:not-available', h)
    return () => ipcRenderer.removeListener('update:not-available', h)
  },
  onUpdateProgress: (cb: (p: { percent: number; transferred: number; total: number }) => void): Unlisten => {
    const h = (_: Electron.IpcRendererEvent, p: { percent: number; transferred: number; total: number }) => cb(p)
    ipcRenderer.on('update:progress', h)
    return () => ipcRenderer.removeListener('update:progress', h)
  },
  onUpdateDownloaded: (cb: (info: { version: string }) => void): Unlisten => {
    const h = (_: Electron.IpcRendererEvent, info: { version: string }) => cb(info)
    ipcRenderer.on('update:downloaded', h)
    return () => ipcRenderer.removeListener('update:downloaded', h)
  },
  onUpdateError: (cb: (message: string) => void): Unlisten => {
    const h = (_: Electron.IpcRendererEvent, message: string) => cb(message)
    ipcRenderer.on('update:error', h)
    return () => ipcRenderer.removeListener('update:error', h)
  },
})
