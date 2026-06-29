import React, { createContext, useContext } from 'react'
import { useBrowserStore, BrowserStore } from './browserStore'

const BrowserContext = createContext<BrowserStore | null>(null)

export function BrowserProvider({ children }: { children: React.ReactNode }) {
  const store = useBrowserStore()
  return <BrowserContext.Provider value={store}>{children}</BrowserContext.Provider>
}

export function useBrowser(): BrowserStore {
  const ctx = useContext(BrowserContext)
  if (!ctx) throw new Error('useBrowser must be used inside BrowserProvider')
  return ctx
}
