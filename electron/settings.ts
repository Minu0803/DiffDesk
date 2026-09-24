import { app, nativeTheme } from 'electron'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { DEFAULT_SETTINGS, Settings } from '../shared/ipc'

// windowBounds는 Settings 계약(shared/ipc.ts) 밖 확장 필드 — 저장 파일에만 두고 렌더러에는 노출하지 않는다
interface StoredSettings extends Settings {
  windowBounds?: Electron.Rectangle
}

let store: StoredSettings | null = null

function settingsFilePath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

function sanitize(raw: unknown): StoredSettings {
  const next: StoredSettings = { ...DEFAULT_SETTINGS }
  if (!raw || typeof raw !== 'object') return next
  const r = raw as Record<string, unknown>
  if (r.theme === 'system' || r.theme === 'light' || r.theme === 'dark') next.theme = r.theme
  if (typeof r.renderSideBySide === 'boolean') next.renderSideBySide = r.renderSideBySide
  if (typeof r.ignoreTrimWhitespace === 'boolean') next.ignoreTrimWhitespace = r.ignoreTrimWhitespace
  if (typeof r.wordWrap === 'boolean') next.wordWrap = r.wordWrap
  if (typeof r.language === 'string') next.language = r.language
  if (typeof r.fontSize === 'number' && Number.isFinite(r.fontSize)) {
    next.fontSize = Math.min(40, Math.max(8, Math.round(r.fontSize)))
  }
  const b = r.windowBounds as Record<string, unknown> | undefined
  if (
    b && typeof b === 'object' &&
    [b.x, b.y, b.width, b.height].every(v => typeof v === 'number' && Number.isFinite(v))
  ) {
    next.windowBounds = { x: b.x as number, y: b.y as number, width: b.width as number, height: b.height as number }
  }
  return next
}

function ensure(): StoredSettings {
  if (store) return store
  let raw: unknown = null
  try {
    raw = JSON.parse(fs.readFileSync(settingsFilePath(), 'utf8'))
  } catch {
    raw = null // 파일 없음/파손 → 기본값 복구
  }
  store = sanitize(raw)
  return store
}

function persist(): void {
  if (!store) return
  try {
    fs.mkdirSync(path.dirname(settingsFilePath()), { recursive: true })
    fs.writeFileSync(settingsFilePath(), JSON.stringify(store, null, 2), 'utf8')
  } catch {
    // 설정 저장 실패가 앱을 죽여선 안 된다
  }
}

export function initSettings(): Settings {
  const s = ensure()
  nativeTheme.themeSource = s.theme
  return getSettings()
}

export function getSettings(): Settings {
  const s = ensure()
  return {
    theme: s.theme,
    renderSideBySide: s.renderSideBySide,
    ignoreTrimWhitespace: s.ignoreTrimWhitespace,
    wordWrap: s.wordWrap,
    language: s.language,
    fontSize: s.fontSize
  }
}

export function patchSettings(patch: Partial<Settings>): void {
  const cur = ensure()
  store = sanitize({ ...cur, ...patch })
  persist()
  nativeTheme.themeSource = store.theme
}

export function getWindowBounds(): Electron.Rectangle | undefined {
  return ensure().windowBounds
}

export function saveWindowBounds(bounds: Electron.Rectangle): void {
  store = { ...ensure(), windowBounds: bounds }
  persist()
}
