import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { setupIpcHandlers } from './ipc'
import { configureDoH, setMainWindow } from './privacy'
import { setupDefaultSessions } from './sessions'
import { initHistory } from './history'
import { initBookmarks } from './bookmarks'
import { initSettings } from './settings'
import { initPermissions } from './permissions'
import { loadAllExtensions } from './extensions'

configureDoH('cloudflare')
app.commandLine.appendSwitch('disable-background-networking', 'false')
app.commandLine.appendSwitch('no-pings')

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged
const isMac = process.platform === 'darwin'

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 860, minHeight: 600,
    titleBarStyle: 'hidden',
    trafficLightPosition: isMac ? { x: 14, y: 14 } : undefined,
    frame: isMac ? undefined : false,
    backgroundColor: '#0f0f11',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      webviewTag: true, spellcheck: false,
    },
    show: false,
  })
  win.once('ready-to-show', () => win.show())
  if (isDev) win.loadURL('http://localhost:5174')
  else win.loadFile(path.join(__dirname, '../renderer/index.html'))
  win.webContents.on('will-navigate', (event) => { if (!isDev) event.preventDefault() })
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  return win
}

function setupWebContentsPolicy() {
  app.on('web-contents-created', (_, contents) => {
    contents.on('will-navigate', (event, url) => {
      const allowedSchemes = ['https:', 'http:', 'about:', 'data:', 'blob:']
      try {
        const parsed = new URL(url)
        if (!allowedSchemes.includes(parsed.protocol)) event.preventDefault()
      } catch { event.preventDefault() }
    })
    contents.setWindowOpenHandler(({ url }) => {
      const wins = BrowserWindow.getAllWindows()
      if (wins.length > 0) wins[0].webContents.send('tab:open-url', url)
      return { action: 'deny' }
    })
  })
}

app.whenReady().then(async () => {
  initSettings()
  initHistory()
  initBookmarks()
  const win = createMainWindow()
  setupDefaultSessions(win)
  setMainWindow(win)
  setupIpcHandlers(win)
  initPermissions(win)
  setupWebContentsPolicy()
  await loadAllExtensions()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const w = createMainWindow()
      setMainWindow(w)
      setupIpcHandlers(w)
    }
  })
})

app.on('window-all-closed', () => { if (!isMac) app.quit() })
