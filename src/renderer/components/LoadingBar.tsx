import React, { useEffect, useRef, useState } from 'react'
import { useBrowser } from '../store/BrowserContext'

export default function LoadingBar() {
  const { activeTab } = useBrowser()
  const isLoading = activeTab?.isLoading ?? false
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isLoading) {
      setProgress(0)
      setVisible(true)

      // Simulate progress: ramp to 85% over ~8s, then hold
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 85) { clearInterval(timerRef.current!); return p }
          // Decelerate as it approaches 85%
          const delta = Math.max(0.3, (85 - p) * 0.06)
          return Math.min(85, p + delta)
        })
      }, 120)
    } else {
      // Complete and fade out
      clearInterval(timerRef.current!)
      setProgress(100)
      fadeRef.current = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    }

    return () => {
      clearInterval(timerRef.current!)
      clearTimeout(fadeRef.current!)
    }
  }, [isLoading])

  if (!visible && progress === 0) return null

  return (
    <div className="loading-bar-track">
      <div
        className={`loading-bar${progress === 100 ? ' loading-bar--done' : ''}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
