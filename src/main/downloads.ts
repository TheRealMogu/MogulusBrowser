import { Session, BrowserWindow, DownloadItem } from 'electron'

export interface DownloadInfo {
  id: string
  filename: string
  url: string
  totalBytes: number
  receivedBytes: number
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted'
  savePath: string
  startedAt: number
}

const _downloads = new Map<string, DownloadInfo>()

export function addDownloadHandlers(ses: Session, win: BrowserWindow) {
  ses.on('will-download', (_event, item: DownloadItem) => {
    const id = crypto.randomUUID()
    const buildInfo = (): DownloadInfo => ({
      id,
      filename: item.getFilename(),
      url: item.getURL(),
      totalBytes: item.getTotalBytes(),
      receivedBytes: item.getReceivedBytes(),
      state: 'progressing',
      savePath: item.getSavePath(),
      startedAt: Date.now(),
    })

    const info = buildInfo()
    _downloads.set(id, info)
    win.webContents.send('download:started', info)

    item.on('updated', (_e, state) => {
      const updated: DownloadInfo = {
        ...(_downloads.get(id) ?? info),
        state: state === 'progressing' ? 'progressing' : 'interrupted',
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        savePath: item.getSavePath(),
      }
      _downloads.set(id, updated)
      win.webContents.send('download:updated', updated)
    })

    item.once('done', (_e, state) => {
      const done: DownloadInfo = {
        ...(_downloads.get(id) ?? info),
        state: state as DownloadInfo['state'],
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        savePath: item.getSavePath(),
      }
      _downloads.set(id, done)
      win.webContents.send('download:done', done)
    })
  })
}

export function getAllDownloads(): DownloadInfo[] {
  return Array.from(_downloads.values()).reverse()
}
