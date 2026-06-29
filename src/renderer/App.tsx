import React from 'react'
import { BrowserProvider } from './store/BrowserContext'
import { useBrowser } from './store/BrowserContext'
import Sidebar from './components/Sidebar'
import NavigationBar from './components/NavigationBar'
import WebViewContainer from './components/WebView'
import CommandPalette from './components/CommandPalette'
import SettingsPanel from './components/SettingsPanel'
import './styles/global.css'

function BrowserShell() {
  const {
    commandPaletteOpen,
    activeWorkspace,
    sidebarCollapsed,
    settingsPanelOpen,
    toggleSettings,
  } = useBrowser()

  const accent = activeWorkspace?.accentColor ?? '#7c5cfc'
  const isPrivate = activeWorkspace?.isPrivate ?? false

  return (
    <div
      className="app-shell"
      style={{
        '--accent': accent,
        '--accent-glow': `${accent}30`,
        '--border-focus': `${accent}99`,
      } as React.CSSProperties}
      data-private={isPrivate}
      data-sidebar-collapsed={sidebarCollapsed}
    >
      <Sidebar />
      <div className="content-area">
        <NavigationBar />
        <WebViewContainer />
      </div>
      {commandPaletteOpen && <CommandPalette />}
      {settingsPanelOpen && <SettingsPanel onClose={toggleSettings} />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserProvider>
      <BrowserShell />
    </BrowserProvider>
  )
}
