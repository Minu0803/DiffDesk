// 병합(청크 복사) 핵심 로직 — UI-SPEC §4.2 매트릭스 구현.
// monaco를 import하지 않고 구조 타입만 쓴다: ITextModel이 그대로 대입되고, DOM 없는 노드 환경에서 단독 검증 가능.

export type MergeDirection = 'ltr' | 'rtl'

export interface RangeLike {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

/** monaco ILineChange의 필드 부분집합 (End===0이 특수값) */
export interface LineChangeLike {
  originalStartLineNumber: number
  originalEndLineNumber: number
  modifiedStartLineNumber: number
  modifiedEndLineNumber: number
}

/** monaco ITextModel이 구조적으로 만족하는 최소 표면 */
export interface MergeModel {
  getLineCount(): number
  getLineMaxColumn(lineNumber: number): number
  getValueInRange(range: RangeLike): string
  getValue(): string
  getFullModelRange(): RangeLike
  pushStackElement(): void
  pushEditOperations(
    beforeCursorState: null,
    editOperations: Array<{ range: RangeLike; text: string }>,
    cursorStateComputer: () => null
  ): unknown
}

function range(sl: number, sc: number, el: number, ec: number): RangeLike {
  return { startLineNumber: sl, startColumn: sc, endLineNumber: el, endColumn: ec }
}

// undo 스택 유지 계약: setValue/applyEdits 금지, 반드시 pushEditOperations.
// 앞뒤 pushStackElement로 병합 1회 = undo 1단위를 보장한다.
function pushEdit(model: MergeModel, r: RangeLike, text: string): void {
  model.pushStackElement()
  model.pushEditOperations(null, [{ range: r, text }], () => null)
  model.pushStackElement()
}

function lineRangeText(model: MergeModel, start: number, end: number): string {
  return model.getValueInRange(range(start, 1, end, model.getLineMaxColumn(end)))
}

function replaceLines(model: MergeModel, start: number, end: number, text: string): void {
  pushEdit(model, range(start, 1, end, model.getLineMaxColumn(end)), text)
}

/** line===0이면 문서 맨 앞에 삽입 */
function insertLinesAfter(model: MergeModel, line: number, text: string): void {
  if (line === 0) {
    pushEdit(model, range(1, 1, 1, 1), text + '\n')
  } else {
    const col = model.getLineMaxColumn(line)
    pushEdit(model, range(line, col, line, col), '\n' + text)
  }
}

function deleteLines(model: MergeModel, start: number, end: number): void {
  if (end < model.getLineCount()) {
    pushEdit(model, range(start, 1, end + 1, 1), '')
  } else {
    // 마지막 줄 포함 삭제: 앞 줄의 개행까지 걷어내야 빈 줄이 남지 않는다
    const r =
      start > 1
        ? range(start - 1, model.getLineMaxColumn(start - 1), end, model.getLineMaxColumn(end))
        : range(1, 1, end, model.getLineMaxColumn(end))
    pushEdit(model, r, '')
  }
}

/**
 * lineChange 1건을 지정 방향으로 적용. UI-SPEC §4.2 매트릭스:
 * - oEnd>0 & mEnd>0: 수정 블록 → 반대편 텍스트로 줄 교체
 * - oEnd===0: 오른쪽에만 있는 블록 → ltr=오른쪽에서 삭제 / rtl=왼쪽 oStart 뒤에 삽입
 * - mEnd===0: 왼쪽에만 있는 블록 → ltr=오른쪽 mStart 뒤에 삽입 / rtl=왼쪽에서 삭제
 * @returns false = 디프 재계산 전 stale change로 판단해 적용 거부
 */
export function applyChunk(
  original: MergeModel,
  modified: MergeModel,
  change: LineChangeLike,
  dir: MergeDirection
): boolean {
  const os = change.originalStartLineNumber
  const oe = change.originalEndLineNumber
  const ms = change.modifiedStartLineNumber
  const me = change.modifiedEndLineNumber
  const oCount = original.getLineCount()
  const mCount = modified.getLineCount()

  if (oe > 0 && (os < 1 || os > oe || oe > oCount)) return false
  if (me > 0 && (ms < 1 || ms > me || me > mCount)) return false
  if (oe === 0 && os > oCount) return false
  if (me === 0 && ms > mCount) return false

  if (oe > 0 && me > 0) {
    if (dir === 'ltr') replaceLines(modified, ms, me, lineRangeText(original, os, oe))
    else replaceLines(original, os, oe, lineRangeText(modified, ms, me))
    return true
  }
  if (oe === 0) {
    if (dir === 'ltr') deleteLines(modified, ms, me)
    else insertLinesAfter(original, os, lineRangeText(modified, ms, me))
    return true
  }
  if (dir === 'ltr') insertLinesAfter(modified, ms, lineRangeText(original, os, oe))
  else deleteLines(original, os, oe)
  return true
}

/** 전체 복사(모두 →/←): 대상 전체 범위를 원본 값으로 한 방에 교체 → undo 한 번에 복귀 */
export function copyAll(source: MergeModel, target: MergeModel): void {
  pushEdit(target, target.getFullModelRange(), source.getValue())
}

export function replaceAll(model: MergeModel, text: string): void {
  pushEdit(model, model.getFullModelRange(), text)
}

/** 좌우 값 교환 — 모델 교체가 아니라 편집이므로 양쪽 다 undo 가능 */
export function swapValues(a: MergeModel, b: MergeModel): void {
  const va = a.getValue()
  const vb = b.getValue()
  replaceAll(a, vb)
  replaceAll(b, va)
}
