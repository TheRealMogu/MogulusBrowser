import React, { useState, useRef, useEffect } from 'react'
import { useBrowser } from '../store/BrowserContext'

export default function FindBar() {
  const { getActiveWebview, findBarOpen, closeFindBar } = useBrowser()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState({ activeMatch: 0, matches: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (findBarOpen) {
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 50)
    } else {
      getActiveWebview()?.stopFindInPage('clearSelection')
      setQuery('')
      setResult({ activeMatch: 0, matches: 0 })
    }
  }, [findBarOpen])

  useEffect(() => {
    if (!findBarOpen) return
    const wv = getActiveWebview()
    if (!wv) return
    const onResult = (e: Event) => {
      const ev = e as Electron.FoundInPageEvent
      if (ev.result.finalUpdate) {
        setResult({ activeMatch: ev.result.activeMatchOrdinal ?? 0, matches: ev.result.matches ?? 0 })
      }
    }
    wv.addEventListener('found-in-page', onResult as EventListener)
    return () => wv.removeEventListener('found-in-page', onResult as EventListener)
  }, [findBarOpen, getActiveWebview])

  const doFind = (q: string, forward = true) => {
    const wv = getActiveWebview()
    if (!wv || !q) return
    wv.findInPage(q, { forward, findNext: true })
  }

  const onChange = (q: string) => {
    setQuery(q)
    if (!q) {
      getActiveWebview()?.stopFindInPage('clearSelection')
      setResult({ activeMatch: 0, matches: 0 })
    } else {
      getActiveWebview()?.findInPage(q)
    }
  }

  if (!findBarOpen) return null

  return (
    <div className="find-bar">
      <input
        ref={inputRef}
        className="find-bar-input"
        value={query}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') doFind(query, !e.shiftKey)
          if (e.key === 'Escape') closeFindBar()
        }}
        placeholder="Find in page…"
        spellCheck={false}
      />
      {query && (
        <span className="find-bar-count">
          {result.matches === 0 ? 'No results' : `${result.activeMatch}/${result.matches}`}
        </span>
      )}
      <button className="find-bar-btn" onClick={() => doFind(query, false)} title="Previous (Shift+Enter)">↑</button>
      <button className="find-bar-btn" onClick={() => doFind(query, true)} title="Next (Enter)">↓</button>
      <button className="find-bar-close" onClick={closeFindBar} title="Close (Esc)">✕</button>
    </div>
  )
}
