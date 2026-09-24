import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, screen } from 'electron'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { IPC_CHANNELS, OpenedArgs, SaveRequest, SaveResult, Settings } from '../shared/ipc'
import { decodeBufferPayload, encodeForSave, readFilePayload } from './encoding'
import { buildAppMenu } from './menu'
import { getSettings, getWindowBounds, initSettings, patchSettings, saveWindowBounds } from './settings'

const FILE_DIALOG_FILTERS: Electron.FileFilter[] = [
  { name: '모든 파일', extensions: ['*'] },
  {
    name: '텍스트/코드 파일',
    extensions: [
      'txt', 'md', 'log', 'csv', 'json', 'xml', 'yml', 'yaml', 'ini', 'toml', 'env', 'config', 'properties',
      'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'html', 'htm', 'css', 'scss', 'less', 'vue', 'svelte',
      'sql', 'cs', 'java', 'py', 'rb', 'php', 'go', 'rs', 'kt', 'swift', 'c', 'h', 'cpp', 'hpp',
      'sh', 'ps1', 'psm1', 'bat', 'cmd', 'gradle', 'dockerfile'
    ]
  }
]

const QA_SCREENSHOT_DELAY_MS = 2500
const QA_SCREENSHOT_TIMEOUT_MS = 15000
const BOUNDS_SAVE_DEBOUNCE_MS = 500

let mainWindow: BrowserWindow | null = null
let openedArgsPromise: Promise<OpenedArgs> = Promise.resolve({})

const qaScreenshotPath = parseQaScreenshotPath(process.argv)
const qaSame = process.argv.includes('--qa-same')
const qaMode = qaScreenshotPath !== null
// 렌더러 QA 쿼리 계약: --qa-same은 단독으로도 qa=1을 동반한다(qasame=1만 오는 경우 없음)
const qaQuery: Record<string, string> | null =
  qaSame ? { qa: '1', qasame: '1' } : qaMode ? { qa: '1' } : null

function parseQaScreenshotPath(argv: string[]): string | null {
  const flag = argv.find(a => a.startsWith('--qa-screenshot='))
  if (!flag) return null
  const p = flag.slice('--qa-screenshot='.length).trim()
  return p ? path.resolve(p) : null
}

function extractFilePaths(argv: string[], cwd: string): string[] {
  // dev는 argv[1]이 앱 경로('.') — 패키징 여부로 시작 인덱스가 다르다
  const rest = argv.slice(app.isPackaged ? 1 : 2)
  const files: string[] = []
  for (const arg of rest) {
    if (files.length >= 2) break
    if (!arg || arg.startsWith('--')) continue
    const abs = path.resolve(cwd, arg)
    try {
      if (fs.statSync(abs).isFile()) files.push(abs)
    } catch {
      // 실존 파일이 아닌 인자(크로미움 스위치 등)는 무시
    }
  }
  return files
}

async function readOpenedArgs(filePaths: string[]): Promise<OpenedArgs> {
  const args: OpenedArgs = {}
  if (filePaths[0]) {
    try { args.left = await readFilePayload(filePaths[0]) } catch { /* 읽기 실패 인자는 버린다 */ }
  }
  if (filePaths[1]) {
    try { args.right = await readFilePayload(filePaths[1]) } catch { /* 읽기 실패 인자는 버린다 */ }
  }
  return args
}

function visibleOnSomeDisplay(bounds: Electron.Rectangle): boolean {
  return screen.getAllDisplays().some(d => {
    const a = d.workArea
    return bounds.x < a.x + a.width && bounds.x + bounds.width > a.x &&
      bounds.y < a.y + a.height && bounds.y + bounds.height > a.y
  })
}

function armQaScreenshot(win: BrowserWindow, outPath: string): void {
  const killer = setTimeout(() => app.exit(1), QA_SCREENSHOT_TIMEOUT_MS)
  win.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      void (async () => {
        try {
          const image = await win.webContents.capturePage()
          await fs.promises.mkdir(path.dirname(outPath), { recursive: true })
          await fs.promises.writeFile(outPath, image.toPNG())
          clearTimeout(killer)
          app.exit(0)
        } catch {
          clearTimeout(killer)
          app.exit(1)
        }
      })()
    }, QA_SCREENSHOT_DELAY_MS)
  })
}

