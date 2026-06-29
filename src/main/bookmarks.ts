import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export interface Bookmark {
  id: string
  url: string
  title: string
  favicon?: string
  addedAt: number
}

let _bookmarks: Bookmark[] = []
let _initialized = false

function filePath() {
  return path.join(app.getPath('userData'), 'bookmarks.json')
}

export function initBookmarks() {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8')
    _bookmarks = JSON.parse(raw)
  } catch {
    _bookmarks = []
  }
  _initialized = true
}

function persist() {
  if (!_initialized) return
  try {
    fs.writeFileSync(filePath(), JSON.stringify(_bookmarks))
  } catch { /* ignore */ }
}

export function addBookmark(entry: Omit<Bookmark, 'id' | 'addedAt'>): Bookmark {
  const bm: Bookmark = { ...entry, id: crypto.randomUUID(), addedAt: Date.now() }
  _bookmarks.unshift(bm)
  persist()
  return bm
}

export function removeBookmark(id: string) {
  _bookmarks = _bookmarks.filter(b => b.id !== id)
  persist()
}

export function getBookmarks(): Bookmark[] {
  return _bookmarks
}

export function isBookmarked(url: string): boolean {
  return _bookmarks.some(b => b.url === url)
}
