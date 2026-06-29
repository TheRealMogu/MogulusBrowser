import { session, Session, BrowserWindow } from 'electron'
import { applyPrivacyToSession, clearSessionData } from './privacy'
import { addDownloadHandlers } from './downloads'

export const DEFAULT_WORKSPACES = [
  { id: 'personal', name: 'Personal', color: '#7c5cfc' },
  { id: 'work',     name: 'Work',     color: '#3b82f6' },
  { id: 'play',     name: 'Play',     color: '#10b981' },
]

export function partitionForWorkspace(workspaceId: string): string {
  return `persist:ws-${workspaceId}`
}

export function partitionForPrivate(instanceId: string): string {
  return `private-${instanceId}`
}

const configuredSessions = new Set<string>()
let _mainWin: BrowserWindow | null = null

export function setDownloadWindow(win: BrowserWindow) {
  _mainWin = win
}

export function getOrCreateSession(partition: string): Session {
  const ses = session.fromPartition(partition)
  if (!configuredSessions.has(partition)) {
    applyPrivacyToSession(ses)
    if (_mainWin) addDownloadHandlers(ses, _mainWin)
    configuredSessions.add(partition)
  }
  return ses
}

export function setupDefaultSessions(win: BrowserWindow) {
  _mainWin = win
  for (const ws of DEFAULT_WORKSPACES) {
    getOrCreateSession(partitionForWorkspace(ws.id))
  }
  applyPrivacyToSession(session.defaultSession)
  addDownloadHandlers(session.defaultSession, win)
}

export async function clearAllPersistSessions() {
  for (const ws of DEFAULT_WORKSPACES) {
    const ses = session.fromPartition(partitionForWorkspace(ws.id))
    await clearSessionData(ses)
  }
  await clearSessionData(session.defaultSession)
}

export function setupWorkspaceSession(partition: string) {
  getOrCreateSession(partition)
}
