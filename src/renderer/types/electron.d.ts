export {}

declare global {
  interface Window {
    electronAPI: {
      minimize: () => void
      maximize: () => void
      close: () => void
      onWindowState: (cb: (state: string) => void) => () => void
      getVersion: () => Promise<string>
    }
  }
}
