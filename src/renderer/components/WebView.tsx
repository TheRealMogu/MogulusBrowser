import React, { useEffect, useRef } from 'react'
import { useBrowser } from '../store/BrowserContext'
import { Tab } from '../store/browserStore'
import HomePage from '../pages/HomePage'

interface WebViewPaneProps {
  tab: Tab
  active: boolean
}

function WebViewPane({ tab, active }: WebViewPaneProps) {
  const { updateTab } = useBrowser()
  const ref = useRef<Electron.WebviewTag>(null)

  useEffect(() => {
    const wv = ref.current
    if (!wv) return

    const onDidStartLoading = () => {
      updateTab(tab.id, { isLoading: true })
    }

    const onDidStopLoading = () => {
      updateTab(tab.id, {
        isLoading: false,
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
        url: wv.getURL(),
        title: wv.getTitle() || wv.getURL(),
      })
    }

    const onPageTitleUpdated = (e: Electron.PageTitleUpdatedEvent) => {
      updateTab(tab.id, { title: e.title })
    }

    const onPageFaviconUpdated = (e: Electron.PageFaviconUpdatedEvent) => {
      if (e.favicons?.[0]) updateTab(tab.id, { favicon: e.favicons[0] })
    }

    const onDidFailLoad = () => {
      updateTab(tab.id, { isLoading: false })
    }

    const onNewWindow = (e: Electron.NewWindowEvent) => {
      e.preventDefault?.()
    }

    wv.addEventListener('did-start-loading', onDidStartLoading)
    wv.addEventListener('did-stop-loading', onDidStopLoading)
    wv.addEventListener('page-title-updated', onPageTitleUpdated as EventListener)
    wv.addEventListener('page-favicon-updated', onPageFaviconUpdated as EventListener)
    wv.addEventListener('did-fail-load', onDidFailLoad)
    wv.addEventListener('new-window', onNewWindow as EventListener)

    return () => {
      wv.removeEventListener('did-start-loading', onDidStartLoading)
      wv.removeEventListener('did-stop-loading', onDidStopLoading)
      wv.removeEventListener('page-title-updated', onPageTitleUpdated as EventListener)
      wv.removeEventListener('page-favicon-updated', onPageFaviconUpdated as EventListener)
      wv.removeEventListener('did-fail-load', onDidFailLoad)
      wv.removeEventListener('new-window', onNewWindow as EventListener)
    }
  }, [tab.id, updateTab])

  // Sync navigation when tab.url changes externally (address bar)
  useEffect(() => {
    const wv = ref.current
    if (!wv) return
    try {
      const current = wv.getURL()
      if (current !== tab.url && tab.url !== 'mogulus://home') {
        wv.loadURL(tab.url)
      }
    } catch {
      // webview not ready yet
    }
  }, [tab.url])

  // Expose ref globally for navbar controls
  useEffect(() => {
    if (active && ref.current) {
      (window as any).__activeWebview = ref.current
    }
    return () => {
      if (active) (window as any).__activeWebview = null
    }
  }, [active])

  if (tab.url === 'mogulus://home') return null

  return (
    <webview
      ref={ref}
      src={tab.url}
      style={{
        width: '100%',
        height: '100%',
        display: active ? 'flex' : 'none',
        border: 'none',
      }}
      // Sandboxed webview — no nodeintegration
      webpreferences="contextIsolation=yes,nodeIntegration=no,sandbox=yes"
      allowpopups={undefined}
    />
  )
}

export default function WebViewContainer() {
  const { tabs, activeTabId, activeTab } = useBrowser()

  return (
    <div className="webview-container">
      {activeTab?.url === 'mogulus://home' && <HomePage />}
      {tabs.map(tab => (
        <WebViewPane key={tab.id} tab={tab} active={tab.id === activeTabId} />
      ))}
    </div>
  )
}
