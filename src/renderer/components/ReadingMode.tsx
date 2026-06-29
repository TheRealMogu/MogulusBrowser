import React, { useState, useEffect } from 'react'
import { useBrowser } from '../store/BrowserContext'

export default function ReadingMode() {
  const { getActiveWebview, activeTab, updateTab, activeWorkspaceId } = useBrowser()
  const [content, setContent] = useState<{ title: string; html: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const isActive = activeTab?.isReadingMode ?? false

  useEffect(() => {
    if (!isActive || !activeTab) { setContent(null); return }
    setLoading(true)
    const wv = getActiveWebview()
    if (!wv) { setLoading(false); return }

    wv.executeJavaScript(`
      (function() {
        var selectors = ['article', 'main', '[role="main"]', '.content', '.article', '#content', '#main', '.post', '.entry'];
        var best = null, bestLen = 0;
        for (var i = 0; i < selectors.length; i++) {
          var el = document.querySelector(selectors[i]);
          if (el) { var len = (el.innerText || '').length; if (len > bestLen) { bestLen = len; best = el; } }
        }
        if (!best || bestLen < 200) best = document.body;
        return JSON.stringify({ title: document.title, html: best ? best.innerHTML : '' });
      })()
    `).then((res: string) => {
      try { setContent(JSON.parse(res)) }
      catch { setContent({ title: activeTab.title, html: '<p>Could not extract content.</p>' }) }
      setLoading(false)
    }).catch(() => {
      setContent({ title: activeTab.title, html: '<p>Could not extract content.</p>' })
      setLoading(false)
    })
  }, [isActive, activeTab?.id])

  if (!isActive) return null

  return (
    <div className="reading-mode">
      <div className="reading-mode-toolbar">
        <span className="reading-mode-label">Reading Mode</span>
        <span className="reading-mode-title">{content?.title ?? activeTab?.title ?? ''}</span>
        <button className="reading-mode-close" onClick={() => {
          if (activeTab) updateTab(activeTab.id, { isReadingMode: false }, activeWorkspaceId)
        }}>
          Exit
        </button>
      </div>
      <div className="reading-mode-scroll">
        {loading ? (
          <div className="reading-mode-loading">Extracting content…</div>
        ) : (
          <div
            className="reading-mode-body"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: content?.html ?? '' }}
          />
        )}
      </div>
    </div>
  )
}
