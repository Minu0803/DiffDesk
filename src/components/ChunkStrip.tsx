import { useRef } from 'react'
import type { MergeDirection } from '../lib/mergeChunks'
import type { ChunkRequest } from '../lib/chunkLayout'
import { MotionButton } from './MotionButton'

export interface ChunkButtonPos extends ChunkRequest {
  key: string
  x: number
  y: number
  anchorY: number
  height: number
  disabled: boolean
  labels: Record<MergeDirection, string>
}
export interface MergeReceipt { x: number; y: number; target: MergeDirection }

interface ChunkStripProps {
  chunks: ChunkButtonPos[]
  hidden: boolean
  laneLeft: number
  receipt: MergeReceipt | null
  onApply: (request: ChunkButtonPos, dir: MergeDirection) => void
  onHover: (request: ChunkButtonPos | null, dir?: MergeDirection) => void
}

function ChunkPair({ chunk, onApply, onHover }: { chunk: ChunkButtonPos; onApply: ChunkStripProps['onApply']; onHover: ChunkStripProps['onHover'] }) {
  const captured = useRef<ChunkButtonPos | null>(null)
  return <div className="dd-chunk-pair" style={{ left: chunk.x, top: chunk.y, height: chunk.height }}>
    {chunk.y!==chunk.anchorY && <span className="dd-chunk-connector" style={{ top: Math.min(0,chunk.anchorY-chunk.y), height:Math.abs(chunk.anchorY-chunk.y)+2 }} aria-hidden="true" />}
    {(['ltr','rtl'] as const).map(dir=><MotionButton key={dir} type="button" className={'dd-chunk-btn dd-chunk-btn--'+dir} faceClassName="dd-chunk-face"
      disabled={chunk.disabled} title={chunk.labels[dir]} aria-label={chunk.labels[dir]}
      onPointerDown={()=>{captured.current=chunk}}
      onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')captured.current=chunk}}
      onMouseDown={e=>e.preventDefault()}
      onClick={e=>{if(e.detail<=1)onApply(captured.current||chunk,dir);captured.current=null}}
      onMouseEnter={()=>onHover(chunk,dir)} onMouseLeave={()=>onHover(null)}
      onFocus={()=>onHover(chunk,dir)} onBlur={()=>onHover(null)}
    >{dir==='ltr'?'→':'←'}</MotionButton>)}
  </div>
}

export function ChunkStrip({ chunks, hidden, laneLeft, receipt, onApply, onHover }: ChunkStripProps) {
  if(hidden) return null
  return <div className="dd-chunk-strip">
    <div className="dd-merge-lane" style={{left:laneLeft}} aria-hidden="true" />
    {chunks.map(chunk=><ChunkPair key={chunk.key} chunk={chunk} onApply={onApply} onHover={onHover} />)}
    {receipt && <span className="dd-merge-receipt" style={{left:receipt.x+(receipt.target==='ltr'?-15:15),top:receipt.y}} aria-hidden="true">✓</span>}
  </div>
}
