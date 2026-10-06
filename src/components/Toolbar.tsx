import type { ThemeSelection } from '../../shared/themes'
import { ThemePicker } from './ThemePicker'
import { MotionButton } from './MotionButton'
import { LANGUAGE_OPTIONS } from '../lib/langDetect'

interface ToolbarProps {
  diffCount: number
  /** settings.language ('' = 자동) */
  language: string
  renderSideBySide: boolean
  ignoreTrimWhitespace: boolean
  wordWrap: boolean
  theme: ThemeSelection
  onCopyAllLtr: () => void
  onCopyAllRtl: () => void
  onSwap: () => void
  onClear: () => void
  onLanguageChange: (id: string) => void
  onToggleView: () => void
  onToggleWhitespace: () => void
  onToggleWrap: () => void
  onThemeChange: (value: ThemeSelection) => void
}

export function Toolbar(p: ToolbarProps) {
  const noDiff = p.diffCount === 0
  return (
    <div className="dd-toolbar">
      <span className="dd-brand"><span className="dd-brand__mark" aria-hidden="true">⇄</span>DiffDesk</span>
      <div className="dd-toolbar__group">
        <span className="dd-copy-cluster">
        <MotionButton type="button" className="dd-btn" title="모두 왼쪽으로 (Ctrl+Alt+Left)" onClick={p.onCopyAllRtl} disabled={noDiff}>
          ← 모두
        </MotionButton>
        <MotionButton type="button" className="dd-btn" title="모두 오른쪽으로 (Ctrl+Alt+Right)" onClick={p.onCopyAllLtr} disabled={noDiff}>
          모두 →
        </MotionButton>
        </span>
        <span className="dd-toolbar__divider" />
        <MotionButton type="button" className="dd-btn" title="좌우 바꾸기 (Ctrl+Alt+X)" onClick={p.onSwap}>
          ⇄ 바꾸기
        </MotionButton>
        <MotionButton type="button" className="dd-btn" title="양쪽 모두 지우기" onClick={p.onClear}>
          지우기
        </MotionButton>
      </div>
      <span className="dd-toolbar__spacer" />
      <div className="dd-toolbar__group">
        <select
          className="dd-select"
          value={p.language}
          onChange={(e) => p.onLanguageChange(e.target.value)}
          title="언어 선택"
          aria-label="언어 선택"
        >
          <option value="">언어: 자동</option>
          {LANGUAGE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <MotionButton type="button" className="dd-btn" title="나란히·한줄 전환 (Ctrl+\)" onClick={p.onToggleView}>
          {p.renderSideBySide ? '나란히 보기' : '한 줄 보기'}
        </MotionButton>
        <MotionButton
          type="button"
          className={`dd-btn${p.ignoreTrimWhitespace ? ' is-active' : ''}`}
          title="공백 무시"
          aria-pressed={p.ignoreTrimWhitespace}
          onClick={p.onToggleWhitespace}
        >
          공백 무시
        </MotionButton>
        <MotionButton
          type="button"
          className={`dd-btn${p.wordWrap ? ' is-active' : ''}`}
          title="자동 줄바꿈 (Alt+Z)"
          aria-pressed={p.wordWrap}
          onClick={p.onToggleWrap}
        >
          자동 줄바꿈
        </MotionButton>
        <ThemePicker value={p.theme} onChange={p.onThemeChange} />
      </div>
    </div>
  )
}
