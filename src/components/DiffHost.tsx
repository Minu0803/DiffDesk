import type { RefObject } from 'react'
import type { PaneSide } from '../../shared/ipc'
import type { MergeDirection } from '../lib/mergeChunks'
import { MERGE_LANE_WIDTH } from '../lib/chunkLayout'
import { ChunkStrip } from './ChunkStrip'
import type { ChunkButtonPos, MergeReceipt } from './ChunkStrip'

interface DiffHostProps {
  hostRef: RefObject<HTMLDivElement>
  areaRef: RefObject<HTMLDivElement>
  chunks: ChunkButtonPos[]
  stripHidden: boolean
  onApplyChunk: (request: ChunkButtonPos, dir: MergeDirection) => void
  onHoverChunk: (request: ChunkButtonPos | null, dir?: MergeDirection) => void
  laneLeft: number
  receipt: MergeReceipt | null
  dropSide: PaneSide | null
}

export function DiffHost({ hostRef, areaRef, chunks, stripHidden, onApplyChunk, onHoverChunk, laneLeft, receipt, dropSide }: DiffHostProps) {
  return (
    <div className="dd-editor-area" ref={areaRef}>
      <div className="dd-diff-host" ref={hostRef} />
      <ChunkStrip chunks={chunks} hidden={stripHidden} onApply={onApplyChunk} onHover={onHoverChunk} laneLeft={laneLeft} receipt={receipt} />
      {(['left', 'right'] as const).map(side => <div key={side}
        className={`dd-drop-overlay dd-drop-overlay--${side}${dropSide === side ? ' is-visible' : ''}`}
        style={stripHidden ? undefined : side === 'left' ? { width: laneLeft } : { left: laneLeft + MERGE_LANE_WIDTH, width: `calc(100% - ${laneLeft + MERGE_LANE_WIDTH}px)` }}
        aria-hidden={dropSide !== side}>
        <div className="dd-drop-card"><span className="dd-drop-card__icon" aria-hidden="true">↓</span>
          <strong>{side === 'left' ? '왼쪽 원본' : '오른쪽 대상'}에 파일 놓기</strong>
          <span>파일 1개는 이쪽에 · 2개는 양쪽에 열기</span>
        </div>
      </div>)}
    </div>
  )
}
