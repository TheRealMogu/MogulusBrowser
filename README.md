# Mogulus Browser

> A personal, modern desktop browser built on Electron + React + TypeScript.  
> Your browser. Your rules.

---

## What is Mogulus?

Mogulus is an opinionated desktop browser designed as a personal productivity tool. It's not trying to replace Chrome — it's built to be **yours**: a foundation for a browser that fits exactly how you think, work, and browse.

Built on Electron with a clean React + TypeScript renderer, Mogulus is a real, functional browser that loads actual websites — with a codebase designed to grow into something genuinely useful.

---

## MVP Features

- **Full web browsing** — real pages via Electron's `<webview>` with sandboxed security
- **Multi-tab management** — open, close, and switch tabs with a polished tab bar
- **Navigation controls** — back, forward, reload/stop with live state
- **Smart address bar** — type a URL, a domain, or a search query (falls back to Brave Search)
- **Dynamic tab titles + favicons** — pulled from the page automatically
- **Custom home page** — greeting, search bar, and quick-access links
- **Window controls** — native on macOS, custom on Windows/Linux
- **Dark theme** — premium dark UI with purple accent palette

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

---

## Architecture

```
src/
├── main/
│   ├── main.ts          # Electron main process — BrowserWindow, security setup
│   ├── ipc.ts           # IPC handlers (window controls, app info)
│   └── preload.ts       # Secure bridge: exposes only what renderer needs
└── renderer/
    ├── main.tsx          # React entry point
    ├── App.tsx           # Root layout
    ├── index.html        # HTML shell
    ├── components/
    │   ├── TitleBar.tsx       # Drag region, logo, tabs, window controls
    │   ├── TabBar.tsx         # Tab strip with add/close
    │   ├── NavigationBar.tsx  # Address bar + back/forward/reload
    │   └── WebView.tsx        # Sandboxed webview per tab
    ├── pages/
    │   └── HomePage.tsx  # New tab / home page
    ├── store/
    │   ├── browserStore.ts    # Tab state, navigation logic (React hooks)
    │   └── BrowserContext.tsx # React context provider
    ├── styles/
    │   └── global.css    # Full design system via CSS custom properties
    └── types/
        └── electron.d.ts # Type bridge for window.electronAPI
```

### Security model

- `contextIsolation: true` — renderer cannot access Node APIs directly
- `nodeIntegration: false` — renderer process has no Node access
- `sandbox=yes` on `<webview>` — content pages are OS-level sandboxed
- Only a minimal, typed API surface is exposed via `contextBridge` in preload
- Dangerous URL schemes (file:, javascript:, etc.) are blocked before navigation

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

> **Note:** Electron downloads its binary (~100MB) on first install. If you're in a restricted network, set `ELECTRON_SKIP_BINARY_DOWNLOAD=1` for the npm install step, then place the binary manually.

### Development

```bash
npm run dev
```

This starts Vite for the renderer (port 5174) and Electron simultaneously via `concurrently`.

### Production build

```bash
npm run build
npm run pack
```

Output goes to `release/`.

---

## URL Bar Behavior

| Input | Resolved To |
|---|---|
| `github.com` | `https://github.com` |
| `https://example.com` | `https://example.com` |
| `search query` | `https://search.brave.com/search?q=...` |
| _(empty)_ | Home page |

---

## Roadmap

The architecture is ready to grow with:

- [ ] **History** — full browsable history with search
- [ ] **Bookmarks** — save and organize pages with tags
- [ ] **Workspaces** — tab groups with named contexts
- [ ] **Sidebar** — notes, reading list, tools panel
- [ ] **Command palette** — keyboard-first navigation (`⌘K`)
- [ ] **Downloads manager** — track and open downloaded files
- [ ] **Smart features** — AI-assisted summaries, focus mode, highlight & save
- [ ] **Plugin-like tools** — custom injected tools per domain

---

## Design System

Colors are defined as CSS custom properties on `:root`:

- `--bg-base` `#0f0f11` — deepest background
- `--bg-surface` `#17171c` — cards, navbar
- `--accent` `#7c5cfc` — primary purple
- `--text-primary` / `--text-secondary` / `--text-muted` — type scale

---

## Design Principles

- **Dark-first** — built for long sessions
- **Keyboard-friendly** — full keyboard navigation planned
- **Minimal chrome** — maximum content area, zero clutter
- **Extensible components** — every UI piece is isolated and replaceable
- **No telemetry** — no analytics, no tracking, no phoning home

---

## License

MIT © TheRealMogu