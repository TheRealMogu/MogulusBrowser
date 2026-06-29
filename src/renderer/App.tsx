import React from 'react'
import { BrowserProvider } from './store/BrowserContext'
import TitleBar from './components/TitleBar'
import NavigationBar from './components/NavigationBar'
import WebViewContainer from './components/WebView'
import './styles/global.css'

export default function App() {
  return (
    <BrowserProvider>
      <div className="app-shell">
        <TitleBar />
        <NavigationBar />
        <WebViewContainer />
      </div>
    </BrowserProvider>
  )
}
