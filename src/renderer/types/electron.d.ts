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

export interface ExtensionInfo {
  id: string
  name: string
  version: string
  path: string
  iconUrl?: string
}

export interface AppSettings {
  clearOnClose: boolean
  dohProvider: 'cloudflare' | 'quad9' | 'off'
  searchEngine: 'brave' | 'duckduckgo' | 'google' | 'bing' | 'startpage' | 'ecosia'
  theme: 'dark' | 'light' | 'system'
  defaultZoom?: number
  blockTrackers?: boolean
  blockAds?: boolean
  enableFingerprintProtection?: boolean
  homePage?: string
  language?: string
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
      newWindow: () => Promise<void>

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
      importBookmarks: () => Promise<number>

      getDownloads: () => Promise<DownloadInfo[]>
      onDownloadStarted: (cb: (info: DownloadInfo) => void) => () => void
      onDownloadUpdated: (cb: (info: DownloadInfo) => void) => () => void
      onDownloadDone: (cb: (info: DownloadInfo) => void) => () => void

      getWebviewPreloadPath: () => Promise<string>

      getSettings: () => Promise<AppSettings>
      setSetting: (key: string, value: unknown) => Promise<void>

      listExtensions: () => Promise<ExtensionInfo[]>
      installExtension: () => Promise<ExtensionInfo | null>
      removeExtension: (id: string) => Promise<void>

      onPermissionRequest: (cb: (data: { domain: string; permission: string }) => void) => () => void
      getSitePermissions: (domain: string) => Promise<Record<string, string>>
      setSitePermission: (domain: string, permission: string, status: string) => Promise<void>
      clearPermissions: () => Promise<void>
    }
  }
}
