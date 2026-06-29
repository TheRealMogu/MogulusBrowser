import { useState, useCallback, useRef, useEffect } from 'react'
import { HOME_URL } from '../utils/url'
import type { HistoryEntry, Bookmark, DownloadInfo } from '../types/electron'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Tab {
  id: string
  url: string
  title: string
  favicon: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  isPinned: boolean
  trackerCount: number
  themeColor?: string
  partition: string
}

export interface Workspace {
  id: string
  name: string
  accentColor: string
  partition: string
  tabs: Tab[]
  activeTabId: string
  isPrivate: boolean
}

export type SidebarView = 'tabs' | 'bookmarks' | 'history' | 'downloads'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTab(url = HOME_URL, partition = 'persist:ws-personal'): Tab {
  return {
    id: crypto.randomUUID(),
    url,
    title: url === HOME_URL ? 'New Tab' : url,
    favicon: '',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    isPinned: false,
    trackerCount: 0,
    partition,
  }
}

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'personal', name: 'Personal', accentColor: '#7c5cfc', partition: 'persist:ws-personal', tabs: [], activeTabId: '', isPrivate: false },
  { id: 'work',     name: 'Work',     accentColor: '#3b82f6', partition: 'persist:ws-work',     tabs: [], activeTabId: '', isPrivate: false },
  { id: 'play',     name: 'Play',     accentColor: '#10b981', partition: 'persist:ws-play',     tabs: [], activeTabId: '', isPrivate: false },
]

function initWorkspaces(): Workspace[] {
  return DEFAULT_WORKSPACES.map(ws => {
    const tab = makeTab(HOME_URL, ws.partition)
    return { ...ws, tabs: [tab], activeTabId: tab.id }
  })
}

// ── Store ─────────────────────────────────────────────────────────────────────

