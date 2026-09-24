import type { PaneSide } from '../../shared/ipc'
import { encodingLabel } from '../lib/pane'
import type { PaneMeta } from '../lib/pane'

interface PaneHeaderProps {
  side: PaneSide
  meta: PaneMeta
  /** false = 브라우저 폴백(window.api 부재) — 다이얼로그 기반 기능 비활성 */
  fileOpsEnabled: boolean
  onOpen: () => void
  onSave: () => void
  onPaste: () => void
  onClearPane: () => void
}

export function PaneHeader({ side, meta, fileOpsEnabled, onOpen, onSave, onPaste, onClearPane }: PaneHeaderProps) {
  const placeholder = side === 'left' ? '왼쪽(원본)' : '오른쪽(대상)'
  return (
    <div className={`dd-pane-header dd-pane-header--${side}`}>
      <span className="dd-pane-header__name" title={meta.path || meta.name || placeholder}>
        {meta.name || placeholder}
      </span>
      {meta.dirty && (
        <span className="dd-pane-header__dirty" title="수정됨" aria-label="수정됨">
          ●
        </span>
      )}
      {meta.name !== '' && <span className="dd-pane-header__badge">{encodingLabel(meta.encoding)}</span>}
      {meta.truncated && (
        <span className="dd-pane-header__badge" title="20MB 초과로 앞부분만 표시">
          잘림
        </span>
      )}
      <span className="dd-pane-header__actions">
        <button type="button" className="dd-btn dd-btn--ghost" onClick={onOpen} disabled={!fileOpsEnabled}>
          열기
        </button>
        <button type="button" className="dd-btn dd-btn--ghost" onClick={onSave} disabled={!fileOpsEnabled}>
          저장
        </button>
        <button type="button" className="dd-btn dd-btn--ghost" title="클립보드 내용으로 전체 교체" onClick={onPaste}>
          붙여넣기
        </button>
        <button type="button" className="dd-btn dd-btn--ghost" onClick={onClearPane}>
          비우기
        </button>
      </span>
    </div>
  )
}
