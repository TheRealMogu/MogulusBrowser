import { useState, useCallback } from 'react'

export interface Tab {
  id: string
  url: string
  title: string
  favicon: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
}

const HOME_URL = 'mogulus://home'

function createTab(url = HOME_URL): Tab {
  return {
    id: crypto.randomUUID(),
    url,
    title: url === HOME_URL ? 'New Tab' : url,
    favicon: '',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
  }
}

const initialTab = createTab()

export function useBrowserStore() {
  const [tabs, setTabs] = useState<Tab[]>([initialTab])
  const [activeTabId, setActiveTabId] = useState<string>(initialTab.id)

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]

  const addTab = useCallback((url = HOME_URL) => {
    const tab = createTab(url)
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
    return tab.id
  }, [])

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      if (prev.length === 1) {
        const fresh = createTab()
        setActiveTabId(fresh.id)
        return [fresh]
      }
      const idx = prev.findIndex(t => t.id === id)
      const next = prev.filter(t => t.id !== id)
      setActiveTabId(cur => {
        if (cur !== id) return cur
        const fallback = next[Math.max(0, idx - 1)]
        return fallback?.id ?? next[0]?.id ?? ''
      })
      return next
    })
  }, [])

  const updateTab = useCallback((id: string, patch: Partial<Tab>) => {
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const navigateTo = useCallback((url: string) => {
    setTabs(prev =>
      prev.map(t =>
        t.id === activeTabId
          ? { ...t, url, isLoading: url !== HOME_URL, title: url === HOME_URL ? 'New Tab' : t.title }
          : t
      )
    )
  }, [activeTabId])

  return {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    addTab,
    closeTab,
    updateTab,
    navigateTo,
    HOME_URL,
  }
}

export type BrowserStore = ReturnType<typeof useBrowserStore>
