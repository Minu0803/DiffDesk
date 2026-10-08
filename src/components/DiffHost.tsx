import type { RefObject } from 'react'
import type { PaneSide } from '../../shared/ipc'
import type { MergeDirection } from '../lib/mergeChunks'
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
      <div className={`dd-drop-overlay dd-drop-overlay--left${dropSide === 'left' ? ' is-visible' : ''}`} />
      <div className={`dd-drop-overlay dd-drop-overlay--right${dropSide === 'right' ? ' is-visible' : ''}`} />
    </div>
  )
}
