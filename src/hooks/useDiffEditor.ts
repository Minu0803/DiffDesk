import * as monaco from 'monaco-editor'
import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { DEFAULT_SETTINGS } from '../../shared/ipc'
import { MONO_FONT_STACK } from '../themes/monacoThemes'
import { MERGE_LANE_WIDTH } from '../lib/chunkLayout'
import { createFreshDiffSession } from '../lib/freshDiff'
import type { DiffVersions } from '../lib/freshDiff'

/** Reserve real layout space through a public editor option. The modified editor
 * keeps its normal scrollbar; DiffEditor still owns alignment, split and scroll sync. */
export function reserveMergeLane(editor: monaco.editor.IStandaloneDiffEditor, sideBySide: boolean): void {
  editor.getOriginalEditor().updateOptions({
    minimap: { enabled: false },
    scrollbar: { vertical: sideBySide ? 'hidden' : 'auto', verticalScrollbarSize: sideBySide ? MERGE_LANE_WIDTH : 14, verticalSliderSize: sideBySide ? 0 : 14 }
  })
}

export interface DiffEditorBundle {
  editor: monaco.editor.IStandaloneDiffEditor
  original: monaco.editor.ITextModel
  modified: monaco.editor.ITextModel
  diffSession: { invalidate(): void; getVersions(): DiffVersions | null }
}

/** DiffEditor + 좌우 모델을 앱 수명 동안 1회 생성. 옵션은 설정 로드 후 updateOptions로 덧씌운다 */
export function useDiffEditor(hostRef: RefObject<HTMLDivElement>): DiffEditorBundle | null {
  const [bundle, setBundle] = useState<DiffEditorBundle | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const original = monaco.editor.createModel('', 'plaintext')
    const modified = monaco.editor.createModel('', 'plaintext')
    let invalidate = () => {}
    // Register before constructing DiffEditor/view-model listeners.
    const originalChanges=original.onDidChangeContent(()=>invalidate())
    const modifiedChanges=modified.onDidChangeContent(()=>invalidate())
    const editor = monaco.editor.createDiffEditor(host, {
      originalEditable: true,
      automaticLayout: true,
      mouseWheelZoom: true,
      // 자체 병합 버튼(.dd-chunk-strip)을 쓰므로 내장 revert 아이콘·판 사이 gutter 컬럼은 끈다
      renderMarginRevertIcon: false,
      renderGutterMenu: false,
      useInlineViewWhenSpaceIsLimited: false,
      minimap: { enabled: true },
      renderSideBySide: DEFAULT_SETTINGS.renderSideBySide,
      ignoreTrimWhitespace: DEFAULT_SETTINGS.ignoreTrimWhitespace,
      wordWrap: DEFAULT_SETTINGS.wordWrap ? 'on' : 'off',
      diffWordWrap: DEFAULT_SETTINGS.wordWrap ? 'on' : 'off',
      fontFamily: MONO_FONT_STACK,
      fontSize: DEFAULT_SETTINGS.fontSize
    })
    const diffSession=createFreshDiffSession({createViewModel:()=>editor.createViewModel({original,modified}),setModel:vm=>editor.setModel(vm)},()=>({original:original.getVersionId(),modified:modified.getVersionId()}))
    invalidate=()=>diffSession.invalidate()
    diffSession.recompute()
    reserveMergeLane(editor, DEFAULT_SETTINGS.renderSideBySide)
    setBundle({ editor, original, modified, diffSession })
    return () => {
      editor.dispose()
      originalChanges.dispose();modifiedChanges.dispose();diffSession.dispose()
      original.dispose()
      modified.dispose()
      setBundle(null)
    }
  }, [hostRef])

  return bundle
}
