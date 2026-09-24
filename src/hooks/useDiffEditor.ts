import * as monaco from 'monaco-editor'
import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { DEFAULT_SETTINGS } from '../../shared/ipc'
import { MONO_FONT_STACK } from '../themes/monacoThemes'

export interface DiffEditorBundle {
  editor: monaco.editor.IStandaloneDiffEditor
  original: monaco.editor.ITextModel
  modified: monaco.editor.ITextModel
}

/** DiffEditor + 좌우 모델을 앱 수명 동안 1회 생성. 옵션은 설정 로드 후 updateOptions로 덧씌운다 */
export function useDiffEditor(hostRef: RefObject<HTMLDivElement>): DiffEditorBundle | null {
  const [bundle, setBundle] = useState<DiffEditorBundle | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const original = monaco.editor.createModel('', 'plaintext')
    const modified = monaco.editor.createModel('', 'plaintext')
    const editor = monaco.editor.createDiffEditor(host, {
      originalEditable: true,
      automaticLayout: true,
      mouseWheelZoom: true,
      // 자체 병합 버튼(.dd-chunk-strip)을 쓰므로 내장 revert 아이콘·판 사이 gutter 컬럼은 끈다
      renderMarginRevertIcon: false,
      renderGutterMenu: false,
      minimap: { enabled: true },
      renderSideBySide: DEFAULT_SETTINGS.renderSideBySide,
      ignoreTrimWhitespace: DEFAULT_SETTINGS.ignoreTrimWhitespace,
      wordWrap: DEFAULT_SETTINGS.wordWrap ? 'on' : 'off',
      diffWordWrap: DEFAULT_SETTINGS.wordWrap ? 'on' : 'off',
      fontFamily: MONO_FONT_STACK,
      fontSize: DEFAULT_SETTINGS.fontSize
    })
    editor.setModel({ original, modified })
    setBundle({ editor, original, modified })
    return () => {
      editor.dispose()
      original.dispose()
      modified.dispose()
      setBundle(null)
    }
  }, [hostRef])

  return bundle
}
