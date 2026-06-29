import { app, BrowserWindow, ipcMain, shell, session } from 'electron'
import path from 'path'
import { setupIpcHandlers } from './ipc'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f0f11',
      symbolColor: '#a0a0b0',
      height: 40,
    },
    backgroundColor: '#0f0f11',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
    },
    show: false,
    frame: process.platform !== 'darwin',
  })

  win.once('ready-to-show', () => win.show())

  if (isDev) {
    win.loadURL('http://localhost:5174')
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return win
}

function setupSecurityPolicy() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
      },
    })
  })

  // Allow navigating to remote URLs in webviews but block dangerous schemes
  app.on('web-contents-created', (_, contents) => {
    contents.on('will-navigate', (event, url) => {
      const allowedSchemes = ['https:', 'http:', 'about:', 'data:']
      try {
        const parsed = new URL(url)
        if (!allowedSchemes.includes(parsed.protocol)) {
          event.preventDefault()
        }
      } catch {
        event.preventDefault()
      }
    })

    // Open external links (target=_blank outside webview) in the OS browser
    contents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })
  })
}

app.whenReady().then(() => {
  setupSecurityPolicy()
  const win = createMainWindow()
  setupIpcHandlers(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
