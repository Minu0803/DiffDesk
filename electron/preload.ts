import { contextBridge, ipcRenderer, webUtils } from 'electron'
// IPC_CHANNELS는 값 import → 컴파일된 ../shared/ipc.js를 런타임 require하므로 sandbox:false가 전제
import { IPC_CHANNELS } from '../shared/ipc'
import type {
  DiffDeskApi,
  FilePayload,
  MenuCommand,
  OpenedArgs,
  SaveRequest,
  SaveResult,
  Settings
} from '../shared/ipc'

const initialData: { settings: Settings; background: string } = ipcRenderer.sendSync(IPC_CHANNELS.bootstrapSettings)
const api: DiffDeskApi = {
  initialSettings: initialData.settings,
  initialBackground: initialData.background,
  openFile: (): Promise<FilePayload | null> => ipcRenderer.invoke(IPC_CHANNELS.openFile),

  readPath: (filePath: string): Promise<FilePayload> => ipcRenderer.invoke(IPC_CHANNELS.readPath, filePath),

  decodeBuffer: (name: string, buf: ArrayBuffer): Promise<FilePayload> =>
    ipcRenderer.invoke(IPC_CHANNELS.decodeBuffer, name, buf),

  saveFile: (req: SaveRequest): Promise<SaveResult | null> => ipcRenderer.invoke(IPC_CHANNELS.saveFile, req),

  getPathForFile: (file: File): string => {
    try {
      return webUtils.getPathForFile(file) || ''
    } catch {
      return ''
    }
  },

  getSettings: (): Promise<Settings> => ipcRenderer.invoke(IPC_CHANNELS.getSettings),

  patchSettings: (patch: Partial<Settings>): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.patchSettings, patch),

  getOpenedArgs: (): Promise<OpenedArgs> => ipcRenderer.invoke(IPC_CHANNELS.getOpenedArgs),

  onMenu: (cb: (cmd: MenuCommand) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, cmd: MenuCommand): void => cb(cmd)
    ipcRenderer.on(IPC_CHANNELS.menu, listener)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.menu, listener)
    }
  },

  onOpenFiles: (cb: (args: OpenedArgs) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, args: OpenedArgs): void => cb(args)
    ipcRenderer.on(IPC_CHANNELS.openFiles, listener)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.openFiles, listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
