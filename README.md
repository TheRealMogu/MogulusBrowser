# Mogulus Browser

> A personal, modern desktop browser built on Electron + React + TypeScript.  
> Your browser. Your rules.

---

## What is Mogulus?

Mogulus is an opinionated desktop browser designed as a personal productivity tool. It's not trying to replace Chrome — it's built to be **yours**: a foundation for a browser that fits exactly how you think, work, and browse.

Built on Electron with a clean React + TypeScript renderer, Mogulus is a real, functional browser that loads actual websites — with a codebase designed to grow into something genuinely useful.

---

## Features

### Core browsing
- **Full web browsing** — real pages via Electron's `<webview>` with sandboxed security
- **Multi-tab management** — open, close, and switch tabs with a polished tab bar
- **Navigation controls** — back, forward, reload/stop with live state
- **Smart address bar** — type a URL, a domain, or a search query (configurable search engine)
- **Dynamic tab titles + favicons** — pulled from the page automatically
- **Custom home page** — greeting, search bar, quick-access links and tracker stats
- **Window controls** — native traffic lights on macOS, custom on Windows/Linux

### Privacy & Security
- **Tracker blocking** — ~400-domain blocklist with per-tab blocked count
- **DNS over HTTPS** — Cloudflare or Quad9, configured on startup
- **Fingerprint protection** — Canvas, WebGL and AudioContext noise injection
- **User-Agent spoofing** — sends standard Chrome UA
- **DNT + GPC headers** — Do Not Track and Global Privacy Control
- **Workspace session isolation** — each workspace has its own cookies/storage
- **Private workspaces** — in-memory sessions, cleared on close
- **Clear browsing data on close** — configurable in settings

### Navigation & UI
- **Arc-style vertical sidebar** — collapsible, with rail and full modes
- **Workspaces** — named tab groups with colored pills, persistent across sessions
- **Split view** — two tabs side by side with draggable resize handle
- **Command Palette** — `Ctrl+K` / `Cmd+K` overlay for tabs, actions, web search
- **Find in page** — `Ctrl+F` / `Cmd+F` in-page text search
- **History** — full browsable history with search, stored locally
- **Bookmarks** — save/remove pages, shown in sidebar, import from Chrome/Firefox HTML
- **Download manager** — progress tracking, shown in sidebar Downloads panel
- **Extensions** — load unpacked Chrome extensions (basic support)
- **Privacy shield panel** — per-session tracker stats + quick privacy settings

### Settings
- Search engine: Brave, DuckDuckGo, Google, Bing, Startpage, Ecosia
- Appearance: Dark / Light / System
- DNS over HTTPS: Cloudflare / Quad9 / Off
- Clear on close, fingerprint protection toggles
- **Auto-update** — checks GitHub Releases on startup; download and install in one click

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Command Palette |
| `Ctrl+T` / `Cmd+T` | New tab |
| `Ctrl+W` / `Cmd+W` | Close tab |
| `Ctrl+L` / `Cmd+L` | Focus URL bar |
| `Ctrl+F` / `Cmd+F` | Find in page |
| `Ctrl+1-9` / `Cmd+1-9` | Switch to nth tab |
| `Ctrl+Shift+←/→` / `Cmd+Shift+←/→` | Switch workspace |

---

## Stack

| Layer | Technology |
|---|---|
| Shell | Electron 31 |
| Renderer | React 18 + TypeScript |
| Bundler | Vite 5 |
| State | React hooks (context-based store) |
| Styling | Pure CSS custom properties |
| Build | electron-builder |
| Updates | electron-updater (GitHub Releases) |

---

## Architecture

```
src/
├── main/
│   ├── main.ts              Electron main process — BrowserWindow, security, DoH
│   ├── ipc.ts               All IPC handlers (window, privacy, history, bookmarks, downloads, updates)
│   ├── preload.ts           Secure bridge: exposes only what renderer needs via contextBridge
│   ├── updater.ts           Auto-update logic (electron-updater, GitHub provider)
│   ├── privacy.ts           Tracker blocking, UA spoofing, DNT/GPC, per-tab counts
│   ├── sessions.ts          Electron session management, partition naming, download wiring
│   ├── trackerList.ts       ~400 tracker domains + isTrackerDomain() helper
│   ├── history.ts           JSON history store in userData (max 2000 entries)
│   ├── bookmarks.ts         JSON bookmarks store in userData
│   ├── downloads.ts         Download tracking via session.on('will-download')
│   ├── settings.ts          App settings persistence
│   ├── permissions.ts       Per-site permission management
│   ├── extensions.ts        Unpacked extension loader
│   └── webview-preload.ts   Runs inside webview pages — fingerprint protection overrides
└── renderer/
    ├── App.tsx              Root component: BrowserProvider > BrowserShell
    ├── store/
    │   ├── browserStore.ts  All browser state + actions (useBrowserStore hook)
    │   └── BrowserContext.tsx React context provider
    ├── components/
    │   ├── Sidebar.tsx          Vertical sidebar: tabs, workspaces, bookmarks, history, downloads
    │   ├── NavigationBar.tsx    Top toolbar: back/fwd/reload, URL bar, find, history, downloads, settings
    │   ├── WebView.tsx          Webview mounting for all tabs; split view with drag resize
    │   ├── CommandPalette.tsx   Ctrl+K overlay — tabs, workspaces, actions, search
    │   ├── PrivacyPanel.tsx     Shield dropdown: tracker stats + quick privacy settings
    │   ├── SettingsPanel.tsx    Full settings modal (search engine, theme, DoH, privacy, updates)
    │   ├── FindBar.tsx          In-page search bar
    │   ├── DownloadPanel.tsx    Download list in sidebar
    │   └── LoadingBar.tsx       Animated top progress bar
    ├── pages/
    │   └── HomePage.tsx     New tab page: clock, search bar, stats, quick links
    ├── styles/
    │   └── global.css       Full design system (~1600 lines, dark purple theme)
    └── types/
        └── electron.d.ts    window.electronAPI TypeScript types
```

