import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { setupIpcHandlers } from './ipc'
import { configureDoH, setMainWindow } from './privacy'
import { setupDefaultSessions } from './sessions'

// DoH must be configured before app is ready
configureDoH('cloudflare')

// Disable Electron's own update checks and telemetry
app.commandLine.appendSwitch('disable-background-networking', 'false')
app.commandLine.appendSwitch('no-pings')

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged
const isMac = process.platform === 'darwin'

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 860,
    minHeight: 600,
    // On macOS: hidden titlebar + traffic lights positioned in sidebar
    titleBarStyle: 'hidden',
    trafficLightPosition: isMac ? { x: 14, y: 14 } : undefined,
    // On Windows/Linux: frameless (custom controls)
    frame: isMac ? undefined : false,
    backgroundColor: '#0f0f11',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
      // Disable spell check to avoid external requests
      spellcheck: false,
    },
    show: false,
  })

  win.once('ready-to-show', () => win.show())

  if (isDev) {
    win.loadURL('http://localhost:5174')
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Block dangerous navigations inside the shell UI
  win.webContents.on('will-navigate', (event, url) => {
    if (!isDev) {
      // In production the shell should never navigate away
      event.preventDefault()
    }
  })

  // External link handler for the shell
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}

function setupWebContentsPolicy() {
  app.on('web-contents-created', (_, contents) => {
    // Block dangerous schemes in all webviews
    contents.on('will-navigate', (event, url) => {
      const allowedSchemes = ['https:', 'http:', 'about:', 'data:', 'blob:']
      try {
        const parsed = new URL(url)
        if (!allowedSchemes.includes(parsed.protocol)) {
          event.preventDefault()
        }
      } catch {
        event.preventDefault()
      }
    })

    // New windows from webview content: open in app as new tab via IPC
    contents.setWindowOpenHandler(({ url }) => {
      // Find the main window and tell renderer to open a new tab
      const wins = BrowserWindow.getAllWindows()
      if (wins.length > 0) {
        wins[0].webContents.send('tab:open-url', url)
      }
      return { action: 'deny' }
    })
  })
}

app.whenReady().then(() => {
  setupDefaultSessions()
  setupWebContentsPolicy()

  const win = createMainWindow()
  setMainWindow(win)
  setupIpcHandlers(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const w = createMainWindow()
      setMainWindow(w)
      setupIpcHandlers(w)
    }
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})
