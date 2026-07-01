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
| Updates | electron-updater 6 (GitHub Releases provider) |

---

## Project Structure

```
src/
  main/
    main.ts              Entry point. Sets up window, sessions, IPC, DoH, updater.
    preload.ts           contextBridge exposing electronAPI to renderer.
    ipc.ts               All ipcMain handlers (window, privacy, sessions, history,
                         bookmarks, downloads, settings, extensions, permissions, updates).
    updater.ts           Auto-updater: initUpdater(), checkForUpdates(), downloadUpdate(),
                         installUpdate(). Sends update:* events to renderer window.
    privacy.ts           Tracker blocking (webRequest), UA spoofing, DNT/GPC headers, per-tab counts.
    sessions.ts          Electron session management, partition naming, download wiring.
    trackerList.ts       ~400 tracker domains + isTrackerDomain() helper.
    history.ts           JSON history store in userData (max 2000 entries).
    bookmarks.ts         JSON bookmarks store in userData.
    downloads.ts         Download tracking via session.on('will-download').
    settings.ts          App settings (searchEngine, theme, dohProvider, clearOnClose, etc.)
    permissions.ts       Per-site permission management (allow/deny/ask per domain).
    extensions.ts        Unpacked Chrome extension loader via session.loadExtension().
    webview-preload.ts   Runs inside webview pages. Overrides Canvas/WebGL/AudioContext for fingerprint protection.
  renderer/
    App.tsx              Root component: BrowserProvider > BrowserShell (Sidebar + NavBar + WebView).
    store/
      browserStore.ts    All browser state + actions (useBrowserStore hook).
      BrowserContext.tsx React context wrapping browserStore.
    components/
      Sidebar.tsx           Left sidebar: view switcher, workspaces, tabs/bookmarks/history/downloads panels, split toggle.
      NavigationBar.tsx     Top toolbar: back/fwd/reload, URL bar, bookmark, shield, find, history, downloads, settings.
      WebView.tsx           Webview mounting for all tabs; split view with drag resize.
      CommandPalette.tsx    Ctrl+K overlay search across tabs, workspaces, actions, web search.
      PrivacyPanel.tsx      Shield button dropdown showing tracker stats and privacy settings.
      SettingsPanel.tsx     Full settings modal: search engine, theme, DoH, privacy, auto-update UI.
      FindBar.tsx           In-page text search bar (shown when findBarOpen is true in store).
      DownloadPanel.tsx     Download list shown in sidebar Downloads view.
      LoadingBar.tsx        Animated top progress bar during page load.
    pages/
      HomePage.tsx       New tab page with clock, search bar, stats, quick links.
    styles/
      global.css         Full design system (~1600 lines, dark purple theme).
    types/
      electron.d.ts      window.electronAPI TypeScript types (includes update API).
    utils/
      url.ts             normalizeUrl, displayUrl, isSecure, HOME_URL.
dist/
  main/                  Compiled main process JS (CommonJS).
  renderer/              Built renderer (Vite output).
release/                 electron-builder output (AppImage, deb, exe, dmg).
assets/
  icons/
    icon.svg             Source SVG icon.
    512x512.png          Generated PNG for electron-builder.
.github/
  workflows/
    release.yml          Multi-platform build + publish workflow (Linux/Windows/Mac in parallel).
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
- Bookmarks importable from Chrome JSON and Netscape HTML formats

### Downloads
- `addDownloadHandlers(session, win)` called on every session after creation
- Listens for `session.on('will-download')`, tracks progress via `item.on('updated')` and `item.once('done')`
- Pushes `download:started/updated/done` events to renderer window
- Renderer state in `downloads[]` array; shown in sidebar Downloads tab

### Split view
- `splitTabId` in store: the second tab displayed alongside the active tab
- Set from split button on each tab in sidebar
- `WebView.tsx` detects when `splitTabId !== activeTab.id` and renders two `<split-pane>` divs
- `SplitHandle` component handles mouse drag to resize ratio

### Keyboard shortcuts
- Defined in `useBrowserStore()` keydown listener
- `Ctrl+K` / `Cmd+K` — command palette
- `Ctrl+T` / `Cmd+T` — new tab
- `Ctrl+W` / `Cmd+W` — close tab
- `Ctrl+L` / `Cmd+L` — focus URL bar
- `Ctrl+F` / `Cmd+F` — find in page
- `Ctrl+1-9` / `Cmd+1-9` — switch to nth tab in current workspace
- `Ctrl+Shift+←/→` / `Cmd+Shift+←/→` — switch workspace

### Auto-updater
- `src/main/updater.ts` wraps `electron-updater`
- `initUpdater(win)` called in `main.ts` after window creation (no-op in dev/unpackaged)
- `autoDownload: false` — user must click to download, not automatic
- `autoInstallOnAppQuit: true` — if downloaded but not installed, installs on next quit
- On startup, checks for updates after 4s delay
- Events sent to renderer: `update:available`, `update:not-available`, `update:progress`, `update:downloaded`, `update:error`
- IPC handlers: `update:check` (invoke), `update:download` (invoke), `update:install` (send)
- UI in `SettingsPanel.tsx` → About section: version, status text, progress bar, action buttons
- Requires `latest-linux.yml` / `latest.yml` / `latest-mac.yml` published to GitHub Releases alongside binaries

### DoH
- `configureDoH('cloudflare')` called before `app.whenReady()` in main.ts
- Appends `--enable-features=DnsOverHttps` to Chromium command line

### IPC handler registration pattern
- `once(channel, handler)` in `ipc.ts` prevents double-registration across multiple windows
- Uses a `handlerSet: Set<string>` to track registered channels
- Per-window listeners (minimize, maximize, close, tracker events) are re-registered and removed on each call

### Settings persistence
- `getSettings()` / `setSetting(key, value)` in `settings.ts`
- Stored in `app.getPath('userData')/settings.json`
- Defaults applied on first run
- `theme` changes apply immediately to `document.documentElement` attribute

---

## Build Commands

```bash
npm run dev           # Dev mode (Vite HMR + Electron)
npm run build         # Production build (renderer + main)
npm run start         # Build then run with Electron
npm run pack          # Build + create installer for current platform
npm run pack:dir      # Build + create unpackaged dir (fastest, good for testing)
npm run pack:linux    # Linux: AppImage + .deb → release/
npm run pack:mac      # macOS: .dmg (x64 + arm64) → release/
npm run pack:win      # Windows: .exe (NSIS x64) → release/
```

---

## Release Process

Releases are published via GitHub Actions (`.github/workflows/release.yml`):

1. Three parallel jobs: `release-linux` (ubuntu-latest), `release-windows` (windows-latest), `release-mac` (macos-latest)
2. Each job runs `npm run build && npx electron-builder --{platform} --publish always`
3. `--publish always` uploads binaries + `latest*.yml` to GitHub Releases (as draft)
4. A final `publish-release` job removes the draft flag once all 3 builds succeed
5. Trigger: push a `v*` tag, or manually via Actions → "Build & Release" → "Run workflow"

The `publish` config in `package.json` build section:
```json
"publish": {
  "provider": "github",
  "owner": "therealmogu",
  "repo": "mogulusbrowser"
}
```

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

### Phase 1 — Initial browser
BrowserWindow + webview + React, URL bar, tabs, session, home page, basic security.

### Phase 2 — Privacy engine
Tracker blocklist (400 domains), UA spoofing, DNT/GPC, DoH, per-workspace sessions, clear-on-close, private workspaces, tracker count in UI.

### Phase 3 — UI redesign
Arc-style vertical sidebar, workspaces with colored pills, Command Palette (Ctrl/Cmd+K), privacy shield panel, loading bar, adaptive theme-color, enhanced home page, cross-platform window controls.

### Phase 4 — Core feature set
Keyboard shortcuts (Ctrl/Cmd+L, 1-9), split view with drag resize, history (JSON, 2000 entries, searchable), bookmarks (JSON, import from Chrome/Firefox), canvas/WebGL/audio fingerprint protection, download manager, extensions loader, permissions manager, settings panel, find-in-page, reading mode.

### Phase 5 — Merge, bug fixes & Linux polish (current)
- Merged feature branch into main (11 conflicted files, resolved via `git checkout --theirs`)
- Removed accidentally committed `~/.cache/electron/electron-v31.7.7-linux-x64.zip` (100MB) from git history using `git filter-repo`
- **UI sizing for Linux readability:**
  - Navbar height: 44px → 52px
  - Base font-size: 13px → 14px
  - Button size: 32×32px → 36×36px (with `flex-shrink: 0`)
  - URL bar height: 32px → 36px, padding: `0 10px` → `0 12px`
  - URL input font: 12.5px → 13.5px
  - Sidebar width: 220px → 240px, rail: 52px → 56px
- **Fixed navbar buttons** (`NavigationBar.tsx`):
  - Downloads button: was toggling unused `downloadPanelOpen` state — now calls `setSidebarView('downloads')` and expands sidebar
  - Added **Find in page** button (magnifier icon, calls `openFindBar`)
  - Added **History** button (clock icon, calls `setSidebarView('history')` and expands sidebar)
  - Active states on Downloads/History buttons reflect current `sidebarView`
  - Fixed Command Palette tooltip: `⌘K` → `Ctrl+K`
  - Fixed Settings tooltip
- **GitHub Actions release workflow** — initially Linux only, upgraded to multi-platform
- **Auto-updater** (electron-updater, v0.1.0):
  - `src/main/updater.ts` — wraps electron-updater, fires on app start (4s delay), `autoDownload: false`
  - IPC: `update:check`, `update:download` (invoke) + `update:install` (send)
  - Preload: `checkForUpdates`, `downloadUpdate`, `installUpdate`, `onUpdate*` listeners
  - `electron.d.ts` — types for all update API methods
  - `SettingsPanel.tsx` About section — version display, check/download/progress bar/install UI
  - `global.css` — `.settings-btn--primary` accent button style
  - `package.json` — `electron-updater` added to dependencies, `publish` config added
  - `.github/workflows/release.yml` — 3 parallel platform jobs + draft-to-publish flow

---

## Known Issues & TODOs

| Area | Issue | Priority |
|---|---|---|
| macOS | Auto-update requires code signing; unsigned app shows Gatekeeper warning | High |
| Linux/Win | Some keyboard shortcuts still use Cmd instead of Ctrl in store | High |
| PiP | No user feedback when Picture-in-Picture finds no video element | Medium |
| Extensions | UI exists but end-to-end testing incomplete | Medium |
| Releases | Version in `package.json` must be bumped manually before each release | Low |
| Windows | No code signing certificate → SmartScreen warning on first run | Low |
| macOS | No Homebrew cask | Low |
| Linux | No AUR package | Low |