### Security model

- `contextIsolation: true` — renderer cannot access Node APIs directly
- `nodeIntegration: false` — renderer process has no Node access
- `sandbox=yes` on `<webview>` — content pages are OS-level sandboxed
- Only a minimal, typed API surface is exposed via `contextBridge` in preload
- Dangerous URL schemes (`file:`, `javascript:`, etc.) blocked before navigation

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
git clone https://github.com/therealmogu/mogulusbrowser.git
cd mogulusbrowser
npm install
```

> **Note:** Electron downloads its binary (~100MB) on first install. If you're in a restricted network, set `ELECTRON_SKIP_BINARY_DOWNLOAD=1` for the npm install step, then place the binary manually.

### Development

```bash
npm run dev
```

Starts Vite for the renderer (port 5174) and Electron simultaneously via `concurrently`.

### Production build & package

```bash
npm run pack:linux   # → release/*.AppImage + release/*.deb
npm run pack:win     # → release/*.exe (NSIS installer)
npm run pack:mac     # → release/*.dmg (x64 + arm64)
npm run pack         # current platform
```

Output goes to `release/`.

### Install on Linux (Debian/Ubuntu)

```bash
npm run pack:linux
sudo dpkg -i release/mogulus-browser_*.deb
```

Or run directly without installing:

```bash
./release/Mogulus-*.AppImage
```

---

## Releases & Auto-Update

Releases are built automatically via GitHub Actions when a version tag is pushed.  
Each release publishes: `.AppImage`, `.deb` (Linux), `.exe` (Windows), `.dmg` (macOS), and the `latest*.yml` files required by electron-updater.

To publish a new release:

1. Go to GitHub → **Actions** → **Build & Release** → **Run workflow**
2. Enter the tag (e.g. `v0.2.0`)
3. GitHub builds for all 3 platforms and creates the release

Users with the app already installed will see **"Update available"** in **Settings → About** and can download + install with one click.

---

## URL Bar Behavior

| Input | Resolved To |
|---|---|
| `github.com` | `https://github.com` |
| `https://example.com` | `https://example.com` |
| `search query` | configured search engine |
| _(empty)_ | Home page |

---

## Design System

Colors are defined as CSS custom properties on `:root`:

- `--bg-base` `#0c0c0f` — deepest background
- `--bg-surface` `#141418` — cards, navbar
- `--accent` `#7c5cfc` — primary purple
- `--text-primary` / `--text-secondary` / `--text-muted` — type scale

---

## Roadmap

### In progress / high priority
- [ ] **Mac code signing** — required for seamless auto-update on macOS (currently shows security warning)
- [ ] **Linux keyboard shortcuts** — unify Cmd→Ctrl for all shortcuts on Linux/Windows
- [ ] **PiP feedback** — show user-facing error when Picture-in-Picture has no video to capture
- [ ] **Extension management UI** — list, enable/disable, remove extensions from settings

### Planned features
- [ ] **Custom themes** — user-defined color palettes, CSS variable overrides
- [ ] **Vertical tab strip** — option to show tabs in a compact sidebar column
- [ ] **Tab groups** — color-coded groups within a workspace
- [ ] **Reading mode** — strip page to text + images, comfortable reading font
- [ ] **Notes panel** — persistent sidebar scratchpad per workspace
- [ ] **Custom CSS injection** — per-domain style overrides (userstyles)
- [ ] **Screenshot tool** — capture visible area or full page
- [ ] **Focus / distraction-free mode** — hide UI chrome, block distracting domains
- [ ] **Sync** — optional encrypted sync of bookmarks/history across devices
- [ ] **Password manager** — built-in credential store with autofill
- [ ] **Better ad blocking** — EasyList/uBlock-style filter rule support
- [ ] **Web scraping tools** — extract structured data from pages
- [ ] **AI-assisted features** — page summary, smart search, highlight & save

### Infrastructure
- [ ] **Auto-bump version** — GitHub Action to increment `package.json` version on each release
- [ ] **Signed Windows builds** — code signing certificate for NSIS installer
- [ ] **Homebrew cask** — macOS install via `brew install --cask mogulus`
- [ ] **AUR package** — Arch Linux community package

---

## Design Principles

- **Dark-first** — built for long sessions
- **Keyboard-friendly** — full keyboard navigation
- **Minimal chrome** — maximum content area, zero clutter
- **Extensible components** — every UI piece is isolated and replaceable
- **No telemetry** — no analytics, no tracking, no phoning home

---

## License

MIT © TheRealMogu
