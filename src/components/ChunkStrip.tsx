import type { MergeDirection } from '../lib/mergeChunks'

export interface ChunkButtonPos {
  /** lineChanges 배열 인덱스 */
  key: number
  x: number
  y: number
  visible: boolean
}

interface ChunkStripProps {
  chunks: ChunkButtonPos[]
  hidden: boolean
  onApply: (index: number, dir: MergeDirection) => void
}

export function ChunkStrip({ chunks, hidden, onApply }: ChunkStripProps) {
  if (hidden) return null
  return (
    <div className="dd-chunk-strip">
      {chunks
        .filter((c) => c.visible)
        .map((c) => (
          <div
            key={c.key}
            style={{
              position: 'absolute',
              left: c.x,
              top: c.y,
              transform: 'translate(-50%, 0)',
              display: 'flex',
              gap: 4,
              pointerEvents: 'none'
            }}
          >
            <button
              type="button"
              className="dd-chunk-btn dd-chunk-btn--ltr"
              title="이 블록을 오른쪽으로 복사"
              aria-label="이 블록을 오른쪽으로 복사"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onApply(c.key, 'ltr')}
            >
              →
            </button>
            <button
              type="button"
              className="dd-chunk-btn dd-chunk-btn--rtl"
              title="이 블록을 왼쪽으로 복사"
              aria-label="이 블록을 왼쪽으로 복사"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onApply(c.key, 'rtl')}
            >
              ←
            </button>
          </div>
        ))}
    </div>
  )
}
