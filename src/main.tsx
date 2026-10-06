import './styles/tokens.css'
// layout.css는 구조 폴백 — components.css(Designer)가 뒤 순서로 덮어쓴다
import './layout.css'
import './styles/components.css'

import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { createRoot } from 'react-dom/client'
import App from './App'
import { registerMonacoThemes } from './themes/monacoThemes'
import { monacoThemeName } from './themes/monacoThemes'
import { applyPalette } from './themes/applyPalette'
import { api } from './lib/api'
import { DEFAULT_SETTINGS } from '../shared/ipc'

self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

// 비교 도구에서 ts/js 진단 밑줄은 소음 — 검증 전체 비활성
monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true
})
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true
})

registerMonacoThemes(monaco)

// tokens.css가 data-theme 스코프라 첫 페인트 전에 지정(무테마 플래시 방지). 실제 설정값은 App이 재적용
const initialSettings = api.initialSettings || { ...DEFAULT_SETTINGS }
const palette = applyPalette(initialSettings, window.matchMedia('(prefers-color-scheme: dark)').matches)
monaco.editor.setTheme(monacoThemeName(initialSettings, palette.scheme))

createRoot(document.getElementById('root')!).render(<App initialSettings={initialSettings} />)
