import React from 'react'
import { useBrowser } from '../store/BrowserContext'
import { Tab } from '../store/browserStore'

export default function TabBar() {
  const { tabs, activeTabId, setActiveTabId, addTab, closeTab } = useBrowser()

  return (
    <div className="tabbar">
      <div className="tabs-scroll">
        {tabs.map(tab => (
          <TabItem
            key={tab.id}
            tab={tab}
            active={tab.id === activeTabId}
            onClick={() => setActiveTabId(tab.id)}
            onClose={() => closeTab(tab.id)}
          />
        ))}
      </div>
      <button className="tab-new" onClick={() => addTab()} title="New tab">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

function TabItem({
  tab,
  active,
  onClick,
  onClose,
}: {
  tab: Tab
  active: boolean
  onClick: () => void
  onClose: () => void
}) {
  return (
    <div className={`tab ${active ? 'tab--active' : ''}`} onClick={onClick}>
      {tab.isLoading ? (
        <span className="tab-spinner" />
      ) : tab.favicon ? (
        <img className="tab-favicon" src={tab.favicon} alt="" width={14} height={14} />
      ) : (
        <svg className="tab-icon-default" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M4 7h6M7 4v6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
        </svg>
      )}
      <span className="tab-title">{tab.title || 'New Tab'}</span>
      <button
        className="tab-close"
        onClick={e => { e.stopPropagation(); onClose() }}
        title="Close tab"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
