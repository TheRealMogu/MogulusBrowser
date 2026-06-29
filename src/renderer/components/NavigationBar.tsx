import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useBrowser } from '../store/BrowserContext'
import { normalizeUrl, displayUrl, isSecure, HOME_URL } from '../utils/url'
import PrivacyPanel from './PrivacyPanel'
import LoadingBar from './LoadingBar'

export default function NavigationBar() {
  const {
    activeTab,
    activeWorkspace,
    navigateTo,
    getActiveWebview,
    openCommandPalette,
    privacyPanelOpen,
    togglePrivacyPanel,
    closePrivacyPanel,
  } = useBrowser()

  const [inputVal, setInputVal] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isHome = activeTab?.url === HOME_URL
  const rawUrl = isHome ? '' : (activeTab?.url ?? '')
  const shown = focused ? inputVal : displayUrl(rawUrl)
  const secure = !isHome && isSecure(rawUrl)
  const trackers = activeTab?.trackerCount ?? 0

  useEffect(() => {
    if (!focused) setInputVal(rawUrl)
  }, [rawUrl, focused])

  const commit = (val: string) => {
    const url = normalizeUrl(val)
    navigateTo(url)
    inputRef.current?.blur()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit(inputVal)
    if (e.key === 'Escape') { setInputVal(rawUrl); inputRef.current?.blur() }
  }

  const onFocus = () => {
    setFocused(true)
    setInputVal(rawUrl)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const onBlur = () => {
    setFocused(false)
    setInputVal(rawUrl)
  }

  const wv = getActiveWebview()
  const goBack = () => { if (wv?.canGoBack()) wv.goBack() }
  const goForward = () => { if (wv?.canGoForward()) wv.goForward() }
  const reload = () => {
    if (activeTab?.isLoading) wv?.stop()
    else wv?.reload()
  }

  const platform = window.electronAPI?.platform ?? 'linux'
  const isWin = platform === 'win32' || platform === 'linux'

  return (
    <div className="navbar-wrapper">
      <LoadingBar />
      <nav className="navbar">
        {/* Window controls (non-mac) */}
        {isWin && (
          <div className="wc-group">
            <button className="wc-btn" onClick={() => window.electronAPI?.minimize()} title="Minimize">
              <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
            </button>
            <button className="wc-btn" onClick={() => window.electronAPI?.maximize()} title="Maximize">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor"/>
              </svg>
            </button>
            <button className="wc-btn wc-btn--close" onClick={() => window.electronAPI?.close()} title="Close">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Nav buttons */}
        <div className="nav-btns">
          <NavBtn onClick={goBack} disabled={!activeTab?.canGoBack} title="Back (⌘←)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </NavBtn>
          <NavBtn onClick={goForward} disabled={!activeTab?.canGoForward} title="Forward (⌘→)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </NavBtn>
          <NavBtn onClick={reload} title={activeTab?.isLoading ? 'Stop' : 'Reload (⌘R)'}>
            {activeTab?.isLoading ? (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M3 3l9 9M12 3L3 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M12.5 7.5A5 5 0 1 1 7.5 2.5c1.4 0 2.7.56 3.6 1.46L12.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.5 5.5h3V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </NavBtn>
        </div>

        {/* URL bar */}
        <div
          className={`url-bar${focused ? ' url-bar--focused' : ''}`}
          onClick={() => !focused && inputRef.current?.focus()}
        >
          {/* Security / status icon */}
          {!focused && (
            <span className={`url-status ${isHome ? 'url-status--home' : secure ? 'url-status--secure' : 'url-status--insecure'}`}>
              {isHome ? <HomeIcon /> : secure ? <LockIcon /> : <LockOpenIcon />}
            </span>
          )}

          <input
            ref={inputRef}
            className="url-input"
            value={shown}
            onChange={e => setInputVal(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            placeholder="Search or enter address"
            spellCheck={false}
            autoComplete="off"
          />

          {/* Privacy shield button */}
          {!focused && !isHome && (
            <button
              className={`url-privacy-btn${trackers > 0 ? ' url-privacy-btn--active' : ''}${privacyPanelOpen ? ' url-privacy-btn--open' : ''}`}
              onClick={() => togglePrivacyPanel()}
              title={`${trackers} tracker${trackers !== 1 ? 's' : ''} blocked`}
            >
              <ShieldIcon />
              {trackers > 0 && (
                <span className="url-tracker-badge">{trackers > 99 ? '99+' : trackers}</span>
              )}
            </button>
          )}
        </div>

        {/* Command palette button */}
        <NavBtn onClick={openCommandPalette} title="Command Palette (⌘K)">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="1" y="3" width="13" height="2" rx="1" fill="currentColor" opacity="0.7"/>
            <rect x="1" y="7" width="9" height="2" rx="1" fill="currentColor" opacity="0.7"/>
            <rect x="1" y="11" width="11" height="2" rx="1" fill="currentColor" opacity="0.7"/>
          </svg>
        </NavBtn>

        {/* Workspace accent indicator */}
        {activeWorkspace && (
          <div
            className="navbar-ws-dot"
            style={{ background: activeWorkspace.accentColor }}
            title={activeWorkspace.name}
          />
        )}
      </nav>

      {/* Privacy panel dropdown */}
      {privacyPanelOpen && (
        <>
          <div className="pp-backdrop" onClick={closePrivacyPanel} />
          <PrivacyPanel onClose={closePrivacyPanel} />
        </>
      )}
    </div>
  )
}

function NavBtn({
  onClick, disabled, title, children,
}: {
  onClick: () => void; disabled?: boolean; title?: string; children: React.ReactNode
}) {
  return (
    <button className="nav-btn" onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  )
}

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="1.5" y="5.5" width="9" height="6" rx="1.5" stroke="#10b981" strokeWidth="1.2"/>
    <path d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const LockOpenIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="1.5" y="5.5" width="9" height="6" rx="1.5" stroke="#f59e0b" strokeWidth="1.2"/>
    <path d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const HomeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M1 5.5L6 1l5 4.5V11H8V8H4v3H1V5.5z" stroke="#555568" strokeWidth="1.1" strokeLinejoin="round"/>
  </svg>
)

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1L2 3v4c0 2.8 2.2 4.8 5 5 2.8-.2 5-2.2 5-5V3L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M4.5 7l1.5 1.5L9.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
