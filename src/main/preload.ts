import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  onWindowState: (cb: (state: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, state: string) => cb(state)
    ipcRenderer.on('window:state', handler)
    return () => ipcRenderer.removeListener('window:state', handler)
  },

  getVersion: () => ipcRenderer.invoke('app:version'),
})
