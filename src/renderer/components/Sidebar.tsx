import React, { useState } from 'react'
import { useBrowser } from '../store/BrowserContext'
import { Tab, Workspace } from '../store/browserStore'

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
    toggleSidebar,
    addWorkspace,
    closeWorkspace,
    HOME_URL,
  } = useBrowser()

  const isMac = window.electronAPI?.platform === 'darwin'
  const [renamingWsId, setRenamingWsId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const pinnedTabs = activeTabs.filter(t => t.isPinned)
  const regularTabs = activeTabs.filter(t => !t.isPinned)

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' sidebar--collapsed' : ''}`}>
      {/* ── Header / Logo ── */}
      <div className={`sidebar-header${isMac ? ' sidebar-header--mac' : ''}`}>
        <div className="sidebar-logo">
          <img src="./icon.svg" alt="Mogulus" width={20} height={20} />
          {!sidebarCollapsed && <span className="sidebar-brand">Mogulus</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            {sidebarCollapsed ? (
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
      </div>

      {/* ── Workspace tabs ── */}
      <div className="sidebar-workspaces">
        {workspaces.map(ws => (
          <WorkspaceItem
            key={ws.id}
            ws={ws}
            active={ws.id === activeWorkspaceId}
            collapsed={sidebarCollapsed}
            onClick={() => setActiveWorkspaceId(ws.id)}
            onClose={workspaces.length > 1 ? () => closeWorkspace(ws.id) : undefined}
            onRename={() => { setRenamingWsId(ws.id); setRenameValue(ws.name) }}
          />
        ))}
        {!sidebarCollapsed && (
          <button
            className="workspace-add"
            onClick={() => addWorkspace('New Space')}
            title="New workspace"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>New Space</span>
          </button>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* ── Pinned tabs ── */}
      {pinnedTabs.length > 0 && (
        <div className="sidebar-section">
          {!sidebarCollapsed && <span className="sidebar-section-label">Pinned</span>}
          <div className="sidebar-tabs">
            {pinnedTabs.map(tab => (
              <SidebarTab
                key={tab.id}
                tab={tab}
                active={tab.id === activeTab?.id}
                collapsed={sidebarCollapsed}
                onClick={() => setActiveTab(tab.id)}
                onClose={() => closeTab(tab.id)}
                onPin={() => pinTab(tab.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Regular tabs ── */}
      <div className="sidebar-tabs-scroll">
        <div className="sidebar-tabs">
          {regularTabs.map(tab => (
            <SidebarTab
              key={tab.id}
              tab={tab}
              active={tab.id === activeTab?.id}
              collapsed={sidebarCollapsed}
              onClick={() => setActiveTab(tab.id)}
              onClose={() => closeTab(tab.id)}
              onPin={() => pinTab(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom actions ── */}
      <div className="sidebar-footer">
        <button
          className="sidebar-action"
          onClick={() => addTab()}
          title="New tab (⌘T)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {!sidebarCollapsed && <span>New Tab</span>}
        </button>
        <button
          className="sidebar-action sidebar-action--private"
          onClick={() => addWorkspace('Private', '#ef4444', true)}
          title="New private workspace"
        >
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

// ── WorkspaceItem ─────────────────────────────────────────────────────────────

function WorkspaceItem({
  ws,
  active,
  collapsed,
  onClick,
  onClose,
  onRename,
}: {
  ws: Workspace
  active: boolean
  collapsed: boolean
  onClick: () => void
  onClose?: () => void
  onRename: () => void
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
            <button
              className="workspace-close"
              onClick={e => { e.stopPropagation(); onClose() }}
            >
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

function SidebarTab({
  tab,
  active,
  collapsed,
  onClick,
  onClose,
  onPin,
}: {
  tab: Tab
  active: boolean
  collapsed: boolean
  onClick: () => void
  onClose: () => void
  onPin: () => void
}) {
  return (
    <div
      className={`sidebar-tab${active ? ' sidebar-tab--active' : ''}${tab.isPinned ? ' sidebar-tab--pinned' : ''}`}
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
            className="sidebar-tab-close"
            onClick={e => { e.stopPropagation(); onClose() }}
            title="Close tab"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
