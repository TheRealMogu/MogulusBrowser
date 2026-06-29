import React, { useState } from 'react'
import { useBrowser } from '../store/BrowserContext'
import { Tab, Workspace, SidebarView } from '../store/browserStore'
import type { Bookmark, HistoryEntry } from '../types/electron'
import DownloadPanel from './DownloadPanel'

export default function Sidebar() {
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeTabs,
    activeTab,
    setActiveTab,
    addTab,
    closeTab,
    pinTab,
    sidebarCollapsed,
    sidebarView,
    setSidebarView,
    toggleSidebar,
    addWorkspace,
    closeWorkspace,
    bookmarks,
    history,
    navigateTo,
    toggleBookmark,
    clearAllHistory,
    downloads,
    downloadPanelOpen,
    closeDownloadPanel,
    splitTabId,
    setSplitTabId,
    HOME_URL,
  } = useBrowser()

  const isMac = window.electronAPI?.platform === 'darwin'

  const pinnedTabs = activeTabs.filter(t => t.isPinned)
  const regularTabs = activeTabs.filter(t => !t.isPinned)

  const openInTab = (url: string) => {
    addTab(url)
    setSidebarView('tabs')
  }

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' sidebar--collapsed' : ''}`}>
      {/* ── Header ── */}
      <div className={`sidebar-header${isMac ? ' sidebar-header--mac' : ''}`}>
        <div className="sidebar-logo">
          <img src="./icon.svg" alt="Mogulus" width={20} height={20} />
          {!sidebarCollapsed && <span className="sidebar-brand">Mogulus</span>}
        </div>
        <button className="sidebar-toggle" onClick={toggleSidebar} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            {sidebarCollapsed ? (
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
      </div>

      {/* ── View switcher (icon rail) ── */}
      {!sidebarCollapsed && (
        <div className="sidebar-view-switcher">
          <ViewBtn icon="tabs"      active={sidebarView === 'tabs'}      label="Tabs"      onClick={() => setSidebarView('tabs')} />
          <ViewBtn icon="bookmarks" active={sidebarView === 'bookmarks'} label="Bookmarks" onClick={() => setSidebarView('bookmarks')} />
          <ViewBtn icon="history"   active={sidebarView === 'history'}   label="History"   onClick={() => setSidebarView('history')} />
          <ViewBtn icon="downloads" active={sidebarView === 'downloads'} label="Downloads" onClick={() => setSidebarView('downloads')} />
        </div>
      )}

      {/* ── Workspaces ── */}
      <div className="sidebar-workspaces">
        {workspaces.map(ws => (
          <WorkspaceItem
            key={ws.id}
            ws={ws}
            active={ws.id === activeWorkspaceId}
            collapsed={sidebarCollapsed}
            onClick={() => setActiveWorkspaceId(ws.id)}
            onClose={workspaces.length > 1 ? () => closeWorkspace(ws.id) : undefined}
          />
        ))}
        {!sidebarCollapsed && (
          <button className="workspace-add" onClick={() => addWorkspace('New Space')} title="New workspace">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>New Space</span>
          </button>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* ── Content views ── */}
      {(sidebarView === 'tabs' || sidebarCollapsed) && (
        <>
          {pinnedTabs.length > 0 && (
            <div className="sidebar-section">
              {!sidebarCollapsed && <span className="sidebar-section-label">Pinned</span>}
              <div className="sidebar-tabs">
                {pinnedTabs.map(tab => (
                  <SidebarTab key={tab.id} tab={tab} active={tab.id === activeTab?.id}
                    collapsed={sidebarCollapsed} onClick={() => setActiveTab(tab.id)}
                    onClose={() => closeTab(tab.id)} onPin={() => pinTab(tab.id)}
                    isSplit={tab.id === splitTabId}
                    onSplit={() => setSplitTabId(tab.id === splitTabId ? null : tab.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="sidebar-tabs-scroll">
            <div className="sidebar-tabs">
              {regularTabs.map(tab => (
                <SidebarTab key={tab.id} tab={tab} active={tab.id === activeTab?.id}
                  collapsed={sidebarCollapsed} onClick={() => setActiveTab(tab.id)}
                  onClose={() => closeTab(tab.id)} onPin={() => pinTab(tab.id)}
                  isSplit={tab.id === splitTabId}
                  onSplit={() => setSplitTabId(tab.id === splitTabId ? null : tab.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {sidebarView === 'bookmarks' && !sidebarCollapsed && (
        <BookmarksPanel
          bookmarks={bookmarks}
          onOpen={openInTab}
          onRemove={(bm) => toggleBookmark(bm.url, bm.title, bm.favicon)}
        />
      )}

      {sidebarView === 'history' && !sidebarCollapsed && (
        <HistoryPanel
          history={history}
          onOpen={openInTab}
          onClear={clearAllHistory}
        />
      )}

      {sidebarView === 'downloads' && !sidebarCollapsed && (
        <DownloadPanel downloads={downloads} />
      )}

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <button className="sidebar-action" onClick={() => addTab()} title="New tab (⌘T)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {!sidebarCollapsed && <span>New Tab</span>}
        </button>
        <button className="sidebar-action sidebar-action--private"
          onClick={() => addWorkspace('Private', '#ef4444', true)}
          title="New private workspace">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {!sidebarCollapsed && <span>Private</span>}
        </button>
      </div>
    </aside>
  )
}

// ── ViewBtn ───────────────────────────────────────────────────────────────────

function ViewBtn({ icon, active, label, onClick }: { icon: string; active: boolean; label: string; onClick: () => void }) {
  const icons: Record<string, React.ReactNode> = {
    tabs: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M1 7h12" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="1" y="1" width="5" height="3" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
    bookmarks: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 1h8a1 1 0 0 1 1 1v11l-5-3-5 3V2a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'}/>
      </svg>
    ),
    history: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7 4v3.5L9.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    downloads: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1 12h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  }
  return (
    <button
      className={`sidebar-view-btn${active ? ' sidebar-view-btn--active' : ''}`}
      onClick={onClick}
      title={label}
    >
      {icons[icon]}
    </button>
  )
}

// ── BookmarksPanel ────────────────────────────────────────────────────────────

function BookmarksPanel({ bookmarks, onOpen, onRemove }: {
  bookmarks: Bookmark[]
  onOpen: (url: string) => void
  onRemove: (bm: Bookmark) => void
}) {
  return (
    <div className="sidebar-panel">
      <div className="sidebar-panel-header">
        <span>Bookmarks</span>
        <span className="sidebar-panel-count">{bookmarks.length}</span>
      </div>
      {bookmarks.length === 0 ? (
        <p className="sidebar-panel-empty">No bookmarks yet.<br/>Click ⭐ in the URL bar to add one.</p>
      ) : (
        <div className="sidebar-panel-list">
          {bookmarks.map(bm => (
            <div key={bm.id} className="sidebar-panel-item" onClick={() => onOpen(bm.url)} title={bm.url}>
              {bm.favicon
                ? <img src={bm.favicon} alt="" width={14} height={14} style={{ borderRadius: 2, flexShrink: 0 }} />
                : <GlobeIcon />
              }
              <span className="sidebar-panel-item-title">{bm.title || bm.url}</span>
              <button className="sidebar-panel-item-remove" onClick={e => { e.stopPropagation(); onRemove(bm) }} title="Remove">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── HistoryPanel ──────────────────────────────────────────────────────────────

function HistoryPanel({ history, onOpen, onClear }: {
  history: HistoryEntry[]
  onOpen: (url: string) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const filtered = query
    ? history.filter(e => e.url.toLowerCase().includes(query.toLowerCase()) || e.title.toLowerCase().includes(query.toLowerCase()))
    : history

  const fmt = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="sidebar-panel">
      <div className="sidebar-panel-header">
        <span>History</span>
        <button className="sidebar-panel-action" onClick={onClear} title="Clear history">Clear</button>
      </div>
      <input
        className="sidebar-panel-search"
        placeholder="Search history…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {filtered.length === 0 ? (
        <p className="sidebar-panel-empty">No history yet.</p>
      ) : (
        <div className="sidebar-panel-list">
          {filtered.map(e => (
            <div key={e.id} className="sidebar-panel-item" onClick={() => onOpen(e.url)} title={e.url}>
              {e.favicon
                ? <img src={e.favicon} alt="" width={14} height={14} style={{ borderRadius: 2, flexShrink: 0 }} />
                : <GlobeIcon />
              }
              <div className="sidebar-panel-item-info">
                <span className="sidebar-panel-item-title">{e.title || e.url}</span>
                <span className="sidebar-panel-item-meta">{fmt(e.visitedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1"/>
  </svg>
)

// ── WorkspaceItem ─────────────────────────────────────────────────────────────

function WorkspaceItem({ ws, active, collapsed, onClick, onClose }: {
  ws: Workspace; active: boolean; collapsed: boolean
  onClick: () => void; onClose?: () => void
}) {
  return (
    <button
      className={`workspace-item${active ? ' workspace-item--active' : ''}${ws.isPrivate ? ' workspace-item--private' : ''}`}
      onClick={onClick}
      title={ws.name}
      style={{ '--ws-color': ws.accentColor } as React.CSSProperties}
    >
      <span className="workspace-dot" style={{ background: ws.accentColor }} />
      {!collapsed && (
        <>
          <span className="workspace-name">{ws.name}</span>
          {ws.isPrivate && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="workspace-private-icon">
              <rect x="1.5" y="4.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1"/>
              <path d="M3 4.5V3.5a2 2 0 1 1 4 0V4.5" stroke="currentColor" strokeWidth="1"/>
            </svg>
          )}
          {onClose && (
            <button className="workspace-close" onClick={e => { e.stopPropagation(); onClose() }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </>
      )}
    </button>
  )
}

// ── SidebarTab ────────────────────────────────────────────────────────────────

function SidebarTab({ tab, active, collapsed, onClick, onClose, onPin, isSplit, onSplit }: {
  tab: Tab; active: boolean; collapsed: boolean
  onClick: () => void; onClose: () => void; onPin: () => void
  isSplit: boolean; onSplit: () => void
}) {
  return (
    <div
      className={`sidebar-tab${active ? ' sidebar-tab--active' : ''}${tab.isPinned ? ' sidebar-tab--pinned' : ''}${isSplit ? ' sidebar-tab--split' : ''}`}
      onClick={onClick}
      title={tab.title}
    >
      <div className="sidebar-tab-icon">
        {tab.isLoading ? (
          <span className="tab-spinner" />
        ) : tab.favicon ? (
          <img src={tab.favicon} alt="" width={14} height={14} style={{ borderRadius: 2 }} />
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        )}
      </div>
      {!collapsed && (
        <>
          <span className="sidebar-tab-title">{tab.title || 'New Tab'}</span>
          {tab.trackerCount > 0 && (
            <span className="sidebar-tab-tracker-badge" title={`${tab.trackerCount} trackers blocked`}>
              {tab.trackerCount > 99 ? '99+' : tab.trackerCount}
            </span>
          )}
          <button
            className={`sidebar-tab-split${isSplit ? ' sidebar-tab-split--active' : ''}`}
            onClick={e => { e.stopPropagation(); onSplit() }}
            title={isSplit ? 'Exit split view' : 'Open in split view'}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1"/>
              <path d="M5 1v8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="sidebar-tab-close" onClick={e => { e.stopPropagation(); onClose() }} title="Close tab">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
