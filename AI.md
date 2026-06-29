# MogulusBrowser — AI Development Log

Quick reference for AI assistants. Describes what was built, how it works, and where things live.

---

## Stack

| Layer | Tech |
|---|---|
| Shell | Electron 31 (BrowserWindow + webview tag) |
| Renderer | React 18 + TypeScript + Vite 5 |
| Main process | TypeScript → CommonJS via `tsc -p tsconfig.main.json` |
| IPC | contextBridge + ipcMain/ipcRenderer |
| Persistence | JSON files in `app.getPath('userData')` |

---

## Project Structure

```
src/
  main/
    main.ts              Entry point. Sets up window, sessions, IPC, DoH.
    preload.ts           contextBridge exposing electronAPI to renderer.
    ipc.ts               All ipcMain handlers (window, privacy, sessions, history, bookmarks, downloads).
    privacy.ts           Tracker blocking (webRequest), UA spoofing, DNT/GPC headers, per-tab counts.
    sessions.ts          Electron session management, partition naming, download wiring.
    trackerList.ts       ~400 tracker domains + isTrackerDomain() helper.
    history.ts           JSON history store in userData (max 2000 entries).
    bookmarks.ts         JSON bookmarks store in userData.
    downloads.ts         Download tracking via session.on('will-download').
    webview-preload.ts   Runs inside webview pages. Overrides Canvas/WebGL/AudioContext APIs for fingerprint protection.
  renderer/
    App.tsx              Root component: BrowserProvider > BrowserShell (Sidebar + NavBar + WebView).
    store/
      browserStore.ts    All browser state + actions (useBrowserStore hook).
      BrowserContext.tsx React context wrapping browserStore.
    components/
      Sidebar.tsx        Left sidebar: view switcher, workspaces, tabs/bookmarks/history/downloads panels, split toggle.
      NavigationBar.tsx  Top toolbar: back/fwd/reload, URL bar, bookmark button, shield, downloads button.
      WebView.tsx        Webview mounting for all tabs; split view with drag resize.
      CommandPalette.tsx Cmd+K overlay search across tabs, workspaces, actions, web search.
      PrivacyPanel.tsx   Shield button dropdown showing tracker stats and privacy settings.
      LoadingBar.tsx     Animated top progress bar during page load.
      DownloadPanel.tsx  Download list shown in sidebar Downloads view.
    pages/
      HomePage.tsx       New tab page with clock, search bar, stats, quick links.
    styles/
      global.css         Full design system (~600 lines, dark purple theme).
    types/
      electron.d.ts      window.electronAPI TypeScript types.
    utils/
      url.ts             normalizeUrl, displayUrl, isSecure, HOME_URL.
dist/
  main/                  Compiled main process JS (CommonJS).
  renderer/              Built renderer (Vite output).
release/                 electron-builder output (AppImage, deb, dmg, exe).
assets/
  icons/
    icon.svg             Source SVG icon.
    512x512.png          Generated PNG for electron-builder.
```

---

## Key Concepts

### Security model
- Main window: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false`, `webviewTag: true`
- Webviews: `contextIsolation=no,nodeIntegration=no,sandbox=yes` — needed so webview-preload can override page globals for fingerprint protection
- All webview URLs validated in `web-contents-created` handler (only http/https/about/data/blob allowed)

### Session isolation
- Each workspace uses `session.fromPartition('persist:ws-{id}')` — fully isolated cookies/storage
- Private workspaces use `private-{uuid}` (no `persist:` prefix → in-memory, cleared on close)
- Privacy policy (tracker blocking + UA + headers) applied to each session on creation
- Download handlers attached to each session

### Tracker blocking
- `applyPrivacyToSession()` in `privacy.ts` registers `onBeforeRequest` on the session
- Checks `isTrackerDomain(url)` against ~400-domain blocklist
- Blocked counts routed to correct tab via `webviewTabMap`: `webContentsId → tabId` (registered by renderer after webview dom-ready via IPC)
- Counts pushed to renderer as `tab:tracker-blocked` IPC events

### Fingerprint protection
- `webview-preload.ts` compiled to `dist/main/webview-preload.js`
- Path fetched at startup via `getWebviewPreloadPath()` IPC call
- Renderer sets `preload="file://{path}"` on webview elements
- Overrides: `HTMLCanvasElement.prototype.toDataURL/toBlob` (pixel noise), WebGL `getParameter` (generic vendor/renderer strings), `AudioContext.createAnalyser` (float frequency noise)

### History & Bookmarks
- Both stored as JSON arrays in `app.getPath('userData')/history.json` and `bookmarks.json`
- Loaded at startup via `initHistory()` / `initBookmarks()` in `main.ts`
- History auto-appended on each `did-stop-loading` webview event (skips HOME_URL and about:)
- Bookmarks toggled from bookmark button in URL bar; also removable from sidebar

### Downloads
- `addDownloadHandlers(session, win)` called on every session after creation
- Listens for `session.on('will-download')`, tracks progress via `item.on('updated')` and `item.once('done')`
- Pushes `download:started/updated/done` events to renderer window
- Renderer state in `downloads[]` array; shown in sidebar Downloads tab or as floating panel

### Split view
- `splitTabId` in store: the second tab displayed alongside the active tab
- Set from split button on each tab in sidebar
- `WebView.tsx` detects when `splitTabId !== activeTab.id` and renders two `<split-pane>` divs
- `SplitHandle` component handles mouse drag to resize ratio

### Keyboard shortcuts
- Defined in `useBrowserStore()` keydown listener
- `Cmd+K` — command palette
- `Cmd+T` — new tab
- `Cmd+W` — close tab
- `Cmd+L` — focus URL bar (calls registered focus fn from NavigationBar)
- `Cmd+1-9` — switch to nth tab in current workspace
- `Cmd+Shift+←/→` — switch workspace

### DoH
- `configureDoH('cloudflare')` called before `app.whenReady()` in main.ts
- Appends `--enable-features=DnsOverHttps` to Chromium command line

---

## Build Commands

```bash
npm run dev           # Dev mode (Vite HMR + Electron)
npm run build         # Production build (renderer + main)
npm run start         # Build then run with Electron
npm run pack          # Build + create installer (AppImage on Linux, DMG on mac, NSIS on win)
npm run pack:dir      # Build + create unpackaged dir (fastest, good for testing)
npm run pack:linux    # Linux only
npm run pack:mac      # macOS only
npm run pack:win      # Windows only
```

Outputs go to `release/`.

---

## Electron Binary

The Electron binary is cached at `~/.cache/electron/`. If network is restricted:

1. `ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install`
2. Download `electron-v{version}-linux-x64.zip` manually
3. Get SHA256 hash of the zip
4. Place at `~/.cache/electron/{hash}/electron-v{version}-linux-x64.zip`
5. `node node_modules/electron/install.js`

---

## What Was Built (Chronological)

1. **Initial browser** — BrowserWindow + webview + React, URL bar, tabs, session, home page, basic security
2. **Privacy engine** — Tracker blocklist (400 domains), UA spoofing, DNT/GPC, DoH, per-workspace sessions, clear-on-close, private workspaces, tracker count in UI
3. **UI redesign** — Arc-style vertical sidebar, workspaces with colored pills, Command Palette (Cmd+K), privacy shield panel, loading bar, adaptive theme-color, enhanced home page, cross-platform window controls
4. **Feature set** — Keyboard shortcuts (Cmd+L, Cmd+1-9), split view with drag resize, history (JSON), bookmarks (JSON), canvas/WebGL/audio fingerprint protection, download manager
