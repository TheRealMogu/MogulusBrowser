import React, { useEffect, useRef, useCallback } from 'react'
import { useBrowser } from '../store/BrowserContext'
import { Tab } from '../store/browserStore'
import HomePage from '../pages/HomePage'

interface PaneProps {
  tab: Tab
  isActive: boolean
  workspaceId: string
}

function WebViewPane({ tab, isActive, workspaceId }: PaneProps) {
  const { updateTab, setWebviewRef, navigateTo } = useBrowser()
  const ref = useRef<Electron.WebviewTag>(null)
  const registeredRef = useRef(false)

  // Register webview with main process for tracker counting
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
      // Extract theme-color meta tag for adaptive UI
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
      updateTab(tab.id, {
        isLoading: false,
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
        url: wv.getURL(),
        title: wv.getTitle() || wv.getURL(),
      }, workspaceId)
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
  }, [tab.id, workspaceId, updateTab, registerWebview])

  // Sync URL changes from address bar to webview
  useEffect(() => {
    const wv = ref.current
    if (!wv || tab.url === 'mogulus://home') return
    try {
      const current = wv.getURL()
      if (current && current !== tab.url) wv.loadURL(tab.url)
    } catch { /* webview not ready */ }
  }, [tab.url])

  // Register/unregister in the ref map as active tab changes
  useEffect(() => {
    if (isActive && ref.current) {
      setWebviewRef(tab.id, ref.current)
    }
    return () => {
      if (isActive) setWebviewRef(tab.id, null)
    }
  }, [isActive, tab.id, setWebviewRef])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.electronAPI?.unregisterTab(tab.id)
      registeredRef.current = false
    }
  }, [tab.id])

  if (tab.url === 'mogulus://home') return null

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
      webpreferences="contextIsolation=yes,nodeIntegration=no,sandbox=yes"
    />
  )
}

export default function WebViewContainer() {
  const { workspaces, activeWorkspaceId, activeWorkspace, activeTab } = useBrowser()

  // Collect all tabs across all workspaces to keep them mounted (preserves state)
  const allPanes = workspaces.flatMap(ws =>
    ws.tabs.map(tab => ({
      tab,
      workspaceId: ws.id,
      isActive: ws.id === activeWorkspaceId && tab.id === ws.activeTabId,
    }))
  )

  const showHome = activeTab?.url === 'mogulus://home'

  // Adaptive theme color for the current tab
  const themeColor = activeTab?.themeColor

  return (
    <div
      className="webview-area"
      style={themeColor ? { '--tab-theme-color': themeColor } as React.CSSProperties : {}}
    >
      {showHome && <HomePage />}
      {allPanes.map(({ tab, workspaceId, isActive }) => (
        <WebViewPane key={tab.id} tab={tab} isActive={isActive} workspaceId={workspaceId} />
      ))}
    </div>
  )
}
