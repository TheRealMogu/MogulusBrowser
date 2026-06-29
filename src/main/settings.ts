import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export interface AppSettings {
  clearOnClose: boolean
  dohProvider: 'cloudflare' | 'quad9' | 'off'
  searchEngine: 'brave' | 'google' | 'duckduckgo' | 'bing' | 'startpage' | 'ecosia'
  theme: 'dark' | 'light' | 'system'
  defaultZoom: number
  blockTrackers: boolean
  blockAds: boolean
  enableFingerprintProtection: boolean
  homePage: string
  language: string
}

const DEFAULTS: AppSettings = {
  clearOnClose: false,
  dohProvider: 'cloudflare',
  searchEngine: 'brave',
  theme: 'dark',
  defaultZoom: 1,
  blockTrackers: true,
  blockAds: true,
  enableFingerprintProtection: true,
  homePage: 'mogulus://home',
  language: 'en-US',
}

let _settings: AppSettings = { ...DEFAULTS }
let _initialized = false

function filePath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function initSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8')
    _settings = { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    _settings = { ...DEFAULTS }
  }
  _initialized = true
  return _settings
}

function persist() {
  if (!_initialized) return
  try {
    fs.writeFileSync(filePath(), JSON.stringify(_settings, null, 2))
  } catch { }
}

export function getSettings(): AppSettings {
  return { ..._settings }
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  _settings[key] = value
  persist()
}

export function setSettings(patch: Partial<AppSettings>) {
  Object.assign(_settings, patch)
  persist()
}
