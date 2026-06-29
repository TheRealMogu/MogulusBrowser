import React, { useState, useEffect, KeyboardEvent } from 'react'
import { useBrowser } from '../store/BrowserContext'
import { normalizeUrl } from '../utils/url'

const DEFAULT_QUICK_LINKS = [
  { id: '1', label: 'GitHub',      url: 'https://github.com',               icon: 'GH' },
  { id: '2', label: 'YouTube',     url: 'https://youtube.com',              icon: 'YT' },
  { id: '3', label: 'Hacker News', url: 'https://news.ycombinator.com',    icon: 'HN' },
  { id: '4', label: 'Linear',      url: 'https://linear.app',              icon: 'LN' },
  { id: '5', label: 'Figma',       url: 'https://figma.com',               icon: 'FG' },
  { id: '6', label: 'Notion',      url: 'https://notion.so',               icon: 'NO' },
]

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5)  return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function timeString(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function HomePage() {
  const { navigateTo, sessionStats, workspaces, activeWorkspaceId, refreshSessionStats, openCommandPalette } = useBrowser()
  const [query, setQuery] = useState('')
  const [time, setTime] = useState(timeString)

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
  const totalTabs = workspaces.reduce((sum, ws) => sum + ws.tabs.length, 0)

  useEffect(() => {
    refreshSessionStats()
    const t = setInterval(() => setTime(timeString()), 10_000)
    return () => clearInterval(t)
  }, [refreshSessionStats])

  const search = () => {
    if (!query.trim()) return
    navigateTo(normalizeUrl(query))
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') search()
  }

  return (
    <div className="home">
      <div className="home-inner">

        {/* ── Hero ── */}
        <div className="home-hero">
          <div className="home-clock">{time}</div>
          <h1 className="home-greeting">{getGreeting()}</h1>
          <p className="home-tagline">Your browser. Your rules.</p>

          <div className="home-search-wrap">
            <svg className="home-search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className="home-search-input"
              placeholder="Search or enter address…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKey}
              autoFocus
              spellCheck={false}
            />
            {query ? (
              <button className="home-search-clear" onClick={() => setQuery('')}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            ) : (
              <kbd className="home-kbd" onClick={openCommandPalette}>⌘K</kbd>
            )}
          </div>
        </div>

        {/* ── Privacy stats ── */}
        <div className="home-stats">
          <StatCard
            value={sessionStats.totalBlockedSession}
            label="Trackers blocked"
            accent="#7c5cfc"
            icon={<ShieldIcon />}
          />
          <StatCard
            value={totalTabs}
            label="Open tabs"
            accent="#3b82f6"
            icon={<TabsIcon />}
          />
          <StatCard
            value={workspaces.length}
            label="Workspaces"
            accent="#10b981"
            icon={<WorkspaceIcon color={activeWorkspace?.accentColor} />}
          />
        </div>

        {/* ── Quick links ── */}
        <section className="home-quicklinks">
          <h2 className="home-section-title">Quick Access</h2>
          <div className="quicklinks-grid">
            {DEFAULT_QUICK_LINKS.map(link => (
              <button
                key={link.id}
                className="quicklink"
                onClick={() => navigateTo(link.url)}
              >
                <span className="quicklink-icon">{link.icon}</span>
                <span className="quicklink-label">{link.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="home-footer">
          <span className="home-footer-brand">Mogulus</span>
          <span className="home-footer-sep">·</span>
          <span>Privacy-first by default</span>
          <span className="home-footer-sep">·</span>
          <span style={{ color: 'var(--text-muted)' }}>DNT on · DoH on · Tracker blocking on</span>
        </footer>
      </div>
    </div>
  )
}

function StatCard({
  value, label, accent, icon,
}: {
  value: number; label: string; accent: string; icon: React.ReactNode
}) {
  return (
    <div className="home-stat-card" style={{ '--stat-accent': accent } as React.CSSProperties}>
      <div className="home-stat-icon">{icon}</div>
      <div className="home-stat-content">
        <span className="home-stat-value">{value.toLocaleString()}</span>
        <span className="home-stat-label">{label}</span>
      </div>
    </div>
  )
}

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 1.5L3 4v5c0 3.5 2.7 6.2 6 7 3.3-.8 6-3.5 6-7V4L9 1.5z" stroke="#7c5cfc" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M6 9l2 2 4-3.5" stroke="#7c5cfc" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TabsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="5" width="14" height="10" rx="2" stroke="#3b82f6" strokeWidth="1.4"/>
    <path d="M2 8h14" stroke="#3b82f6" strokeWidth="1.2"/>
    <path d="M5 5V3.5a1.5 1.5 0 0 1 3 0V5" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const WorkspaceIcon = ({ color = '#10b981' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="5" cy="5" r="3" stroke={color} strokeWidth="1.4"/>
    <circle cx="13" cy="5" r="3" stroke={color} strokeWidth="1.4" opacity="0.6"/>
    <circle cx="9" cy="13" r="3" stroke={color} strokeWidth="1.4" opacity="0.4"/>
  </svg>
)
