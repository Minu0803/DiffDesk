import type { LineChangeLike } from './mergeChunks'

export const MERGE_LANE_WIDTH = 64

export function visibleChunkAnchor(top: number, bottom: number, viewportHeight: number): number | null {
  return bottom > 0 && top < viewportHeight ? Math.max(0, top) : null
}

export interface ChunkRequest {
  change: LineChangeLike
  originalVersion: number
  modifiedVersion: number
}

export function chunkKey(c: LineChangeLike): string {
  return [c.originalStartLineNumber, c.originalEndLineNumber, c.modifiedStartLineNumber, c.modifiedEndLineNumber].join(':')
}

export function isCurrentChunk(request: ChunkRequest, originalVersion: number, modifiedVersion: number, changes: readonly LineChangeLike[]): boolean {
  return request.originalVersion === originalVersion && request.modifiedVersion === modifiedVersion && changes.some(c => chunkKey(c) === chunkKey(request.change))
}

export function packChunkButtons(anchors: readonly number[], viewportHeight: number): { top: number; height: number }[] {
  if (!anchors.length) return []
  // Keep every pair visible. Dense ranges use compact, non-overlapping targets;
  // view-zone alignment and code line heights are never altered.
  const height = Math.min(26, viewportHeight / anchors.length)
  const desired = anchors.map(y => Math.max(0, Math.min(y, viewportHeight - height)))
  const top = [...desired]
  for (let i=1;i<top.length;i++) top[i] = Math.max(top[i], top[i-1] + height)
  if (top[top.length-1] + height > viewportHeight) {
    top[top.length-1] = Math.max(0, viewportHeight-height)
    for (let i=top.length-2;i>=0;i--) top[i] = Math.min(top[i], top[i+1]-height)
  }
  // A long dense run is compacted instead of moving its last controls far from anchors.
  if (top.some((y,i) => Math.abs(y-desired[i]) > 10)) {
    const compact = Math.max(1, Math.min(18, viewportHeight / anchors.length))
    let previous = -compact
    return anchors.map((y,i) => { const packed=Math.max(previous+compact, Math.min(Math.max(0,y),viewportHeight-(anchors.length-i)*compact));previous=packed;return {top:packed,height:compact} })
  }
  return top.map(y => ({ top: y, height }))
}
