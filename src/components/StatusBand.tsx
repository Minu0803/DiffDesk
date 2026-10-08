import { MotionButton } from './MotionButton'

export type BandMarkKind = 'mod' | 'add' | 'del'

export interface BandMarker {
  kind: BandMarkKind
  /** modified 모델 줄 위치의 가로 투영(0~100, inline left%) */
  leftPct: number
}

export interface BandCounts {
  modified: number
  added: number
  removed: number
}

interface StatusBandProps {
  pending: boolean
  /** 양판 모두 빈 문서 — same보다 우선 판정 */
  bothEmpty: boolean
  diffCount: number
  diffIndex: number
  counts: BandCounts
  markers: BandMarker[]
  leftLines: number
  rightLines: number
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

export function StatusBand(p: StatusBandProps) {
  const state = p.bothEmpty || p.pending ? 'empty' : p.diffCount === 0 ? 'same' : 'diff'
  const verdict =
    p.pending ? '비교 계산 중…' : state === 'empty' ? '비교할 내용이 없습니다' : state === 'same' ? (p.bothEmpty?'비교할 내용이 없습니다':'✓ 차이가 없습니다') : `차이 ${p.diffCount}개`
  return (
    <div className={`dd-band dd-band--${state}`}>
      <span className="dd-band__verdict" aria-live="polite">
        {verdict}
      </span>
      {p.bothEmpty && <span className="dd-band__sub dd-band__hint">파일을 끌어다 놓거나, 붙여넣거나, 열기로 시작하세요</span>}
      {state === 'same' && p.leftLines === p.rightLines && <span className="dd-band__sub">{p.leftLines}줄 모두 일치</span>}
      {state === 'diff' && (
        <>
          {p.counts.modified > 0 && <span className="dd-band__chip dd-band__chip--mod">수정 {p.counts.modified}</span>}
          {p.counts.added > 0 && <span className="dd-band__chip dd-band__chip--add">추가 {p.counts.added}</span>}
          {p.counts.removed > 0 && <span className="dd-band__chip dd-band__chip--del">삭제 {p.counts.removed}</span>}
          <div className="dd-band__ribbon">
            {p.markers.map((m, i) => (
              <button
                key={i}
                type="button"
                className={`dd-band__mark dd-band__mark--${m.kind}${i === p.diffIndex ? ' is-current' : ''}`}
                style={{ left: `${m.leftPct}%` }}
                title={`차이 ${i + 1}로 이동`}
                aria-label={`차이 ${i + 1}로 이동`}
                onClick={() => p.onJump(i)}
              />
            ))}
          </div>
          <div className="dd-band__nav">
            <MotionButton
              type="button"
              className="dd-btn dd-btn--icon"
              title="이전 차이 (Shift+F7)"
              aria-label="이전 차이"
              onClick={p.onPrev}
            >
              ▲
            </MotionButton>
            <MotionButton
              type="button"
              className="dd-btn dd-btn--icon"
              title="다음 차이 (F7)"
              aria-label="다음 차이"
              onClick={p.onNext}
            >
              ▼
            </MotionButton>
            <span className="dd-band__counter" aria-live="polite">
              {p.diffIndex + 1} / {p.diffCount}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
