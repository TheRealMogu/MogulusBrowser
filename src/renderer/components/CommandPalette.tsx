import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useBrowser } from '../store/BrowserContext'
import { normalizeUrl } from '../utils/url'

interface Action {
  id: string
  type: 'tab' | 'action' | 'workspace' | 'search'
  label: string
  subtitle?: string
  icon: React.ReactNode
  onSelect: () => void
}

export default function CommandPalette() {
  const {
    workspaces,
    activeTabs,
    activeWorkspaceId,
    navigateTo,
    addTab,
    setActiveTab,
    setActiveWorkspaceId,
    closeCommandPalette,
  } = useBrowser()

  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const allTabs = workspaces.flatMap(ws =>
    ws.tabs.map(t => ({ ...t, wsName: ws.name, wsId: ws.id }))
  )

  const actions = useMemo<Action[]>(() => {
    const q = query.trim().toLowerCase()
    const results: Action[] = []

    // Tabs
    for (const tab of allTabs) {
      const matches = !q || tab.title.toLowerCase().includes(q) || tab.url.toLowerCase().includes(q)
      if (matches) {
        results.push({
          id: `tab:${tab.id}`,
          type: 'tab',
          label: tab.title || 'New Tab',
          subtitle: tab.wsName + ' · ' + (tab.url === 'mogulus://home' ? 'Home' : tab.url),
          icon: tab.favicon
            ? <img src={tab.favicon} alt="" width={14} height={14} style={{ borderRadius: 2 }} />
            : <TabIcon />,
          onSelect: () => {
            if (tab.wsId !== activeWorkspaceId) setActiveWorkspaceId(tab.wsId)
            setActiveTab(tab.id, tab.wsId)
            closeCommandPalette()
          },
        })
      }
    }

    // Workspaces
    for (const ws of workspaces) {
      const matches = !q || ws.name.toLowerCase().includes(q)
      if (matches) {
        results.push({
          id: `ws:${ws.id}`,
          type: 'workspace',
          label: `Switch to ${ws.name}`,
          subtitle: 'Workspace',
          icon: <span className="cp-ws-dot" style={{ background: ws.accentColor }} />,
          onSelect: () => { setActiveWorkspaceId(ws.id); closeCommandPalette() },
        })
      }
    }

    // Static actions
    const staticActions: Action[] = [
      {
        id: 'action:new-tab',
        type: 'action',
        label: 'New Tab',
        subtitle: '⌘T',
        icon: <PlusIcon />,
        onSelect: () => { addTab(); closeCommandPalette() },
      },
    ]

    for (const a of staticActions) {
      if (!q || a.label.toLowerCase().includes(q)) results.push(a)
    }

    // Web search / URL
    if (q) {
      results.push({
        id: 'search:web',
        type: 'search',
        label: `Search "${query}"`,
        subtitle: 'Brave Search',
        icon: <SearchIcon />,
        onSelect: () => {
          navigateTo(normalizeUrl(query))
          closeCommandPalette()
        },
      })
    }

    return results.slice(0, 12)
  }, [query, workspaces, allTabs, activeWorkspaceId])

  const [selectedIdx, setSelectedIdx] = useState(0)

  useEffect(() => setSelectedIdx(0), [query])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, actions.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      actions[selectedIdx]?.onSelect()
    }
    if (e.key === 'Escape') closeCommandPalette()
  }

  return (
    <div className="cp-overlay" onClick={() => closeCommandPalette()}>
      <div className="cp-panel" onClick={e => e.stopPropagation()}>
        <div className="cp-input-row">
          <SearchIcon />
          <input
            ref={inputRef}
            className="cp-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tabs, workspaces, or enter a URL…"
            spellCheck={false}
            autoComplete="off"
          />
          <kbd className="cp-esc">ESC</kbd>
        </div>

        {actions.length > 0 && (
          <div className="cp-results">
            {actions.map((a, i) => (
              <button
                key={a.id}
                className={`cp-item${i === selectedIdx ? ' cp-item--selected' : ''}`}
                onClick={a.onSelect}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                <span className="cp-item-icon">{a.icon}</span>
                <span className="cp-item-content">
                  <span className="cp-item-label">{a.label}</span>
                  {a.subtitle && <span className="cp-item-subtitle">{a.subtitle}</span>}
                </span>
                <span className={`cp-item-type cp-item-type--${a.type}`}>{a.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const TabIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)
