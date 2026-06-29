import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useBrowser } from '../store/BrowserContext'
import { Tab } from '../store/browserStore'
import HomePage from '../pages/HomePage'

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

// ── Main container ────────────────────────────────────────────────────────────

export default function WebViewContainer() {
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    activeTab,
    splitTabId,
    webviewPreloadPath,
  } = useBrowser()

  const [splitRatio, setSplitRatio] = useState(0.5) // left pane fraction

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
    </div>
  )
}
