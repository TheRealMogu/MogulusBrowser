import React from 'react'
import type { DownloadInfo } from '../types/electron'

interface Props {
  downloads: DownloadInfo[]
}

export default function DownloadPanel({ downloads }: Props) {
  if (downloads.length === 0) {
    return (
      <div className="sidebar-panel">
        <div className="sidebar-panel-header"><span>Downloads</span></div>
        <p className="sidebar-panel-empty">No downloads yet.</p>
      </div>
    )
  }

  return (
    <div className="sidebar-panel">
      <div className="sidebar-panel-header">
        <span>Downloads</span>
        <span className="sidebar-panel-count">{downloads.length}</span>
      </div>
      <div className="sidebar-panel-list">
        {downloads.map(dl => (
          <DownloadItem key={dl.id} dl={dl} />
        ))}
      </div>
    </div>
  )
}

function DownloadItem({ dl }: { dl: DownloadInfo }) {
  const pct = dl.totalBytes > 0
    ? Math.round((dl.receivedBytes / dl.totalBytes) * 100)
    : 0

  const fmtBytes = (b: number) => {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / 1024 / 1024).toFixed(1)} MB`
  }

  const stateLabel: Record<DownloadInfo['state'], string> = {
    progressing: `${pct}%`,
    completed: 'Done',
    cancelled: 'Cancelled',
    interrupted: 'Failed',
  }

  return (
    <div className={`dl-item dl-item--${dl.state}`}>
      <div className="dl-item-name" title={dl.filename}>{dl.filename}</div>
      {dl.state === 'progressing' && dl.totalBytes > 0 && (
        <div className="dl-progress-bar">
          <div className="dl-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="dl-item-meta">
        <span>{stateLabel[dl.state]}</span>
        {dl.totalBytes > 0 && (
          <span>{fmtBytes(dl.receivedBytes)} / {fmtBytes(dl.totalBytes)}</span>
        )}
      </div>
    </div>
  )
}
