import React, { useEffect, useState } from 'react'
import TabBar from './TabBar'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const platform = navigator.userAgent.includes('Mac') ? 'mac' : 'win'

  useEffect(() => {
    if (!window.electronAPI) return
    const unsub = window.electronAPI.onWindowState(state => {
      setIsMaximized(state === 'maximized')
    })
    return unsub
  }, [])

  return (
    <div className="titlebar" data-platform={platform}>
      <div className="titlebar-logo">
        <img src="./icon.svg" alt="Mogulus" width={18} height={18} />
        <span className="titlebar-name">Mogulus</span>
      </div>
      <TabBar />
      {platform === 'win' && (
        <div className="window-controls">
          <button className="wc-btn" onClick={() => window.electronAPI?.minimize()} title="Minimize">
            <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
          </button>
          <button className="wc-btn" onClick={() => window.electronAPI?.maximize()} title={isMaximized ? 'Restore' : 'Maximize'}>
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3 1h6v6M1 3h6v6" stroke="currentColor" strokeWidth="1"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor"/>
              </svg>
            )}
          </button>
          <button className="wc-btn wc-btn--close" onClick={() => window.electronAPI?.close()} title="Close">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
