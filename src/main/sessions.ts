import { session, Session } from 'electron'
import { applyPrivacyToSession, clearSessionData } from './privacy'

// Default workspaces created at startup
export const DEFAULT_WORKSPACES = [
  { id: 'personal', name: 'Personal', color: '#7c5cfc' },
  { id: 'work',     name: 'Work',     color: '#3b82f6' },
  { id: 'play',     name: 'Play',     color: '#10b981' },
]

export function partitionForWorkspace(workspaceId: string): string {
  return `persist:ws-${workspaceId}`
}

export function partitionForPrivate(instanceId: string): string {
  // No "persist:" prefix → in-memory, ephemeral session
  return `private-${instanceId}`
}

const configuredSessions = new Set<string>()

export function getOrCreateSession(partition: string): Session {
  const ses = session.fromPartition(partition)
  if (!configuredSessions.has(partition)) {
    applyPrivacyToSession(ses)
    configuredSessions.add(partition)
  }
  return ses
}

export function setupDefaultSessions() {
  // Pre-configure sessions for all default workspaces
  for (const ws of DEFAULT_WORKSPACES) {
    getOrCreateSession(partitionForWorkspace(ws.id))
  }
  // Also configure the default session (used for the shell UI)
  applyPrivacyToSession(session.defaultSession)
}

// Called on 'before-quit' if user has "clear on close" enabled
export async function clearAllPersistSessions() {
  for (const ws of DEFAULT_WORKSPACES) {
    const ses = session.fromPartition(partitionForWorkspace(ws.id))
    await clearSessionData(ses)
  }
  await clearSessionData(session.defaultSession)
}

// Called when a new workspace is created from the renderer
export function setupWorkspaceSession(partition: string) {
  getOrCreateSession(partition)
}
