interface SelectionRange {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

/** Monaco ranges are normalized even when the pointer drags backwards. */
export function selectionLabel(ranges: readonly SelectionRange[] | null): string {
  const selected = (ranges ?? []).filter(r => r.startLineNumber !== r.endLineNumber || r.startColumn !== r.endColumn)
  if (!selected.length) return ''
  const lines = selected.reduce((total, r) => total + r.endLineNumber - r.startLineNumber + (r.endColumn === 1 ? 0 : 1), 0)
  if (selected.length > 1) return `선택 ${selected.length}곳 · ${lines}줄`
  const r = selected[0]
  return `선택 ${r.startLineNumber}:${r.startColumn} → ${r.endLineNumber}:${r.endColumn} · ${lines}줄`
}
