// 메인(electron/)과 렌더러(src/)가 공유하는 IPC 계약.
// 설정 변경은 메인과 렌더러 양쪽에서 함께 검증한다.
import type { ThemePreset } from './themes'

export type PaneSide = 'left' | 'right'

export interface FilePayload {
  /** 빈 문자열 = 디스크 경로 없음(붙여넣기/버퍼 드롭 등) */
  path: string
  name: string
  content: string
  /** iconv-lite 인코딩명: 'utf8' | 'euc-kr' | 'utf16le' 등 */
  encoding: string
  hadBom: boolean
  /** MAX_FILE_BYTES 초과로 앞부분만 읽음 */
  truncated: boolean
}

export interface SaveRequest {
  /** null이면 다른 이름으로 저장 다이얼로그를 띄운다 */
  path: string | null
  content: string
  /** 원본 인코딩 유지 저장. 알 수 없으면 'utf8' */
  encoding: string
  hadBom: boolean
  suggestedName?: string
}

export interface SaveResult {
  path: string
  name: string
}

export type ThemeSetting = 'system' | 'light' | 'dark'

export interface Settings {
  theme: ThemeSetting
  themePreset: ThemePreset | 'legacy'
  renderSideBySide: boolean
  ignoreTrimWhitespace: boolean
  wordWrap: boolean
  /** '' = 파일 확장자 기반 자동 감지 */
  language: string
  fontSize: number
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  themePreset: 'legacy',
  renderSideBySide: true,
  ignoreTrimWhitespace: false,
  wordWrap: false,
  language: '',
  fontSize: 13
}

export type MenuCommand =
  | 'open-left'
  | 'open-right'
  | 'save-focused'
  | 'save-as-left'
  | 'save-as-right'
  | 'next-diff'
  | 'prev-diff'
  | 'copy-all-ltr'
  | 'copy-all-rtl'
  | 'swap'
  | 'clear-all'
  | 'toggle-view'
  | 'toggle-whitespace'
  | 'toggle-wrap'
  | 'cycle-theme'

/** CLI 인자로 받은 파일(최대 2개: 첫 번째=왼쪽, 두 번째=오른쪽) */
export interface OpenedArgs {
  left?: FilePayload
  right?: FilePayload
}

export interface DiffDeskApi {
  /** Preload bootstrap, available before the first renderer paint. */
  initialSettings?: Settings
  initialBackground?: string
  /** 열기 다이얼로그. 취소 시 null */
  openFile(): Promise<FilePayload | null>
  /** 경로 직접 읽기(드래그&드롭). 실패 시 한국어 메시지로 reject */
  readPath(path: string): Promise<FilePayload>
  /** 경로를 얻을 수 없는 드롭 파일의 버퍼 디코딩. path는 ''로 반환 */
  decodeBuffer(name: string, buf: ArrayBuffer): Promise<FilePayload>
  /** 취소 시 null */
  saveFile(req: SaveRequest): Promise<SaveResult | null>
  /** DOM File → 실제 경로. 실패 시 '' (webUtils.getPathForFile 래핑) */
  getPathForFile(file: File): string
  getSettings(): Promise<Settings>
  /** theme 패치는 메인에서 nativeTheme.themeSource에도 반영된다 */
  patchSettings(patch: Partial<Settings>): Promise<void>
  getOpenedArgs(): Promise<OpenedArgs>
  /** 반환값 = 구독 해제 함수 */
  onMenu(cb: (cmd: MenuCommand) => void): () => void
  /** 두 번째 인스턴스 실행 시 그 CLI 파일 인자를 전달받는다 */
  onOpenFiles(cb: (args: OpenedArgs) => void): () => void
}

export const IPC_CHANNELS = {
  bootstrapSettings: 'dd:bootstrap-settings',
  openFile: 'dd:open-file',
  readPath: 'dd:read-path',
  decodeBuffer: 'dd:decode-buffer',
  saveFile: 'dd:save-file',
  getSettings: 'dd:get-settings',
  patchSettings: 'dd:patch-settings',
  getOpenedArgs: 'dd:get-opened-args',
  menu: 'dd:menu',
  openFiles: 'dd:open-files'
} as const

export const MAX_FILE_BYTES = 20 * 1024 * 1024