function createMainWindow(current: Settings): BrowserWindow {
  const dark = current.theme === 'dark' || (current.theme === 'system' && nativeTheme.shouldUseDarkColors)
  // QA 스크린샷은 창 크기가 결과 픽셀을 좌우하므로 저장 bounds를 무시하고 기본 1440×900 고정
  const saved = qaMode ? undefined : getWindowBounds()
  // 모니터 구성이 바뀌어 화면 밖으로 벗어난 저장 위치는 버린다
  const bounds = saved && visibleOnSomeDisplay(saved) ? saved : undefined

  const win = new BrowserWindow({
    width: bounds?.width ?? 1440,
    height: bounds?.height ?? 900,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 960,
    minHeight: 600,
    show: false,
    title: 'DiffDesk',
    // 첫 페인트 플래시 방지 — 다크 값은 렌더러 --dd-bg(tokens.css)와 동일해야 한다
    backgroundColor: dark ? '#17181d' : '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // preload가 컴파일된 ../shared/ipc.js를 require해야 하므로 sandbox 불가
      sandbox: false
    }
  })

  win.once('ready-to-show', () => win.show())

  let boundsTimer: NodeJS.Timeout | undefined
  const scheduleBoundsSave = (): void => {
    if (qaMode) return
    clearTimeout(boundsTimer)
    boundsTimer = setTimeout(() => saveWindowBounds(win.getNormalBounds()), BOUNDS_SAVE_DEBOUNCE_MS)
  }
  win.on('resize', scheduleBoundsSave)
  win.on('move', scheduleBoundsSave)
  win.on('close', () => {
    clearTimeout(boundsTimer)
    if (!qaMode) saveWindowBounds(win.getNormalBounds())
  })
  win.on('closed', () => {
    mainWindow = null
  })

  // did-finish-load 리스너를 load 시작 전에 걸어 레이스를 차단
  if (qaScreenshotPath) armQaScreenshot(win, qaScreenshotPath)

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    void win.loadURL(qaQuery
      ? `${devUrl}${devUrl.includes('?') ? '&' : '?'}${new URLSearchParams(qaQuery).toString()}`
      : devUrl)
  } else {
    void win.loadFile('dist/index.html', qaQuery ? { query: qaQuery } : undefined)
  }
  return win
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.openFile, async () => {
    const options: Electron.OpenDialogOptions = {
      title: '파일 열기',
      properties: ['openFile'],
      filters: FILE_DIALOG_FILTERS
    }
    const win = mainWindow
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return null
    return readFilePayload(result.filePaths[0])
  })

  ipcMain.handle(IPC_CHANNELS.readPath, (_event, filePath: string) => readFilePayload(filePath))

  ipcMain.handle(IPC_CHANNELS.decodeBuffer, (_event, name: string, buf: ArrayBuffer) =>
    decodeBufferPayload(name, buf)
  )

  ipcMain.handle(IPC_CHANNELS.saveFile, async (_event, req: SaveRequest): Promise<SaveResult | null> => {
    let target = req.path
    if (!target) {
      const options: Electron.SaveDialogOptions = {
        title: '다른 이름으로 저장',
        defaultPath: req.suggestedName || undefined,
        filters: FILE_DIALOG_FILTERS
      }
      const win = mainWindow
      const result = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options)
      if (result.canceled || !result.filePath) return null
      target = result.filePath
    }
    try {
      await fs.promises.writeFile(target, encodeForSave(req.content, req.encoding, req.hadBom))
    } catch {
      throw new Error(`파일을 저장할 수 없습니다: ${target}`)
    }
    return { path: target, name: path.basename(target) }
  })

  ipcMain.handle(IPC_CHANNELS.getSettings, () => getSettings())

  ipcMain.handle(IPC_CHANNELS.patchSettings, (_event, patch: Partial<Settings>) => {
    patchSettings(patch)
  })

  ipcMain.handle(IPC_CHANNELS.getOpenedArgs, () => openedArgsPromise)
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.setAppUserModelId('com.minwoo.diffdesk')

  app.on('second-instance', (_event, argv, workingDirectory) => {
    const win = mainWindow
    if (!win || win.isDestroyed()) return
    if (win.isMinimized()) win.restore()
    win.focus()
    const files = extractFilePaths(argv, workingDirectory)
    if (files.length === 0) return
    void readOpenedArgs(files).then(args => {
      if ((args.left || args.right) && !win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.openFiles, args)
      }
    })
  })

  app.on('window-all-closed', () => app.quit())

  void app.whenReady().then(() => {
    // 창 배경색이 저장 테마를 따라야 하므로 설정 로드(+themeSource 반영)가 창 생성보다 선행
    const current = initSettings()
    registerIpcHandlers()
    Menu.setApplicationMenu(buildAppMenu())
    openedArgsPromise = readOpenedArgs(extractFilePaths(process.argv, process.cwd()))
    mainWindow = createMainWindow(current)
  })
}
