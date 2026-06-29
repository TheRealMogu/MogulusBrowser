import React, { useState, useEffect } from 'react'
import type { ExtensionInfo } from '../types/electron'

export default function ExtensionsPanel() {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const list = await window.electronAPI?.listExtensions()
    if (list) setExtensions(list)
  }

  useEffect(() => { load() }, [])

  const install = async () => {
    setLoading(true)
    setError(null)
    try {
      const ext = await window.electronAPI?.installExtension()
      if (ext) await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Installation failed')
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    await window.electronAPI?.removeExtension(id)
    await load()
  }

  return (
    <div className="sidebar-panel">
      <div className="sidebar-panel-header">
        <span>Extensions</span>
        <button className="sidebar-panel-action" onClick={install} disabled={loading}>
          {loading ? '…' : '+ Install'}
        </button>
      </div>
      {error && <p className="sidebar-panel-error">{error}</p>}
      {extensions.length === 0 ? (
        <p className="sidebar-panel-empty">No extensions installed.<br/>Click <strong>Install</strong> to add an unpacked Chrome extension folder.</p>
      ) : (
        <div className="sidebar-panel-list">
          {extensions.map(ext => (
            <div key={ext.id} className="sidebar-panel-item" title={ext.id}>
              <div className="ext-icon-placeholder" />
              <div className="sidebar-panel-item-info">
                <span className="sidebar-panel-item-title">{ext.name}</span>
                <span className="sidebar-panel-item-meta">v{ext.version}</span>
              </div>
              <button
                className="sidebar-panel-item-remove"
                onClick={e => { e.stopPropagation(); remove(ext.id) }}
                title="Remove extension"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
