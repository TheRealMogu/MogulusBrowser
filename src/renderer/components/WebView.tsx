import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useBrowser } from '../store/BrowserContext'
import { Tab } from '../store/browserStore'
import HomePage from '../pages/HomePage'
import FindBar from './FindBar'
import ReadingMode from './ReadingMode'

interface PaneProps {
  tab: Tab
  isActive: boolean
  workspaceId: string
  webviewPreloadPath: string
}

function WebViewPane({ tab, isActive, workspaceId, webviewPreloadPath }: PaneProps) {
  const { updateTab, setWebviewRef, addToHistory } = useBrowser()
  const ref = useRef<Electron.WebviewTag>(null)
  const registeredRef = useRef(false)

  const registerWebview = useCallback(() => {
    const wv = ref.current
    if (!wv || registeredRef.current) return
    const wcId = wv.getWebContentsId()
    if (wcId) {
      window.electronAPI?.registerTabWebview(tab.id, wcId)
      registeredRef.current = true
    }
  }, [tab.id])

  useEffect(() => {
    const wv = ref.current
    if (!wv) return

    const onDomReady = () => {
      registerWebview()
      wv.executeJavaScript(
        `document.querySelector('meta[name="theme-color"]')?.content || ''`
      ).then((color: string) => {
        if (color) updateTab(tab.id, { themeColor: color }, workspaceId)
      }).catch(() => {})
    }

    const onStartLoading = () => {
      updateTab(tab.id, { isLoading: true, themeColor: undefined }, workspaceId)
      window.electronAPI?.resetTrackerCount(tab.id)
    }

    const onStopLoading = () => {
      if (!wv) return
      const url = wv.getURL()
      const title = wv.getTitle() || url
      updateTab(tab.id, {
        isLoading: false,
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
        url,
        title,
      }, workspaceId)
      // Record in history
      if (url && url !== 'about:blank') {
        addToHistory(url, title, tab.favicon || undefined)
      }
    }

    const onTitleUpdate = (e: Electron.PageTitleUpdatedEvent) => {
      updateTab(tab.id, { title: e.title }, workspaceId)
    }

    const onFaviconUpdate = (e: Electron.PageFaviconUpdatedEvent) => {
      if (e.favicons?.[0]) updateTab(tab.id, { favicon: e.favicons[0] }, workspaceId)
    }

    const onFailLoad = () => {
      updateTab(tab.id, { isLoading: false }, workspaceId)
    }

    wv.addEventListener('dom-ready', onDomReady)
    wv.addEventListener('did-start-loading', onStartLoading)
    wv.addEventListener('did-stop-loading', onStopLoading)
    wv.addEventListener('page-title-updated', onTitleUpdate as EventListener)
    wv.addEventListener('page-favicon-updated', onFaviconUpdate as EventListener)
    wv.addEventListener('did-fail-load', onFailLoad)

    return () => {
      wv.removeEventListener('dom-ready', onDomReady)
      wv.removeEventListener('did-start-loading', onStartLoading)
      wv.removeEventListener('did-stop-loading', onStopLoading)
      wv.removeEventListener('page-title-updated', onTitleUpdate as EventListener)
      wv.removeEventListener('page-favicon-updated', onFaviconUpdate as EventListener)
      wv.removeEventListener('did-fail-load', onFailLoad)
    }
  }, [tab.id, workspaceId, updateTab, registerWebview, addToHistory, tab.favicon])

  useEffect(() => {
    const wv = ref.current
    if (!wv || tab.url === 'mogulus://home') return
    try {
      const current = wv.getURL()
      if (current && current !== tab.url) wv.loadURL(tab.url)
    } catch { /* webview not ready */ }
  }, [tab.url])

  useEffect(() => {
    if (isActive && ref.current) setWebviewRef(tab.id, ref.current)
    return () => { if (isActive) setWebviewRef(tab.id, null) }
  }, [isActive, tab.id, setWebviewRef])

  useEffect(() => {
    return () => {
      window.electronAPI?.unregisterTab(tab.id)
      registeredRef.current = false
    }
  }, [tab.id])

  if (tab.url === 'mogulus://home') return null

  const preloadAttr = webviewPreloadPath ? { preload: webviewPreloadPath } : {}

  return (
    <webview
      ref={ref}
      src={tab.url}
      partition={tab.partition}
      style={{
        position: 'absolute',
        inset: 0,
        border: 'none',
        display: isActive ? 'flex' : 'none',
      }}
      // contextIsolation=no to allow preload to override page fingerprinting APIs
      webpreferences="contextIsolation=no,nodeIntegration=no,sandbox=yes"
      {...preloadAttr}
    />
  )
}

// ── Split resize handle ───────────────────────────────────────────────────────

function SplitHandle({ onResize }: { onResize: (dx: number) => void }) {
  const dragging = useRef(false)
  const lastX = useRef(0)

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    lastX.current = e.clientX
    e.preventDefault()
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastX.current
      lastX.current = e.clientX
      onResize(dx)
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [onResize])

  return <div className="split-handle" onMouseDown={onMouseDown} />
}

// ── Context menu ─────────────────────────────────────────────────────────────

interface ContextMenuState {
  x: number
  y: number
  linkUrl?: string
  mediaType?: string
}

