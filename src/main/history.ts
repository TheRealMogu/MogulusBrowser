import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export interface HistoryEntry {
  id: string
  url: string
  title: string
  favicon?: string
  visitedAt: number
}

const MAX_ENTRIES = 2000
let _history: HistoryEntry[] = []
let _initialized = false

function filePath() {
  return path.join(app.getPath('userData'), 'history.json')
}

export function initHistory() {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8')
    _history = JSON.parse(raw)
  } catch {
    _history = []
  }
  _initialized = true
}

function persist() {
  if (!_initialized) return
  try {
    fs.writeFileSync(filePath(), JSON.stringify(_history))
  } catch { /* ignore */ }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): HistoryEntry {
  const e: HistoryEntry = { ...entry, id: crypto.randomUUID() }
  // Avoid consecutive duplicates of the same URL
  if (_history[0]?.url !== e.url) {
    _history.unshift(e)
    if (_history.length > MAX_ENTRIES) _history = _history.slice(0, MAX_ENTRIES)
    persist()
  }
  return e
}

export function getHistory(limit = 500): HistoryEntry[] {
  return _history.slice(0, limit)
}

export function searchHistory(query: string, limit = 50): HistoryEntry[] {
  const q = query.toLowerCase()
  return _history
    .filter(e => e.url.toLowerCase().includes(q) || e.title.toLowerCase().includes(q))
    .slice(0, limit)
}

export function clearHistory() {
  _history = []
  persist()
}
