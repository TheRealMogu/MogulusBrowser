import React, { useState, useEffect } from 'react'
import type { AppSettings } from '../types/electron'

const SEARCH_ENGINES = [
  { value: 'brave', label: 'Brave Search' },
  { value: 'duckduckgo', label: 'DuckDuckGo' },
  { value: 'google', label: 'Google' },
  { value: 'bing', label: 'Bing' },
  { value: 'startpage', label: 'Startpage' },
  { value: 'ecosia', label: 'Ecosia' },
] as const

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<Partial<AppSettings>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    window.electronAPI?.getSettings().then(s => {
      setSettings(s)
      setLoaded(true)
    })
  }, [])

  const update = async (key: keyof AppSettings, value: unknown) => {
    await window.electronAPI?.setSetting(key, value)
    setSettings(prev => ({ ...prev, [key]: value }))
    if (key === 'theme') {
      document.documentElement.setAttribute('data-theme', value as string)
    }
  }

  if (!loaded) return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      </div>
    </div>
  )

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <h3 className="settings-section-title">Search Engine</h3>
            <div className="settings-radio-group">
              {SEARCH_ENGINES.map(({ value, label }) => (
                <label key={value} className="settings-radio-item">
                  <input
                    type="radio"
                    name="searchEngine"
                    value={value}
                    checked={settings.searchEngine === value}
                    onChange={() => update('searchEngine', value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3 className="settings-section-title">Appearance</h3>
            <div className="settings-radio-group settings-radio-group--row">
              {(['dark', 'light', 'system'] as const).map(t => (
                <label key={t} className="settings-radio-item">
                  <input type="radio" name="theme" value={t} checked={settings.theme === t} onChange={() => update('theme', t)} />
                  <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3 className="settings-section-title">DNS over HTTPS</h3>
            <div className="settings-radio-group settings-radio-group--row">
              {(['cloudflare', 'quad9', 'off'] as const).map(p => (
                <label key={p} className="settings-radio-item">
                  <input type="radio" name="doh" value={p} checked={settings.dohProvider === p} onChange={() => update('dohProvider', p)} />
                  <span>{p === 'off' ? 'Off' : p.charAt(0).toUpperCase() + p.slice(1)}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3 className="settings-section-title">Privacy</h3>
            <label className="settings-checkbox-item">
              <input type="checkbox" checked={!!settings.clearOnClose} onChange={e => update('clearOnClose', e.target.checked)} />
              <span>Clear browsing data on close</span>
            </label>
            <label className="settings-checkbox-item">
              <input type="checkbox" checked={!!settings.enableFingerprintProtection} onChange={e => update('enableFingerprintProtection', e.target.checked)} />
              <span>Enable fingerprint protection</span>
            </label>
          </section>

          <section className="settings-section">
            <h3 className="settings-section-title">About</h3>
            <button className="settings-btn" onClick={async () => {
              const v = await window.electronAPI?.getVersion()
              alert(`Mogulus Browser v${v}`)
            }}>
              Check Version
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
