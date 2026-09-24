import { DEFAULT_SETTINGS } from '../../shared/ipc'
import type { DiffDeskApi, FilePayload, OpenedArgs, Settings } from '../../shared/ipc'

/** preload 미주입(브라우저 단독 vite 실행) 여부 — true면 파일 다이얼로그/저장 버튼을 비활성화한다 */
export const hasNativeApi = typeof window !== 'undefined' && !!window.api

// 브라우저 폴백: 파일 시스템 기능은 무력화하되 앱은 죽지 않게.
// decodeBuffer만 utf8로 실동작시켜 드래그&드롭 개발 확인이 가능하다.
function createStubApi(): DiffDeskApi {
  let settings: Settings = { ...DEFAULT_SETTINGS }
  return {
    async openFile() {
      return null
    },
    async readPath(): Promise<FilePayload> {
      throw new Error('브라우저 모드에서는 파일 경로를 읽을 수 없습니다.')
    },
    async decodeBuffer(name: string, buf: ArrayBuffer): Promise<FilePayload> {
      return {
        path: '',
        name,
        content: new TextDecoder('utf-8').decode(buf),
        encoding: 'utf8',
        hadBom: false,
        truncated: false
      }
    },
    async saveFile() {
      return null
    },
    getPathForFile() {
      return ''
    },
    async getSettings() {
      return { ...settings }
    },
    async patchSettings(patch) {
      settings = { ...settings, ...patch }
    },
    async getOpenedArgs(): Promise<OpenedArgs> {
      return {}
    },
    onMenu() {
      return () => {}
    },
    onOpenFiles() {
      return () => {}
    }
  }
}

export const api: DiffDeskApi = hasNativeApi ? window.api : createStubApi()
