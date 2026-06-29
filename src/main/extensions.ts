import { app, dialog, session as electronSession } from 'electron'
import fs from 'fs'
import path from 'path'

export interface ExtensionInfo {
  id: string
  name: string
  version: string
  path: string
  iconUrl?: string
}

function extensionsDir(): string {
  const dir = path.join(app.getPath('userData'), 'extensions')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export async function loadAllExtensions(): Promise<void> {
  const dir = extensionsDir()
  let entries: string[] = []
  try { entries = fs.readdirSync(dir) } catch { return }
  for (const name of entries) {
    const extPath = path.join(dir, name)
    try {
      if (!fs.statSync(extPath).isDirectory()) continue
      await electronSession.defaultSession.loadExtension(extPath, { allowFileAccess: true })
    } catch { /* ignore individual failures */ }
  }
}

export function listExtensions(): ExtensionInfo[] {
  const loaded = electronSession.defaultSession.getAllExtensions()
  return loaded.map(ext => ({
    id: ext.id,
    name: ext.name,
    version: ext.version,
    path: ext.path,
    iconUrl: undefined,
  }))
}

export async function installExtension(): Promise<ExtensionInfo | null> {
  const result = await dialog.showOpenDialog({
    title: 'Select Extension Folder',
    properties: ['openDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const srcPath = result.filePaths[0]
  const folderName = path.basename(srcPath)
  const destPath = path.join(extensionsDir(), folderName)
  fs.cpSync(srcPath, destPath, { recursive: true })
  try {
    const loaded = await electronSession.defaultSession.loadExtension(destPath, { allowFileAccess: true })
    return { id: loaded.id, name: loaded.name, version: loaded.version, path: loaded.path }
  } catch (e) {
    fs.rmSync(destPath, { recursive: true, force: true })
    throw e
  }
}

export function removeExtension(extId: string): void {
  electronSession.defaultSession.removeExtension(extId)
  const dir = extensionsDir()
  let entries: string[] = []
  try { entries = fs.readdirSync(dir) } catch { return }
  for (const name of entries) {
    const extPath = path.join(dir, name)
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(extPath, 'manifest.json'), 'utf-8'))
      if (manifest.key === extId || path.basename(extPath) === extId) {
        fs.rmSync(extPath, { recursive: true, force: true })
        break
      }
    } catch { /* ignore */ }
  }
}
