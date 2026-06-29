import React, { useEffect, useState } from 'react'
import { useBrowser } from '../store/BrowserContext'
import { isSecure } from '../utils/url'

export default function PrivacyPanel({ onClose }: { onClose: () => void }) {
  const { activeTab, sessionStats, refreshSessionStats } = useBrowser()
  const [settings, setSettings] = useState<Record<string, unknown>>({})

  useEffect(() => {
    refreshSessionStats()
    window.electronAPI?.getSettings().then(s => setSettings(s))
  }, [refreshSessionStats])

  const url = activeTab?.url ?? ''
  const secure = isSecure(url)
  const trackers = activeTab?.trackerCount ?? 0
  const isHome = url === 'mogulus://home'

  const toggleClearOnClose = async () => {
    const next = !settings.clearOnClose
    await window.electronAPI?.setSetting('clearOnClose', next)
    setSettings(s => ({ ...s, clearOnClose: next }))
  }

  return (
    <div className="privacy-panel" onClick={e => e.stopPropagation()}>
      {/* ── Connection status ── */}
      <div className="pp-section">
        <div className="pp-row">
          {isHome ? (
            <>
              <HomeIcon />
              <span className="pp-label">Home page</span>
            </>
          ) : secure ? (
            <>
              <LockIcon color="#10b981" />
              <span className="pp-label pp-label--secure">Connection is secure</span>
            </>
          ) : (
            <>
              <LockOpenIcon color="#f59e0b" />
              <span className="pp-label pp-label--insecure">Connection is not secure</span>
            </>
          )}
        </div>
        {!isHome && (
          <p className="pp-url">
            {url.length > 60 ? url.slice(0, 60) + '…' : url}
          </p>
        )}
      </div>

      <div className="pp-divider" />

      {/* ── Tracker stats ── */}
      <div className="pp-section">
        <div className="pp-row">
          <ShieldIcon />
          <span className="pp-label">Trackers blocked</span>
        </div>
        <div className="pp-stats-row">
          <div className="pp-stat">
            <span className="pp-stat-value">{trackers}</span>
            <span className="pp-stat-label">This page</span>
          </div>
          <div className="pp-stat-sep" />
          <div className="pp-stat">
            <span className="pp-stat-value">{sessionStats.totalBlockedSession}</span>
            <span className="pp-stat-label">This session</span>
          </div>
        </div>
      </div>

      <div className="pp-divider" />

      {/* ── Privacy settings ── */}
      <div className="pp-section">
        <p className="pp-section-title">Privacy settings</p>

        <div className="pp-toggle-row">
          <div>
            <span className="pp-toggle-label">Custom User-Agent</span>
            <span className="pp-toggle-desc">Generic UA hides browser identity</span>
          </div>
          <span className="pp-badge pp-badge--on">ON</span>
        </div>

        <div className="pp-toggle-row">
          <div>
            <span className="pp-toggle-label">DNT + Sec-GPC headers</span>
            <span className="pp-toggle-desc">Signals do-not-track to sites</span>
          </div>
          <span className="pp-badge pp-badge--on">ON</span>
        </div>

        <div className="pp-toggle-row">
          <div>
            <span className="pp-toggle-label">DNS-over-HTTPS</span>
            <span className="pp-toggle-desc">Cloudflare 1.1.1.1</span>
          </div>
          <span className="pp-badge pp-badge--on">ON</span>
        </div>

        <div className="pp-toggle-row">
          <div>
            <span className="pp-toggle-label">Clear on close</span>
            <span className="pp-toggle-desc">Wipes cookies & storage on quit</span>
          </div>
          <button
            className={`pp-toggle-btn${settings.clearOnClose ? ' pp-toggle-btn--on' : ''}`}
            onClick={toggleClearOnClose}
          >
            {settings.clearOnClose ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5L2 3.5v4c0 2.5 2.2 4.5 5 5 2.8-.5 5-2.5 5-5v-4L7 1.5z" stroke="#7c5cfc" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M4.5 7l1.5 1.5L9 5.5" stroke="#7c5cfc" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LockIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2.5" y="6" width="9" height="7" rx="1.5" stroke={color} strokeWidth="1.2"/>
    <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const LockOpenIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2.5" y="6" width="9" height="7" rx="1.5" stroke={color} strokeWidth="1.2"/>
    <path d="M4.5 6V4a2.5 2.5 0 0 1 5 0" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const HomeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1.5 6.5L7 1.5l5.5 5v6H9V9H5v3.5H1.5V6.5z" stroke="#8888a0" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
)
