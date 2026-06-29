export {}

export interface HistoryEntry {
  id: string
  url: string
  title: string
  favicon?: string
  visitedAt: number
}

export interface Bookmark {
  id: string
  url: string
  title: string
  favicon?: string
  addedAt: number
}

export interface DownloadInfo {
  id: string
  filename: string
  url: string
  totalBytes: number
  receivedBytes: number
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted'
  savePath: string
  startedAt: number
}

declare global {
  interface Window {
    electronAPI: {
      platform: string
      minimize: () => void
      maximize: () => void
      close: () => void
      onWindowState: (cb: (state: string) => void) => () => void
      getVersion: () => Promise<string>

      registerTabWebview: (tabId: string, webContentsId: number) => void
      unregisterTab: (tabId: string) => void
      resetTrackerCount: (tabId: string) => void
      onTrackerBlocked: (cb: (tabId: string, count: number) => void) => () => void
      getSessionStats: () => Promise<{ totalBlockedSession: number }>

      setupWorkspaceSession: (partition: string) => Promise<void>
      clearSession: (partition: string) => Promise<void>
      clearAllSessions: () => Promise<void>

      onOpenUrl: (cb: (url: string) => void) => () => void

      addHistory: (entry: { url: string; title: string; favicon?: string; visitedAt: number }) => Promise<HistoryEntry>
      getHistory: (limit?: number) => Promise<HistoryEntry[]>
      searchHistory: (query: string) => Promise<HistoryEntry[]>
      clearHistory: () => Promise<void>

      addBookmark: (entry: { url: string; title: string; favicon?: string }) => Promise<Bookmark>
      removeBookmark: (id: string) => Promise<void>
      getBookmarks: () => Promise<Bookmark[]>
      isBookmarked: (url: string) => Promise<boolean>

      getDownloads: () => Promise<DownloadInfo[]>
      onDownloadStarted: (cb: (info: DownloadInfo) => void) => () => void
      onDownloadUpdated: (cb: (info: DownloadInfo) => void) => () => void
      onDownloadDone: (cb: (info: DownloadInfo) => void) => () => void

      getWebviewPreloadPath: () => Promise<string>

      getSettings: () => Promise<Record<string, unknown>>
      setSetting: (key: string, value: unknown) => Promise<void>
    }
  }
}
