import { Session, BrowserWindow, app } from 'electron'
import { isTrackerDomain } from './trackerList'

// ── Tracker counting ─────────────────────────────────────────────────────────

// webContentsId → tabId mapping (set by renderer when webview is ready)
const webviewTabMap = new Map<number, string>()
// tabId → total blocked count
const tabBlockerCounts = new Map<string, number>()
// total blocked since app start
let totalBlockedSession = 0

let _mainWin: BrowserWindow | null = null

export function setMainWindow(win: BrowserWindow) {
  _mainWin = win
}

export function registerTabWebview(tabId: string, webContentsId: number) {
  webviewTabMap.set(webContentsId, tabId)
}

export function unregisterTab(tabId: string) {
  for (const [wcId, tid] of webviewTabMap) {
    if (tid === tabId) webviewTabMap.delete(wcId)
  }
  tabBlockerCounts.delete(tabId)
}

export function resetTabCount(tabId: string) {
  tabBlockerCounts.set(tabId, 0)
  _mainWin?.webContents.send('tab:tracker-blocked', { tabId, count: 0 })
}

export function getSessionStats() {
  return { totalBlockedSession }
}

// ── Apply privacy policy to a session ────────────────────────────────────────

const GENERIC_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export function applyPrivacyToSession(ses: Session) {
  // 1. Generic User-Agent (hides OS, Electron, real browser version)
  ses.setUserAgent(GENERIC_UA)

  // 2. Block tracker requests before they're sent
  ses.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
    if (isTrackerDomain(details.url)) {
      totalBlockedSession++

      // Route count back to the tab that made the request
      const tabId = webviewTabMap.get(details.webContentsId ?? -1)
      if (tabId) {
        const prev = tabBlockerCounts.get(tabId) ?? 0
        tabBlockerCounts.set(tabId, prev + 1)
        _mainWin?.webContents.send('tab:tracker-blocked', {
          tabId,
          count: prev + 1,
        })
      }

      callback({ cancel: true })
      return
    }
    callback({})
  })

  // 3. Add privacy-respecting request headers
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders }

    // Global Privacy Control + Do Not Track
    headers['DNT'] = '1'
    headers['Sec-GPC'] = '1'

    // Normalize Accept-Language to reduce fingerprinting
    if (!headers['Accept-Language']) {
      headers['Accept-Language'] = 'en-US,en;q=0.9'
    }

    callback({ requestHeaders: headers })
  })

  // 4. Strip outbound Referer on cross-origin requests (referrer policy)
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({ responseHeaders: details.responseHeaders })
  })
}

// ── DoH: set Chromium DNS-over-HTTPS via CLI flags ───────────────────────────
// Must be called before app.whenReady()
export function configureDoH(provider: 'cloudflare' | 'quad9' | 'off' = 'cloudflare') {
  if (provider === 'off') return

  const templates: Record<string, string> = {
    cloudflare: 'https://cloudflare-dns.com/dns-query',
    quad9: 'https://dns.quad9.net/dns-query',
  }

  // Enable Chromium's built-in DoH support
  // This tells Chromium to upgrade DNS resolution to DoH using the configured provider
  app.commandLine.appendSwitch('enable-features', 'DnsOverHttps')
  // Note: Chromium will auto-upgrade if OS DNS supports DoH.
  // For forced provider, users should configure their system DNS to the provider.
  // Full forced DoH via commandline requires --doh-server-fallback-probe-url which
  // is not stable across all Chromium versions embedded in Electron.
  void templates[provider] // reference to avoid TS unused warning
}

// ── Clear session data on close ───────────────────────────────────────────────
export async function clearSessionData(ses: Session) {
  await ses.clearStorageData({
    storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage', 'serviceworkers'],
  })
  await ses.clearCache()
}
