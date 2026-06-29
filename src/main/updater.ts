import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater'
import { BrowserWindow, app } from 'electron'

let mainWin: BrowserWindow | null = null

export function initUpdater(win: BrowserWindow) {
  mainWin = win
  if (!app.isPackaged) return

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  // Suppress electron-updater's own logger noise
  autoUpdater.logger = null

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    win.webContents.send('update:available', { version: info.version, releaseNotes: info.releaseNotes })
  })
  autoUpdater.on('update-not-available', () => {
    win.webContents.send('update:not-available')
  })
  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    win.webContents.send('update:progress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
    })
  })
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    win.webContents.send('update:downloaded', { version: info.version })
  })
  autoUpdater.on('error', (err: Error) => {
    win.webContents.send('update:error', err.message)
  })

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {/* ignore on startup */})
  }, 4000)
}

export async function checkForUpdates() {
  return autoUpdater.checkForUpdates()
}

export async function downloadUpdate() {
  return autoUpdater.downloadUpdate()
}

export function installUpdate() {
  autoUpdater.quitAndInstall(false, true)
}
