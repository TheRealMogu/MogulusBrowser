import React, { useState, KeyboardEvent } from 'react'
import { useBrowser } from '../store/BrowserContext'

const QUICK_LINKS = [
  { label: 'GitHub', url: 'https://github.com', icon: 'GH' },
  { label: 'YouTube', url: 'https://youtube.com', icon: 'YT' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com', icon: 'HN' },
  { label: 'Linear', url: 'https://linear.app', icon: 'LN' },
  { label: 'Figma', url: 'https://figma.com', icon: 'FG' },
  { label: 'Notion', url: 'https://notion.so', icon: 'NO' },
]

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function normalizeUrl(input: string): string {
  const t = input.trim()
  if (!t) return 'mogulus://home'
  if (/^[a-z]+:\/\//i.test(t)) return t
  if (!t.includes(' ') && t.includes('.')) return `https://${t}`
  return `https://search.brave.com/search?q=${encodeURIComponent(t)}`
}

export default function HomePage() {
  const { navigateTo } = useBrowser()
  const [query, setQuery] = useState('')

  const search = () => {
    if (!query.trim()) return
    navigateTo(normalizeUrl(query))
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') search()
  }

  return (
    <div className="home">
      <div className="home-inner">
        <div className="home-hero">
          <div className="home-logo">
            <img src="./icon.svg" alt="Mogulus" width={52} height={52} />
          </div>
          <h1 className="home-greeting">{getGreeting()}</h1>
          <p className="home-tagline">Your browser. Your rules.</p>

          <div className="home-search">
            <svg className="home-search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <input
              className="home-search-input"
              placeholder="Search or enter address…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
              spellCheck={false}
            />
            {query && (
              <button className="home-search-clear" onClick={() => setQuery('')}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <section className="home-quicklinks">
          <h2 className="home-section-title">Quick Access</h2>
          <div className="quicklinks-grid">
            {QUICK_LINKS.map(link => (
              <button
                key={link.url}
                className="quicklink"
                onClick={() => navigateTo(link.url)}
              >
                <span className="quicklink-icon">{link.icon}</span>
                <span className="quicklink-label">{link.label}</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="home-footer">
          <span>Mogulus Browser</span>
          <span className="home-footer-dot">·</span>
          <span>Privacy first. Always.</span>
        </footer>
      </div>
    </div>
  )
}
