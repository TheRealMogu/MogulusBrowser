import React, { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '../types/electron'

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error'

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
  const [version, setVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [updateVersion, setUpdateVersion] = useState('')
  const [updatePercent, setUpdatePercent] = useState(0)
  const [updateError, setUpdateError] = useState('')

  useEffect(() => {
    window.electronAPI?.getSettings().then(s => { setSettings(s); setLoaded(true) })
    window.electronAPI?.getVersion().then(v => setVersion(v))
  }, [])

  useEffect(() => {
    const unlisten = [
      window.electronAPI?.onUpdateAvailable(info => {
        setUpdateStatus('available')
        setUpdateVersion(info.version)
      }),
      window.electronAPI?.onUpdateNotAvailable(() => setUpdateStatus('up-to-date')),
      window.electronAPI?.onUpdateProgress(p => {
        setUpdateStatus('downloading')
        setUpdatePercent(p.percent)
      }),
      window.electronAPI?.onUpdateDownloaded(info => {
        setUpdateStatus('downloaded')
        setUpdateVersion(info.version)
      }),
      window.electronAPI?.onUpdateError(msg => {
        setUpdateStatus('error')
        setUpdateError(msg)
      }),
    ]
    return () => { unlisten.forEach(fn => fn?.()) }
  }, [])

  const handleCheckUpdate = useCallback(async () => {
    setUpdateStatus('checking')
    setUpdateError('')
    try { await window.electronAPI?.checkForUpdates() } catch { setUpdateStatus('error') }
  }, [])

  const handleDownload = useCallback(async () => {
    setUpdateStatus('downloading')
    try { await window.electronAPI?.downloadUpdate() } catch { setUpdateStatus('error') }
  }, [])

  const handleInstall = useCallback(() => {
    window.electronAPI?.installUpdate()
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
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Mogulus Browser {version ? `v${version}` : ''}
            </p>

            {updateStatus === 'idle' && (
              <button className="settings-btn" onClick={handleCheckUpdate}>
                Check for Updates
              </button>
            )}
            {updateStatus === 'checking' && (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Checking for updates…</span>
            )}
            {updateStatus === 'up-to-date' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>You are on the latest version.</span>
                <button className="settings-btn" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleCheckUpdate}>
                  Check again
                </button>
              </div>
            )}
            {updateStatus === 'available' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--accent)' }}>Update available: v{updateVersion}</span>
                <button className="settings-btn settings-btn--primary" onClick={handleDownload}>
                  Download Update
                </button>
              </div>
            )}
            {updateStatus === 'downloading' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Downloading… {updatePercent}%</span>
                <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${updatePercent}%`, background: 'var(--accent)', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            {updateStatus === 'downloaded' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--accent)' }}>v{updateVersion} ready to install.</span>
                <button className="settings-btn settings-btn--primary" onClick={handleInstall}>
                  Restart &amp; Install
                </button>
              </div>
            )}
            {updateStatus === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {updateError || 'Update check failed.'}
                </span>
                <button className="settings-btn" onClick={handleCheckUpdate}>Retry</button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
