import { BrowserWindow, ipcMain, app, session, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { registerTabWebview, unregisterTab, resetTabCount, getSessionStats } from './privacy'
import { setupWorkspaceSession, clearAllPersistSessions } from './sessions'
import { addHistoryEntry, getHistory, searchHistory, clearHistory } from './history'
import { addBookmark, removeBookmark, getBookmarks, isBookmarked } from './bookmarks'
import { getAllDownloads } from './downloads'
import { getSettings, setSetting } from './settings'
import { listExtensions, installExtension, removeExtension } from './extensions'
import { getSitePermissions, setSitePermission, clearPermissions } from './permissions'
import { checkForUpdates, downloadUpdate, installUpdate } from './updater'

// ── Global handler registry (prevent double-registration across windows) ────
const handlerSet = new Set<string>()
function once(channel: string, handler: Parameters<typeof ipcMain.handle>[1]) {
  if (handlerSet.has(channel)) return
  handlerSet.add(channel)
  ipcMain.handle(channel, handler)
}

let _beforeQuitRegistered = false

export function setupIpcHandlers(win: BrowserWindow) {
  // ── Per-window handlers ───────────────────────────────────────────────────
  ipcMain.removeAllListeners('window:minimize')
  ipcMain.removeAllListeners('window:maximize')
  ipcMain.removeAllListeners('window:close')

  ipcMain.on('window:minimize', () => win.minimize())
  ipcMain.on('window:maximize', () => { if (win.isMaximized()) win.unmaximize(); else win.maximize() })
  ipcMain.on('window:close', () => win.close())

  win.on('maximize', () => win.webContents.send('window:state', 'maximized'))
  win.on('unmaximize', () => win.webContents.send('window:state', 'normal'))

  // ── Per-window tracker events ─────────────────────────────────────────────
  ipcMain.removeAllListeners('tab:register-webview')
  ipcMain.removeAllListeners('tab:unregister')
  ipcMain.removeAllListeners('tab:reset-tracker-count')
  ipcMain.on('tab:register-webview', (_, { tabId, webContentsId }: { tabId: string; webContentsId: number }) => {
    registerTabWebview(tabId, webContentsId)
  })
  ipcMain.on('tab:unregister', (_, tabId: string) => unregisterTab(tabId))
  ipcMain.on('tab:reset-tracker-count', (_, tabId: string) => resetTabCount(tabId))

  // ── Global handles (registered once) ─────────────────────────────────────
  once('app:version', () => app.getVersion())
  once('app:platform', () => process.platform)
  once('privacy:session-stats', () => getSessionStats())

  once('session:setup-workspace', (_, partition: string) => setupWorkspaceSession(partition))
  once('session:clear-all', async () => clearAllPersistSessions())
  once('session:clear', async (_, partition: string) => {
    const ses = session.fromPartition(partition)
    await ses.clearStorageData({ storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage', 'serviceworkers'] })
    await ses.clearCache()
  })

  once('history:add', (_, entry: Parameters<typeof addHistoryEntry>[0]) => addHistoryEntry(entry))
  once('history:get', (_, limit?: number) => getHistory(limit))
  once('history:search', (_, query: string) => searchHistory(query))
  once('history:clear', () => clearHistory())

  once('bookmarks:add', (_, entry: Parameters<typeof addBookmark>[0]) => addBookmark(entry))
  once('bookmarks:remove', (_, id: string) => removeBookmark(id))
  once('bookmarks:get', () => getBookmarks())
  once('bookmarks:is-bookmarked', (_, url: string) => isBookmarked(url))
  once('bookmarks:import-from-file', async (): Promise<number> => {
    const result = await dialog.showOpenDialog({
      title: 'Import Bookmarks',
      filters: [{ name: 'Bookmarks', extensions: ['json', 'html'] }],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return 0
    const filePath = result.filePaths[0]
    const content = fs.readFileSync(filePath, 'utf-8')
    const ext = path.extname(filePath).toLowerCase()
    let count = 0
    if (ext === '.html') {
      // Netscape HTML format
      const urlRegex = /<A HREF="([^"]+)"[^>]*>([^<]+)<\/A>/gi
      let match: RegExpExecArray | null
      while ((match = urlRegex.exec(content)) !== null) {
        const [, url, title] = match
        if (url && title) { addBookmark({ url, title }); count++ }
      }
    } else {
      // Chrome JSON format or array
      try {
        const data = JSON.parse(content)
        function extractFromChromeNode(node: Record<string, unknown>) {
          if (node.type === 'url' && typeof node.url === 'string' && typeof node.name === 'string') {
            addBookmark({ url: node.url, title: node.name }); count++
          }
          if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) extractFromChromeNode(child as Record<string, unknown>)
          }
        }
        if (data.roots) {
          for (const root of Object.values(data.roots)) extractFromChromeNode(root as Record<string, unknown>)
        } else if (Array.isArray(data)) {
          for (const item of data) {
            if (item.url && item.title) { addBookmark({ url: item.url, title: item.title }); count++ }
          }
        }
      } catch { /* ignore */ }
    }
    return count
  })

  once('downloads:get', () => getAllDownloads())
  once('webview:preload-path', () => path.join(__dirname, 'webview-preload.js'))

  once('settings:get', () => getSettings())
  once('settings:set', (_, key: string, value: unknown) => {
    setSetting(key as keyof ReturnType<typeof getSettings>, value as never)
  })

  once('extensions:list', () => listExtensions())
  once('extensions:install', async () => {
    try { return await installExtension() }
    catch (e) { console.error('Extension install error:', e); return null }
  })
  once('extensions:remove', (_, extId: string) => removeExtension(extId))

  once('permissions:get-site', (_, domain: string) => getSitePermissions(domain))
  once('permissions:set-site', (_, domain: string, permission: string, status: string) => {
    setSitePermission(domain, permission, status as 'allow' | 'deny' | 'ask')
  })
  once('permissions:clear', () => clearPermissions())

  once('update:check', async () => {
    try { await checkForUpdates() } catch { /* ignore */ }
  })
  once('update:download', async () => {
    try { await downloadUpdate() } catch { /* ignore */ }
  })
  ipcMain.removeAllListeners('update:install')
  ipcMain.on('update:install', () => installUpdate())

  once('window:new', () => {
    const newWin = new BrowserWindow({
      width: 1280, height: 800, minWidth: 860, minHeight: 600,
      titleBarStyle: 'hidden',
      frame: process.platform === 'darwin' ? undefined : false,
      backgroundColor: '#0f0f11',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true, nodeIntegration: false, sandbox: false,
        webviewTag: true, spellcheck: false,
      },
      show: false,
    })
    newWin.once('ready-to-show', () => newWin.show())
    const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged
    if (isDev) newWin.loadURL('http://localhost:5174')
    else newWin.loadFile(path.join(__dirname, '../renderer/index.html'))
    setupIpcHandlers(newWin)
  })

  if (!_beforeQuitRegistered) {
    _beforeQuitRegistered = true
    app.on('before-quit', async (e) => {
      const settings = getSettings()
      if (settings.clearOnClose) {
        e.preventDefault()
        await clearAllPersistSessions()
        app.exit(0)
      }
    })
  }
}
