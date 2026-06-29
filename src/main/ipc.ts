import { BrowserWindow, ipcMain, app, session } from 'electron'
import {
  registerTabWebview,
  unregisterTab,
  resetTabCount,
  getSessionStats,
} from './privacy'
import {
  setupWorkspaceSession,
  clearAllPersistSessions,
  partitionForWorkspace,
} from './sessions'

export function setupIpcHandlers(win: BrowserWindow) {
  // ── Window controls ──────────────────────────────────────────────────────
  ipcMain.on('window:minimize', () => win.minimize())
  ipcMain.on('window:maximize', () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.on('window:close', () => win.close())
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:platform', () => process.platform)

  win.on('maximize', () => win.webContents.send('window:state', 'maximized'))
  win.on('unmaximize', () => win.webContents.send('window:state', 'normal'))

  // ── Privacy / Tracker counting ───────────────────────────────────────────
  ipcMain.on('tab:register-webview', (_, { tabId, webContentsId }: { tabId: string; webContentsId: number }) => {
    registerTabWebview(tabId, webContentsId)
  })

  ipcMain.on('tab:unregister', (_, tabId: string) => {
    unregisterTab(tabId)
  })

  ipcMain.on('tab:reset-tracker-count', (_, tabId: string) => {
    resetTabCount(tabId)
  })

  ipcMain.handle('privacy:session-stats', () => {
    return getSessionStats()
  })

  // ── Session / Workspace management ──────────────────────────────────────
  ipcMain.handle('session:setup-workspace', (_, partition: string) => {
    setupWorkspaceSession(partition)
  })

  ipcMain.handle('session:clear-all', async () => {
    await clearAllPersistSessions()
  })

  ipcMain.handle('session:clear', async (_, partition: string) => {
    const ses = session.fromPartition(partition)
    await ses.clearStorageData({
      storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage', 'serviceworkers'],
    })
    await ses.clearCache()
  })

  // ── Settings ─────────────────────────────────────────────────────────────
  // Simple in-memory settings; persist to userData in a future iteration.
  const settings: Record<string, unknown> = {
    clearOnClose: false,
    dohProvider: 'cloudflare',
    searchEngine: 'brave',
  }

  ipcMain.handle('settings:get', () => settings)
  ipcMain.handle('settings:set', (_, key: string, value: unknown) => {
    settings[key] = value
  })

  // Register handler for clear-on-close preference
  app.on('before-quit', async (e) => {
    if (settings.clearOnClose) {
      e.preventDefault()
      await clearAllPersistSessions()
      app.exit(0)
    }
  })
}
