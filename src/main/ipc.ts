import { BrowserWindow, ipcMain, app, session } from 'electron'
import path from 'path'
import {
  registerTabWebview,
  unregisterTab,
  resetTabCount,
  getSessionStats,
} from './privacy'
import {
  setupWorkspaceSession,
  clearAllPersistSessions,
} from './sessions'
import {
  addHistoryEntry,
  getHistory,
  searchHistory,
  clearHistory,
} from './history'
import {
  addBookmark,
  removeBookmark,
  getBookmarks,
  isBookmarked,
} from './bookmarks'
import { getAllDownloads } from './downloads'

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

  // ── Privacy / tracker counting ───────────────────────────────────────────
  ipcMain.on('tab:register-webview', (_, { tabId, webContentsId }: { tabId: string; webContentsId: number }) => {
    registerTabWebview(tabId, webContentsId)
  })
  ipcMain.on('tab:unregister', (_, tabId: string) => unregisterTab(tabId))
  ipcMain.on('tab:reset-tracker-count', (_, tabId: string) => resetTabCount(tabId))
  ipcMain.handle('privacy:session-stats', () => getSessionStats())

  // ── Session / Workspace management ──────────────────────────────────────
  ipcMain.handle('session:setup-workspace', (_, partition: string) => {
    setupWorkspaceSession(partition)
  })
  ipcMain.handle('session:clear-all', async () => clearAllPersistSessions())
  ipcMain.handle('session:clear', async (_, partition: string) => {
    const ses = session.fromPartition(partition)
    await ses.clearStorageData({
      storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage', 'serviceworkers'],
    })
    await ses.clearCache()
  })

  // ── History ───────────────────────────────────────────────────────────────
  ipcMain.handle('history:add', (_, entry: Parameters<typeof addHistoryEntry>[0]) => {
    return addHistoryEntry(entry)
  })
  ipcMain.handle('history:get', (_, limit?: number) => getHistory(limit))
  ipcMain.handle('history:search', (_, query: string) => searchHistory(query))
  ipcMain.handle('history:clear', () => clearHistory())

  // ── Bookmarks ─────────────────────────────────────────────────────────────
  ipcMain.handle('bookmarks:add', (_, entry: Parameters<typeof addBookmark>[0]) => {
    return addBookmark(entry)
  })
  ipcMain.handle('bookmarks:remove', (_, id: string) => removeBookmark(id))
  ipcMain.handle('bookmarks:get', () => getBookmarks())
  ipcMain.handle('bookmarks:is-bookmarked', (_, url: string) => isBookmarked(url))

  // ── Downloads ─────────────────────────────────────────────────────────────
  ipcMain.handle('downloads:get', () => getAllDownloads())

  // ── Webview preload path ──────────────────────────────────────────────────
  ipcMain.handle('webview:preload-path', () => {
    return path.join(__dirname, 'webview-preload.js')
  })

  // ── Settings ─────────────────────────────────────────────────────────────
  const settings: Record<string, unknown> = {
    clearOnClose: false,
    dohProvider: 'cloudflare',
    searchEngine: 'brave',
  }
  ipcMain.handle('settings:get', () => settings)
  ipcMain.handle('settings:set', (_, key: string, value: unknown) => {
    settings[key] = value
  })

  app.on('before-quit', async (e) => {
    if (settings.clearOnClose) {
      e.preventDefault()
      await clearAllPersistSessions()
      app.exit(0)
    }
  })
}