function ContextMenuOverlay({ state, onClose, onOpenLinkInNewTab, onFindInPage, onViewSource, onInspectElement }: {
  state: ContextMenuState
  onClose: () => void
  onOpenLinkInNewTab?: () => void
  onFindInPage: () => void
  onViewSource: () => void
  onInspectElement: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(state.x, window.innerWidth - 210),
    top: Math.min(state.y, window.innerHeight - 250),
    zIndex: 9999,
  }

  const items: Array<{ label: string; action: () => void } | 'divider'> = [
    ...(state.linkUrl ? [{ label: 'Open Link in New Tab', action: onOpenLinkInNewTab ?? onClose }, 'divider' as const] : []),
    { label: 'Find in Page (⌘F)', action: onFindInPage },
    { label: 'View Source', action: onViewSource },
    { label: 'Inspect Element', action: onInspectElement },
  ]

  return (
    <div className="context-menu" style={style} ref={menuRef}>
      {items.map((item, i) =>
        item === 'divider'
          ? <div key={i} className="context-menu-divider" />
          : <button key={i} className="context-menu-item" onClick={() => { item.action(); onClose() }}>{item.label}</button>
      )}
    </div>
  )
}

// ── Main container ────────────────────────────────────────────────────────────

export default function WebViewContainer() {
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    activeTab,
    splitTabId,
    webviewPreloadPath,
    openFindBar,
    addTab,
    getActiveWebview,
  } = useBrowser()

  const [splitRatio, setSplitRatio] = useState(0.5) // left pane fraction
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  const handleResize = useCallback((dx: number) => {
    const w = containerRef.current?.clientWidth ?? 800
    setSplitRatio(r => Math.min(0.85, Math.max(0.15, r + dx / w)))
  }, [])

  const allPanes = workspaces.flatMap(ws =>
    ws.tabs.map(tab => ({
      tab,
      workspaceId: ws.id,
      isActive: ws.id === activeWorkspaceId && tab.id === ws.activeTabId,
    }))
  )

  // Wire up context menu on active webview
  useEffect(() => {
    const wv = getActiveWebview()
    if (!wv) return
    const onCtxMenu = (e: Event) => {
      const ev = e as Electron.ContextMenuEvent
      setContextMenu({ x: ev.params.x, y: ev.params.y, linkUrl: ev.params.linkURL || undefined, mediaType: ev.params.mediaType })
    }
    wv.addEventListener('context-menu', onCtxMenu as EventListener)
    return () => wv.removeEventListener('context-menu', onCtxMenu as EventListener)
  }, [activeTab?.id, getActiveWebview])

  const showHome = activeTab?.url === 'mogulus://home'
  const splitTab = splitTabId
    ? activeWorkspace?.tabs.find(t => t.id === splitTabId)
    : null

  const themeColor = activeTab?.themeColor

  if (splitTab && activeTab && splitTab.id !== activeTab.id) {
    // Split view
    const leftPct = `${(splitRatio * 100).toFixed(1)}%`
    const rightPct = `${((1 - splitRatio) * 100).toFixed(1)}%`

    return (
      <div
        ref={containerRef}
        className="webview-area webview-area--split"
        style={themeColor ? { '--tab-theme-color': themeColor } as React.CSSProperties : {}}
      >
        {/* Left pane */}
        <div className="split-pane" style={{ width: leftPct }}>
          {showHome && <HomePage />}
          {allPanes
            .filter(p => p.tab.id === activeTab.id)
            .map(({ tab, workspaceId }) => (
              <WebViewPane
                key={tab.id}
                tab={tab}
                isActive
                workspaceId={workspaceId}
                webviewPreloadPath={webviewPreloadPath}
              />
            ))}
        </div>

        <SplitHandle onResize={handleResize} />

        {/* Right pane */}
        <div className="split-pane" style={{ width: rightPct }}>
          {splitTab.url === 'mogulus://home' ? (
            <HomePage />
          ) : (
            allPanes
              .filter(p => p.tab.id === splitTab.id)
              .map(({ tab, workspaceId }) => (
                <WebViewPane
                  key={tab.id}
                  tab={tab}
                  isActive
                  workspaceId={workspaceId}
                  webviewPreloadPath={webviewPreloadPath}
                />
              ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="webview-area"
      style={themeColor ? { '--tab-theme-color': themeColor } as React.CSSProperties : {}}
    >
      <FindBar />
      {showHome && <HomePage />}
      {allPanes.map(({ tab, workspaceId, isActive }) => (
        <WebViewPane
          key={tab.id}
          tab={tab}
          isActive={isActive}
          workspaceId={workspaceId}
          webviewPreloadPath={webviewPreloadPath}
        />
      ))}
      {activeTab?.isReadingMode && <ReadingMode />}
      {contextMenu && (
        <ContextMenuOverlay
          state={contextMenu}
          onClose={() => setContextMenu(null)}
          onOpenLinkInNewTab={contextMenu.linkUrl ? () => addTab(contextMenu.linkUrl!) : undefined}
          onFindInPage={() => openFindBar()}
          onViewSource={() => getActiveWebview()?.executeJavaScript(`window.location.href='view-source:'+location.href`).catch(()=>{})}
          onInspectElement={() => getActiveWebview()?.openDevTools()}
        />
      )}
    </div>
  )
}
