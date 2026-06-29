export {}

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

      getSettings: () => Promise<Record<string, unknown>>
      setSetting: (key: string, value: unknown) => Promise<void>
    }
  }
}
