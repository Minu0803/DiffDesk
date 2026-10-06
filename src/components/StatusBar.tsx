import { encodingLabel } from '../lib/pane'
import { languageLabel } from '../lib/langDetect'
import type { PaneSide } from '../../shared/ipc'
import { MotionButton } from './MotionButton'

interface StatusBarProps {
  leftLines: number
  rightLines: number
  diffCount: number
  diffIndex: number
  /** 양판 모두 빈 문서 — dot의 empty 판정용(same과 구분) */
  bothEmpty: boolean
  /** 실효 언어 id (자동 감지 결과 반영) */
  language: string
  leftEncoding: string
  rightEncoding: string
  cursorLine: number
  cursorCol: number
  feedback: string
  activeSide: PaneSide
  canUndo: boolean
  onUndo: () => void
}

export function StatusBar(p: StatusBarProps) {
  const dotState = p.bothEmpty ? 'is-empty' : p.diffCount > 0 ? 'is-diff' : 'is-same'
  return (
    <div className="dd-statusbar">
      <span className="dd-statusbar__feedback" role="status" aria-live="polite">{p.feedback}</span>
      <MotionButton type="button" className="dd-btn dd-status-undo" onClick={p.onUndo} disabled={!p.canUndo}>{p.activeSide==='left'?'왼쪽':'오른쪽'} 실행 취소</MotionButton>
      <span className="dd-statusbar__item">
        왼쪽 {p.leftLines}줄 · 오른쪽 {p.rightLines}줄
      </span>
      <span className="dd-statusbar__sep" />
      <span className="dd-statusbar__item">
        <i className={`dd-statusbar__dot ${dotState}`} />
        {p.diffCount > 0 ? `차이 ${p.diffCount}개 (${p.diffIndex + 1}/${p.diffCount})` : '차이 없음'}
      </span>
      <span className="dd-statusbar__sep" />
      <span className="dd-statusbar__item">{languageLabel(p.language)}</span>
      <span className="dd-statusbar__sep" />
      <span className="dd-statusbar__item">
        좌 {encodingLabel(p.leftEncoding)} · 우 {encodingLabel(p.rightEncoding)}
      </span>
      <span className="dd-statusbar__sep" />
      <span className="dd-statusbar__item">
        Ln {p.cursorLine}, Col {p.cursorCol}
      </span>
    </div>
  )
}
