import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useBrowser } from '../store/BrowserContext'

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return 'mogulus://home'
  if (trimmed === 'mogulus://home') return trimmed

  // Looks like a URL with a protocol
  if (/^[a-z]+:\/\//i.test(trimmed)) return trimmed

  // Looks like a domain (contains dot, no spaces)
  if (!trimmed.includes(' ') && trimmed.includes('.')) {
    return `https://${trimmed}`
  }

  // Treat as search
  return `https://search.brave.com/search?q=${encodeURIComponent(trimmed)}`
}

export default function NavigationBar() {
  const { activeTab, navigateTo, addTab } = useBrowser()
  const [inputVal, setInputVal] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayUrl = activeTab?.url === 'mogulus://home' ? '' : (activeTab?.url ?? '')

  useEffect(() => {
    if (!focused) setInputVal(displayUrl)
  }, [displayUrl, focused])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const url = normalizeUrl(inputVal)
      navigateTo(url)
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setInputVal(displayUrl)
      inputRef.current?.blur()
    }
  }

  const handleFocus = () => {
    setFocused(true)
    setInputVal(displayUrl)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleBlur = () => {
    setFocused(false)
    setInputVal(displayUrl)
  }

  const webviewRef = (window as any).__activeWebview as Electron.WebviewTag | null

  const goBack = () => webviewRef?.canGoBack() && webviewRef.goBack()
  const goForward = () => webviewRef?.canGoForward() && webviewRef.goForward()
  const reload = () => {
    if (activeTab?.isLoading) {
      webviewRef?.stop()
    } else {
      webviewRef?.reload()
    }
  }

  return (
    <nav className="navbar">
      <div className="nav-controls">
        <NavButton onClick={goBack} disabled={!activeTab?.canGoBack} title="Back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </NavButton>
        <NavButton onClick={goForward} disabled={!activeTab?.canGoForward} title="Forward">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </NavButton>
        <NavButton onClick={reload} title={activeTab?.isLoading ? 'Stop' : 'Reload'}>
          {activeTab?.isLoading ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.5 0 2.9.6 3.9 1.6L13.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 6h3.5V2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </NavButton>
      </div>

      <div className={`url-bar ${focused ? 'url-bar--focused' : ''}`}>
        {!focused && activeTab?.url && activeTab.url !== 'mogulus://home' && (
          <span className="url-lock">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4 5V3.5a2 2 0 1 1 4 0V5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </span>
        )}
        <input
          ref={inputRef}
          className="url-input"
          value={focused ? inputVal : displayUrl}
          onChange={e => setInputVal(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search or enter address"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      <div className="nav-actions">
        <NavButton onClick={() => addTab()} title="New tab">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </NavButton>
      </div>
    </nav>
  )
}

function NavButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button className="nav-btn" onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  )
}
