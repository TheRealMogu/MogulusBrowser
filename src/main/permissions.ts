import { app, session as electronSession, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'

export type PermissionType = 'camera' | 'microphone' | 'notifications' | 'geolocation'
export type PermissionStatus = 'allow' | 'deny' | 'ask'

export interface SitePermissions {
  [permission: string]: PermissionStatus
}
export interface PermissionStore {
  [domain: string]: SitePermissions
}

let _store: PermissionStore = {}
let _mainWin: BrowserWindow | null = null

function filePath() { return path.join(app.getPath('userData'), 'permissions.json') }

export function initPermissions(win: BrowserWindow) {
  _mainWin = win
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8')
    _store = JSON.parse(raw)
  } catch { _store = {} }

  electronSession.defaultSession.setPermissionRequestHandler(async (webContents, permission, callback) => {
    const url = webContents.getURL()
    let domain = ''
    try { domain = new URL(url).hostname } catch { domain = url }

    const sitePerms = _store[domain] ?? {}
    const status = sitePerms[permission] as PermissionStatus | undefined
    if (status === 'allow') { callback(true); return }
    if (status === 'deny') { callback(false); return }

    // Ask the renderer
    if (_mainWin) {
      _mainWin.webContents.send('permission:request', { domain, permission })
    }
    // Default: deny unknown
    callback(false)
  })
}

function persist() {
  try { fs.writeFileSync(filePath(), JSON.stringify(_store, null, 2)) } catch { /* ignore */ }
}

export function getSitePermissions(domain: string): SitePermissions {
  return _store[domain] ?? {}
}

export function setSitePermission(domain: string, permission: string, status: PermissionStatus): void {
  if (!_store[domain]) _store[domain] = {}
  _store[domain][permission] = status
  persist()
}

export function clearPermissions(): void {
  _store = {}
  persist()
}