export function useBrowserStore() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initWorkspaces)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('personal')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarView, setSidebarView] = useState<SidebarView>('tabs')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [privacyPanelOpen, setPrivacyPanelOpen] = useState(false)
  const [splitTabId, setSplitTabId] = useState<string | null>(null)
  const [sessionStats, setSessionStats] = useState({ totalBlockedSession: 0 })
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [downloads, setDownloads] = useState<DownloadInfo[]>([])
  const [downloadPanelOpen, setDownloadPanelOpen] = useState(false)
  const [webviewPreloadPath, setWebviewPreloadPath] = useState<string>('')

  const webviewRefs = useRef<Map<string, Electron.WebviewTag>>(new Map())
  // URL bar focus function registered by NavigationBar
  const urlBarFocusFn = useRef<(() => void) | null>(null)

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) ?? workspaces[0]
  const activeTabs = activeWorkspace?.tabs ?? []
  const activeTab = activeTabs.find(t => t.id === activeWorkspace?.activeTabId)

  // ── Bootstrap ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.getBookmarks().then(setBookmarks)
    window.electronAPI.getHistory(200).then(setHistory)
    window.electronAPI.getDownloads().then(setDownloads)
    window.electronAPI.getWebviewPreloadPath().then(p => {
      if (p) setWebviewPreloadPath(`file://${p}`)
    })
  }, [])

  // ── Download listeners ────────────────────────────────────────────────────

  useEffect(() => {
    if (!window.electronAPI) return
    const onStart = (info: DownloadInfo) => {
      setDownloads(prev => [info, ...prev])
      setDownloadPanelOpen(true)
    }
    const onUpdate = (info: DownloadInfo) => {
      setDownloads(prev => prev.map(d => d.id === info.id ? info : d))
    }
    const onDone = (info: DownloadInfo) => {
      setDownloads(prev => prev.map(d => d.id === info.id ? info : d))
    }
    const u1 = window.electronAPI.onDownloadStarted(onStart as (info: unknown) => void)
    const u2 = window.electronAPI.onDownloadUpdated(onUpdate as (info: unknown) => void)
    const u3 = window.electronAPI.onDownloadDone(onDone as (info: unknown) => void)
    return () => { u1(); u2(); u3() }
  }, [])

  // ── Workspace actions ─────────────────────────────────────────────────────

  const addWorkspace = useCallback((name: string, color = '#7c5cfc', isPrivate = false) => {
    const id = crypto.randomUUID()
    const partition = isPrivate ? `private-${id}` : `persist:ws-${id}`
    const tab = makeTab(HOME_URL, partition)
    const ws: Workspace = {
      id, name,
      accentColor: isPrivate ? '#ef4444' : color,
      partition, tabs: [tab], activeTabId: tab.id, isPrivate,
    }
    window.electronAPI?.setupWorkspaceSession(partition)
    setWorkspaces(prev => [...prev, ws])
    setActiveWorkspaceId(id)
    return id
  }, [])

  const closeWorkspace = useCallback((id: string) => {
    setWorkspaces(prev => {
      if (prev.length <= 1) return prev
      const next = prev.filter(w => w.id !== id)
      setActiveWorkspaceId(cur => (cur === id ? (next[0]?.id ?? '') : cur))
      return next
    })
  }, [])

  // ── Tab actions ───────────────────────────────────────────────────────────

  const addTab = useCallback((url = HOME_URL, workspaceId?: string) => {
    const wsId = workspaceId ?? activeWorkspaceId
    setWorkspaces(prev => prev.map(ws => {
      if (ws.id !== wsId) return ws
      const tab = makeTab(url, ws.partition)
      return { ...ws, tabs: [...ws.tabs, tab], activeTabId: tab.id }
    }))
  }, [activeWorkspaceId])

  const closeTab = useCallback((tabId: string, workspaceId?: string) => {
    const wsId = workspaceId ?? activeWorkspaceId
    window.electronAPI?.unregisterTab(tabId)
    setWorkspaces(prev => prev.map(ws => {
      if (ws.id !== wsId) return ws
      if (ws.tabs.length === 1) {
        const fresh = makeTab(HOME_URL, ws.partition)
        return { ...ws, tabs: [fresh], activeTabId: fresh.id }
      }
      const idx = ws.tabs.findIndex(t => t.id === tabId)
      const next = ws.tabs.filter(t => t.id !== tabId)
      const newActive = ws.activeTabId === tabId
        ? (next[Math.max(0, idx - 1)]?.id ?? next[0]?.id ?? '')
        : ws.activeTabId
      return { ...ws, tabs: next, activeTabId: newActive }
    }))
  }, [activeWorkspaceId])

  const setActiveTab = useCallback((tabId: string, workspaceId?: string) => {
    const wsId = workspaceId ?? activeWorkspaceId
    setWorkspaces(prev => prev.map(ws =>
      ws.id === wsId ? { ...ws, activeTabId: tabId } : ws
    ))
  }, [activeWorkspaceId])

  const updateTab = useCallback((tabId: string, patch: Partial<Tab>, workspaceId?: string) => {
    const wsId = workspaceId ?? activeWorkspaceId
    setWorkspaces(prev => prev.map(ws => {
      if (ws.id !== wsId) return ws
      return { ...ws, tabs: ws.tabs.map(t => t.id === tabId ? { ...t, ...patch } : t) }
    }))
  }, [activeWorkspaceId])

  const navigateTo = useCallback((url: string, workspaceId?: string) => {
    const wsId = workspaceId ?? activeWorkspaceId
    setWorkspaces(prev => prev.map(ws => {
      if (ws.id !== wsId) return ws
      return {
        ...ws,
        tabs: ws.tabs.map(t =>
          t.id === ws.activeTabId
            ? { ...t, url, isLoading: url !== HOME_URL, title: url === HOME_URL ? 'New Tab' : t.title }
            : t
        ),
      }
    }))
    if (activeWorkspace?.activeTabId) {
      window.electronAPI?.resetTrackerCount(activeWorkspace.activeTabId)
    }
  }, [activeWorkspaceId, activeWorkspace])

  const pinTab = useCallback((tabId: string) => {
    setWorkspaces(prev => prev.map(ws => ({
      ...ws,
      tabs: ws.tabs.map(t => t.id === tabId ? { ...t, isPinned: !t.isPinned } : t),
    })))
  }, [])

  // ── Bookmark actions ──────────────────────────────────────────────────────

  const toggleBookmark = useCallback(async (url: string, title: string, favicon?: string) => {
    if (!window.electronAPI) return
    const existing = bookmarks.find(b => b.url === url)
    if (existing) {
      await window.electronAPI.removeBookmark(existing.id)
      setBookmarks(prev => prev.filter(b => b.id !== existing.id))
    } else {
      const bm = await window.electronAPI.addBookmark({ url, title, favicon })
      setBookmarks(prev => [bm, ...prev])
    }
  }, [bookmarks])

  const isTabBookmarked = useCallback((url: string) => {
    return bookmarks.some(b => b.url === url)
  }, [bookmarks])

  // ── History actions ───────────────────────────────────────────────────────

  const addToHistory = useCallback(async (url: string, title: string, favicon?: string) => {
    if (!window.electronAPI || url === HOME_URL || url.startsWith('about:')) return
    const entry = await window.electronAPI.addHistory({ url, title, favicon, visitedAt: Date.now() })
    setHistory(prev => {
      // Avoid duplicating same URL at top
      if (prev[0]?.url === url) return prev
      return [entry, ...prev.slice(0, 499)]
    })
  }, [])

  const clearAllHistory = useCallback(async () => {
    await window.electronAPI?.clearHistory()
    setHistory([])
  }, [])

  // ── Webview refs ──────────────────────────────────────────────────────────

  const setWebviewRef = useCallback((tabId: string, el: Electron.WebviewTag | null) => {
    if (el) webviewRefs.current.set(tabId, el)
    else webviewRefs.current.delete(tabId)
  }, [])

  const getActiveWebview = useCallback((): Electron.WebviewTag | null => {
    if (!activeTab) return null
    return webviewRefs.current.get(activeTab.id) ?? null
  }, [activeTab])

  // ── URL bar focus registration ────────────────────────────────────────────

  const registerUrlBarFocus = useCallback((fn: () => void) => {
    urlBarFocusFn.current = fn
  }, [])

  const focusUrlBar = useCallback(() => {
    urlBarFocusFn.current?.()
  }, [])

  // ── Session stats ─────────────────────────────────────────────────────────

  const refreshSessionStats = useCallback(async () => {
    const stats = await window.electronAPI?.getSessionStats()
    if (stats) setSessionStats(stats)
  }, [])

  // ── IPC listeners ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!window.electronAPI) return
    const unsub = window.electronAPI.onTrackerBlocked((tabId, count) => {
      setWorkspaces(prev => prev.map(ws => ({
        ...ws,
        tabs: ws.tabs.map(t => t.id === tabId ? { ...t, trackerCount: count } : t),
      })))
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!window.electronAPI) return
    const unsub = window.electronAPI.onOpenUrl((url) => addTab(url))
    return unsub
  }, [addTab])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === 'k') { e.preventDefault(); setCommandPaletteOpen(o => !o) }
      if (mod && e.key === 't') { e.preventDefault(); addTab() }
      if (mod && e.key === 'w') { e.preventDefault(); if (activeTab) closeTab(activeTab.id) }
      if (mod && e.key === 'l') { e.preventDefault(); focusUrlBar() }

      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
        setPrivacyPanelOpen(false)
        setDownloadPanelOpen(false)
      }

      // Cmd+1-9: switch to tab by index
      if (mod && !e.shiftKey && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key) - 1
        const tab = activeTabs[idx]
        if (tab) { e.preventDefault(); setActiveTab(tab.id) }
      }

      if (mod && e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        const idx = workspaces.findIndex(w => w.id === activeWorkspaceId)
        const prev = workspaces[idx - 1]
        if (prev) setActiveWorkspaceId(prev.id)
      }
      if (mod && e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault()
        const idx = workspaces.findIndex(w => w.id === activeWorkspaceId)
        const next = workspaces[idx + 1]
        if (next) setActiveWorkspaceId(next.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTab, activeTabs, activeWorkspaceId, workspaces, addTab, closeTab, focusUrlBar, setActiveTab])

  return {
    // State
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    activeTabs,
    activeTab,
    sidebarCollapsed,
    sidebarView,
    commandPaletteOpen,
    privacyPanelOpen,
    splitTabId,
    sessionStats,
    bookmarks,
    history,
    downloads,
    downloadPanelOpen,
    webviewPreloadPath,

    // Workspace actions
    setActiveWorkspaceId,
    addWorkspace,
    closeWorkspace,

    // Tab actions
    addTab,
    closeTab,
    setActiveTab,
    updateTab,
    navigateTo,
    pinTab,
    setSplitTabId,

    // Bookmark actions
    toggleBookmark,
    isTabBookmarked,

    // History actions
    addToHistory,
    clearAllHistory,

    // URL bar
    registerUrlBarFocus,
    focusUrlBar,

    // UI state
    setSidebarView,
    toggleSidebar: () => setSidebarCollapsed(v => !v),
    openCommandPalette: () => setCommandPaletteOpen(true),
    closeCommandPalette: () => setCommandPaletteOpen(false),
    togglePrivacyPanel: () => setPrivacyPanelOpen(v => !v),
    closePrivacyPanel: () => setPrivacyPanelOpen(false),
    toggleDownloadPanel: () => setDownloadPanelOpen(v => !v),
    closeDownloadPanel: () => setDownloadPanelOpen(false),

    // Webview refs
    setWebviewRef,
    getActiveWebview,

    // Stats
    refreshSessionStats,

    HOME_URL,
  }
}

export type BrowserStore = ReturnType<typeof useBrowserStore>
