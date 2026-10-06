import * as monaco from 'monaco-editor'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_SETTINGS } from '../shared/ipc'
import type { FilePayload, MenuCommand, PaneSide, SaveRequest, Settings } from '../shared/ipc'
import { monacoThemeName } from './themes/monacoThemes'
import { applyPalette } from './themes/applyPalette'
import { THEME_PRESET_IDS, themePatchFor, themeSelection } from '../shared/themes'
import type { ThemeSelection } from '../shared/themes'
import { api, hasNativeApi } from './lib/api'
import { emptyPaneMeta } from './lib/pane'
import type { PaneMeta } from './lib/pane'
import { detectLanguage } from './lib/langDetect'
import { applyChunk, copyAll, replaceAll, swapValues } from './lib/mergeChunks'
import type { MergeDirection } from './lib/mergeChunks'
import { useDiffEditor, reserveMergeLane } from './hooks/useDiffEditor'
import { chunkKey, isCurrentChunk, packChunkButtons, visibleChunkAnchor, MERGE_LANE_WIDTH } from './lib/chunkLayout'
import { Toolbar } from './components/Toolbar'
import { PaneHeader } from './components/PaneHeader'
import { DiffHost } from './components/DiffHost'
import type { ChunkButtonPos, MergeReceipt } from './components/ChunkStrip'
import { StatusBar } from './components/StatusBar'
import { StatusBand } from './components/StatusBand'
import type { BandCounts, BandMarker } from './components/StatusBand'
import { QA_LEFT, QA_RIGHT } from './qa/sample'

interface PaneMetas {
  left: PaneMeta
  right: PaneMeta
}

interface DiffPos {
  count: number
  index: number
}

function withMeta(cur: PaneMetas, side: PaneSide, meta: PaneMeta): PaneMetas {
  return side === 'left' ? { ...cur, left: meta } : { ...cur, right: meta }
}

function alertError(err: unknown): void {
  window.alert(err instanceof Error ? err.message : String(err))
}

const THEME_CYCLE: ThemeSelection[] = ['system', 'light', 'dark', ...THEME_PRESET_IDS]

export default function App({ initialSettings = DEFAULT_SETTINGS }: { initialSettings?: Settings }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const bundle = useDiffEditor(hostRef)
  const bundleRef = useRef(bundle)
  bundleRef.current = bundle

  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS, ...initialSettings })
  const settingsRef = useRef(settings)

  const [metas, setMetas] = useState<PaneMetas>({ left: emptyPaneMeta(), right: emptyPaneMeta() })
  const metasRef = useRef(metas)
  // 상태와 ref를 항상 함께 갱신 — Monaco 리스너(렌더 밖)에서도 최신 메타를 본다
  const commitMetas = useCallback((next: PaneMetas) => {
    metasRef.current = next
    setMetas(next)
  }, [])

  const [diff, setDiff] = useState<DiffPos>({ count: 0, index: -1 })
  const diffRef = useRef(diff)
  const commitDiff = useCallback((next: DiffPos) => {
    diffRef.current = next
    setDiff(next)
  }, [])

  const changesRef = useRef<readonly monaco.editor.ILineChange[]>([])
  // 저장/로드 시점 getAlternativeVersionId 스냅샷. -1 = 일치 불가 센티널(스왑으로 이력 단절 시)
  const savedIdsRef = useRef<{ left: number; right: number }>({ left: -1, right: -1 })
  const undoBaseIdsRef = useRef({ left: -1, right: -1 })
  const focusedSideRef = useRef<PaneSide>('left')
  const diffVersionsRef = useRef({ original: -1, modified: -1 })
  const mergeBusyRef = useRef(true)
  const [diffPending, setDiffPending] = useState(true)
  const lastWhitespaceRef = useRef(initialSettings.ignoreTrimWhitespace)
  const [laneLeft, setLaneLeft] = useState(0)
  const [activeSide, setActiveSide] = useState<PaneSide>('left')
  const [canUndo, setCanUndo] = useState({ left: false, right: false })
  const [receipt, setReceipt] = useState<MergeReceipt | null>(null)
  const receiptTimerRef = useRef<number>()
  const [feedback, setFeedback] = useState('')
  const highlightRef = useRef<{ left: monaco.editor.IEditorDecorationsCollection; right: monaco.editor.IEditorDecorationsCollection } | null>(null)
  const flashRef = useRef<{ left: monaco.editor.IEditorDecorationsCollection; right: monaco.editor.IEditorDecorationsCollection } | null>(null)
  const flashTimerRef = useRef<{left?:number;right?:number}>({})
  const rafRef = useRef(0)

  const [chunks, setChunks] = useState<ChunkButtonPos[]>([])
  const [lineCounts, setLineCounts] = useState({ left: 1, right: 1 })
  const [bothEmpty, setBothEmpty] = useState(true)
  const [bandCounts, setBandCounts] = useState<BandCounts>({ modified: 0, added: 0, removed: 0 })
  const [bandMarkers, setBandMarkers] = useState<BandMarker[]>([])
  const [cursor, setCursor] = useState({ line: 1, col: 1 })
  const [dropSide, setDropSide] = useState<PaneSide | null>(null)
  const [effectiveLang, setEffectiveLang] = useState('plaintext')

  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const patchQueueRef = useRef<Partial<Settings>>({})
  const patchTimerRef = useRef<number>()
  const persistSettings = useCallback((patch: Partial<Settings>) => {
    Object.assign(patchQueueRef.current, patch)
    window.clearTimeout(patchTimerRef.current)
    patchTimerRef.current = window.setTimeout(() => {
      const queued = patchQueueRef.current
      patchQueueRef.current = {}
      void api.patchSettings(queued).catch(() => undefined)
    }, 300)
  }, [])

  const updateSettings = useCallback(
    (patch: Partial<Settings>, persist = true) => {
      const next = { ...settingsRef.current, ...patch }
      settingsRef.current = next
      setSettings(next)
      if (persist) persistSettings(patch)
    },
    [persistSettings]
  )

  const computeChunks = useCallback((): ChunkButtonPos[] => {
    const b = bundleRef.current
    const area = areaRef.current
    if (!b || b.original.isDisposed() || b.modified.isDisposed() || !area || !settingsRef.current.renderSideBySide) return []
    const orig = b.editor.getOriginalEditor()
    const mod = b.editor.getModifiedEditor()
    const origNode = orig.getDomNode()
    const modNode = mod.getDomNode()
    if (!origNode || !modNode) return []
    const areaRect = area.getBoundingClientRect()
    const left = origNode.getBoundingClientRect().right - areaRect.left - MERGE_LANE_WIDTH
    if (orig.getLayoutInfo().verticalScrollbarWidth !== MERGE_LANE_WIDTH) return []
    setLaneLeft(left)
    ;(area.closest('.dd-app') as HTMLElement | null)?.style.setProperty('--dd-left-pane',left+'px')
    const height = areaRect.height
    const candidates = changesRef.current.map(c=>{
      const ed=c.modifiedEndLineNumber===0?orig:mod
      const rawLine=c.modifiedEndLineNumber===0?c.originalStartLineNumber:c.modifiedStartLineNumber
      const line=Math.min(Math.max(rawLine,1),ed.getModel()!.getLineCount())
      const y=ed.getDomNode()!.getBoundingClientRect().top-areaRect.top+ed.getTopForLineNumber(line)-ed.getScrollTop()
      const end=Math.min(Math.max(c.modifiedEndLineNumber===0?c.originalEndLineNumber:c.modifiedEndLineNumber,line),ed.getModel()!.getLineCount())
      const bottom=ed.getDomNode()!.getBoundingClientRect().top-areaRect.top+ed.getBottomForLineNumber(end)-ed.getScrollTop()
      return { change:c, anchorY:visibleChunkAnchor(y,bottom,height) }
    }).filter((c):c is {change:monaco.editor.ILineChange;anchorY:number}=>c.anchorY!==null).sort((a,b)=>a.anchorY-b.anchorY)
    const packed=packChunkButtons(candidates.map(c=>c.anchorY),height)
    const span=(start:number,end:number)=>end===start?`${start}행`:`${start}~${end}행`
    return candidates.map(({change:c,anchorY},i)=>{
      const effect=(dir:MergeDirection)=>{
        const ltr=dir==='ltr', source=ltr?'왼쪽':'오른쪽', target=ltr?'오른쪽':'왼쪽'
        const ss=ltr?c.originalStartLineNumber:c.modifiedStartLineNumber,se=ltr?c.originalEndLineNumber:c.modifiedEndLineNumber
        const ts=ltr?c.modifiedStartLineNumber:c.originalStartLineNumber,te=ltr?c.modifiedEndLineNumber:c.originalEndLineNumber
        return se===0?`${target} ${span(ts,te)} 삭제`:te===0?`${source} ${span(ss,se)}을 ${target}에 삽입`:`${source} ${span(ss,se)}으로 ${target} ${span(ts,te)} 교체`
      }
      return {key:chunkKey(c),change:c,originalVersion:diffVersionsRef.current.original,modifiedVersion:diffVersionsRef.current.modified,x:left+MERGE_LANE_WIDTH/2,y:packed[i].top,anchorY,height:packed[i].height,disabled:mergeBusyRef.current,labels:{ltr:effect('ltr'),rtl:effect('rtl')}}
    })
  }, [])

  const scheduleChunks = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0
      setChunks(computeChunks())
    })
  }, [computeChunks])

  function modelOf(side: PaneSide): monaco.editor.ITextModel | null {
    const b = bundleRef.current
    if (!b || b.original.isDisposed() || b.modified.isDisposed()) return null
    return side === 'left' ? b.original : b.modified
  }

  function loadPayload(side: PaneSide, p: FilePayload): void {
    const model = modelOf(side)
    if (!model) return
    // 파일 로드는 새 문서 기준선: setValue로 undo 이력도 리셋
    model.setValue(p.content)
    undoBaseIdsRef.current[side] = model.getAlternativeVersionId()
    setCanUndo(prev=>({...prev,[side]:false}))
    savedIdsRef.current[side] = model.getAlternativeVersionId()
    commitMetas(
      withMeta(metasRef.current, side, {
        path: p.path,
        name: p.name,
        encoding: p.encoding,
        hadBom: p.hadBom,
        truncated: p.truncated,
        dirty: false
      })
    )
  }

  async function openInto(side: PaneSide): Promise<void> {
    try {
      const payload = await api.openFile()
      if (payload) loadPayload(side, payload)
    } catch (err) {
      alertError(err)
    }
  }

  async function savePane(side: PaneSide, saveAs: boolean): Promise<void> {
    const model = modelOf(side)
    if (!model) return
    const meta = side === 'left' ? metasRef.current.left : metasRef.current.right
    const req: SaveRequest = {
      path: saveAs ? null : meta.path || null,
      content: model.getValue(),
      encoding: meta.encoding || 'utf8',
      hadBom: meta.hadBom,
      suggestedName: meta.name || (side === 'left' ? '왼쪽.txt' : '오른쪽.txt')
    }
    // 다이얼로그 대기 중 편집될 수 있어 저장된 버전 id를 요청 시점에 고정
    const versionAtSave = model.getAlternativeVersionId()
    try {
      const res = await api.saveFile(req)
      if (!res) return
      savedIdsRef.current[side] = versionAtSave
      const fresh = side === 'left' ? metasRef.current.left : metasRef.current.right
      commitMetas(
        withMeta(metasRef.current, side, {
          ...fresh,
          path: res.path,
          name: res.name,
          dirty: model.getAlternativeVersionId() !== versionAtSave
        })
      )
    } catch (err) {
      alertError(err)
    }
  }

  async function pastePane(side: PaneSide): Promise<void> {
    const model = modelOf(side)
    if (!model) return
    try {
      const text = await navigator.clipboard.readText()
      replaceAll(model, text)
    } catch {
      window.alert('클립보드를 읽을 수 없습니다.')
    }
  }

  function clearPane(side: PaneSide): void {
    const model = modelOf(side)
    if (!model) return
    replaceAll(model, '')
    savedIdsRef.current[side] = model.getAlternativeVersionId()
    commitMetas(withMeta(metasRef.current, side, emptyPaneMeta()))
  }

  function clearAll(): void {
    clearPane('left')
    clearPane('right')
  }

  function swapPanes(): void {
    const b = bundleRef.current
    if (!b) return
    const before = metasRef.current
    const nextLeft = { ...before.right }
    const nextRight = { ...before.left }
    swapValues(b.original, b.modified)
    // dirty=false로 넘어온 판은 지금 내용을 새 기준선으로 잡아 undo 시 dirty 전환도 자연스럽게 유지
    savedIdsRef.current = {
      left: nextLeft.dirty ? -1 : b.original.getAlternativeVersionId(),
      right: nextRight.dirty ? -1 : b.modified.getAlternativeVersionId()
    }
    commitMetas({ left: nextLeft, right: nextRight })
  }

  function copyAllTo(dir: MergeDirection): void {
    const b = bundleRef.current
    if (!b) return
    if (dir === 'ltr') copyAll(b.original, b.modified)
    else copyAll(b.modified, b.original)
    const target = dir === 'ltr' ? 'right' : 'left'
    const editor = target === 'right' ? b.editor.getModifiedEditor() : b.editor.getOriginalEditor()
    editor.focus()
    setFeedback((target === 'right' ? '오른쪽' : '왼쪽') + '에 전체 적용')
  }

  function applyChunkAt(request: ChunkButtonPos, dir: MergeDirection): void {
    const b = bundleRef.current
    if (!b) return
    if (mergeBusyRef.current || !isCurrentChunk(request,b.original.getVersionId(),b.modified.getVersionId(),changesRef.current)) {setFeedback('차이를 다시 계산하고 있습니다');return}
    const change = request.change
    if (applyChunk(b.original, b.modified, change, dir)) {
      const target=dir==='ltr'?'right':'left'
      const ed=target==='right'?b.editor.getModifiedEditor():b.editor.getOriginalEditor()
      ed.focus()
      setFeedback((target==='right'?'오른쪽':'왼쪽')+'에 블록 적용')
      setReceipt({x:request.x,y:request.y,target:dir})
      window.clearTimeout(receiptTimerRef.current)
      receiptTimerRef.current=window.setTimeout(()=>setReceipt(null),800)
      highlightRef.current?.left.clear();highlightRef.current?.right.clear()
      const model=target==='right'?b.modified:b.original
      const start=Math.max(1,Math.min(target==='right'?change.modifiedStartLineNumber:change.originalStartLineNumber,model.getLineCount()))
      const sourceLines=dir==='ltr'?Math.max(1,change.originalEndLineNumber-change.originalStartLineNumber+1):Math.max(1,change.modifiedEndLineNumber-change.modifiedStartLineNumber+1)
      const end=Math.min(model.getLineCount(),start+sourceLines-1)
      flashRef.current?.[target].set([{range:new monaco.Range(start,1,end,model.getLineMaxColumn(end)),options:{className:'dd-merge-flash',isWholeLine:true}}])
      window.clearTimeout(flashTimerRef.current[target])
      flashTimerRef.current[target]=window.setTimeout(()=>flashRef.current?.[target].clear(),360)
    }
  }

  function hoverChunk(request: ChunkButtonPos | null, dir?: MergeDirection): void {
    const h=highlightRef.current,b=bundleRef.current
    if(!h||!b)return
    h.left.clear();h.right.clear()
    if(!request||!dir||mergeBusyRef.current)return
    const target=dir==='ltr'?'right':'left', c=request.change,model=target==='right'?b.modified:b.original
    const start=Math.max(1,Math.min(target==='right'?c.modifiedStartLineNumber:c.originalStartLineNumber,model.getLineCount()))
    const end=Math.max(start,Math.min(target==='right'?c.modifiedEndLineNumber:c.originalEndLineNumber,model.getLineCount()))
    h[target].set([{range:new monaco.Range(start,1,end,model.getLineMaxColumn(end)),options:{isWholeLine:true,className:'dd-merge-hover'}}])
  }

  function undoFocused(): void {
    const b=bundleRef.current
    if(!b)return
    const ed=focusedSideRef.current==='left'?b.editor.getOriginalEditor():b.editor.getModifiedEditor()
    ed.trigger('dd-toolbar','undo',null);ed.focus();setFeedback((focusedSideRef.current==='left'?'왼쪽':'오른쪽')+' 실행 취소')
  }

  function navigateTo(rawIndex: number): void {
    const b = bundleRef.current
    const changes = changesRef.current
    if (!b || changes.length === 0) return
    const n = changes.length
    const i = ((rawIndex % n) + n) % n
    commitDiff({ count: n, index: i })
    const c = changes[i]
    // 왼쪽 전용 블록(mEnd===0)은 오른쪽에 실체 줄이 없어 원본 판 기준으로 이동
    const onOriginal = c.modifiedEndLineNumber === 0
    const ed = onOriginal ? b.editor.getOriginalEditor() : b.editor.getModifiedEditor()
    const rawStart = onOriginal ? c.originalStartLineNumber : c.modifiedStartLineNumber
    const rawEnd = onOriginal ? c.originalEndLineNumber : c.modifiedEndLineNumber
    const lineCount = ed.getModel()?.getLineCount() ?? 1
    const start = Math.min(Math.max(rawStart, 1), lineCount)
    const end = Math.min(Math.max(rawEnd, start), lineCount)
    ed.revealRangeInCenter(new monaco.Range(start, 1, end, 1), monaco.editor.ScrollType.Smooth)
    ed.setPosition({ lineNumber: start, column: 1 })
    ed.focus()
  }

  function navigateBy(delta: 1 | -1): void {
    const n = changesRef.current.length
    if (n === 0) return
    const cur = diffRef.current.index
    navigateTo(cur < 0 ? (delta > 0 ? 0 : n - 1) : cur + delta)
  }

  function toggleView(): void {
    updateSettings({ renderSideBySide: !settingsRef.current.renderSideBySide })
  }
  function toggleWhitespace(): void {
    updateSettings({ ignoreTrimWhitespace: !settingsRef.current.ignoreTrimWhitespace })
  }
  function toggleWrap(): void {
    updateSettings({ wordWrap: !settingsRef.current.wordWrap })
  }
  function cycleTheme(): void {
    const cur = themeSelection(settingsRef.current)
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(cur) + 1) % THEME_CYCLE.length]
    updateSettings(themePatchFor(next))
  }

  function handleMenu(cmd: MenuCommand): void {
    switch (cmd) {
      case 'open-left':
        void openInto('left')
        break
      case 'open-right':
        void openInto('right')
        break
      case 'save-focused':
        void savePane(focusedSideRef.current, false)
        break
      case 'save-as-left':
        void savePane('left', true)
        break
      case 'save-as-right':
        void savePane('right', true)
        break
      case 'next-diff':
        navigateBy(1)
        break
      case 'prev-diff':
        navigateBy(-1)
        break
      case 'copy-all-ltr':
        copyAllTo('ltr')
        break
      case 'copy-all-rtl':
        copyAllTo('rtl')
        break
      case 'swap':
        swapPanes()
        break
      case 'clear-all':
        clearAll()
        break
      case 'toggle-view':
        toggleView()
        break
      case 'toggle-whitespace':
        toggleWhitespace()
        break
      case 'toggle-wrap':
        toggleWrap()
        break
      case 'cycle-theme':
        cycleTheme()
        break
    }
  }

  // 부팅 구독(onMenu/onOpenFiles)과 DnD 리스너는 마운트 시 1회 — 항상 최신 클로저를 보게 ref 경유
  const actionsRef = useRef({ handleMenu, loadPayload })
  actionsRef.current = { handleMenu, loadPayload }

  // Monaco 리스너 배선
  useEffect(() => {
    if (!bundle || bundle.original.isDisposed() || bundle.modified.isDisposed()) return
    const { editor, original, modified } = bundle
    const orig = editor.getOriginalEditor()
    const mod = editor.getModifiedEditor()
    savedIdsRef.current = {
      left: original.getAlternativeVersionId(),
      right: modified.getAlternativeVersionId()
    }
    undoBaseIdsRef.current = {...savedIdsRef.current}
    const disposables: monaco.IDisposable[] = []
    highlightRef.current={left:orig.createDecorationsCollection(),right:mod.createDecorationsCollection()}
    flashRef.current={left:orig.createDecorationsCollection(),right:mod.createDecorationsCollection()}

    const refreshDocState = () => {
      setLineCounts({ left: original.getLineCount(), right: modified.getLineCount() })
      setBothEmpty(original.getValueLength() === 0 && modified.getValueLength() === 0)
      setCanUndo({left:original.getAlternativeVersionId()!==undoBaseIdsRef.current.left,right:modified.getAlternativeVersionId()!==undoBaseIdsRef.current.right})
      const cur = metasRef.current
      const leftDirty = original.getAlternativeVersionId() !== savedIdsRef.current.left
      const rightDirty = modified.getAlternativeVersionId() !== savedIdsRef.current.right
      if (cur.left.dirty !== leftDirty || cur.right.dirty !== rightDirty) {
        commitMetas({ left: { ...cur.left, dirty: leftDirty }, right: { ...cur.right, dirty: rightDirty } })
      }
    }
    const contentChanged = () => {
      mergeBusyRef.current=true
      setDiffPending(true)
      setChunks(previous=>previous.map(c=>({...c,disabled:true})))
      highlightRef.current?.left.clear();highlightRef.current?.right.clear()
      refreshDocState()
    }
    disposables.push(original.onDidChangeContent(contentChanged))
    disposables.push(modified.onDidChangeContent(contentChanged))

    disposables.push(
      editor.onDidUpdateDiff(() => {
        const versions=bundle.diffSession.getVersions()
        if(!versions)return
        const result = editor.getLineChanges()
        if(result===null)return
        const changes = result
        changesRef.current = changes
        diffVersionsRef.current=versions
        mergeBusyRef.current=false
        setDiffPending(false)
        const count = changes.length
        const index = count === 0 ? -1 : Math.min(Math.max(diffRef.current.index, 0), count - 1)
        commitDiff({ count, index })
        // 분류 계약(UI-SPEC §4.2): oEnd===0 → 추가, mEnd===0 → 삭제, 그 외 수정
        const counts: BandCounts = { modified: 0, added: 0, removed: 0 }
        const modLines = modified.getLineCount()
        const markers: BandMarker[] = changes.map((c) => {
          const kind = c.originalEndLineNumber === 0 ? 'add' : c.modifiedEndLineNumber === 0 ? 'del' : 'mod'
          if (kind === 'add') counts.added += 1
          else if (kind === 'del') counts.removed += 1
          else counts.modified += 1
          return { kind, leftPct: (Math.min(Math.max(c.modifiedStartLineNumber, 1), modLines) / modLines) * 100 }
        })
        setBandCounts(counts)
        setBandMarkers(markers)
        scheduleChunks()
      })
    )

    disposables.push(mod.onDidScrollChange(scheduleChunks))
    disposables.push(orig.onDidScrollChange(scheduleChunks))
    disposables.push(orig.onDidLayoutChange(scheduleChunks))
    disposables.push(mod.onDidLayoutChange(scheduleChunks))
    const onResize = () => scheduleChunks()
    window.addEventListener('resize', onResize)

    disposables.push(
      orig.onDidFocusEditorWidget(() => {
        focusedSideRef.current = 'left'
        setActiveSide('left')
        const pos = orig.getPosition()
        if (pos) setCursor({ line: pos.lineNumber, col: pos.column })
      })
    )
    disposables.push(
      mod.onDidFocusEditorWidget(() => {
        focusedSideRef.current = 'right'
        setActiveSide('right')
        const pos = mod.getPosition()
        if (pos) setCursor({ line: pos.lineNumber, col: pos.column })
      })
    )
    disposables.push(
      orig.onDidChangeCursorPosition((e) => {
        if (focusedSideRef.current === 'left') setCursor({ line: e.position.lineNumber, col: e.position.column })
      })
    )
    disposables.push(
      mod.onDidChangeCursorPosition((e) => {
        if (focusedSideRef.current === 'right') setCursor({ line: e.position.lineNumber, col: e.position.column })
      })
    )

    refreshDocState()
    scheduleChunks()

    return () => {
      window.removeEventListener('resize', onResize)
      for (const d of disposables) d.dispose()
      highlightRef.current?.left.clear();highlightRef.current?.right.clear();highlightRef.current=null
      window.clearTimeout(receiptTimerRef.current)
      window.clearTimeout(flashTimerRef.current.left);window.clearTimeout(flashTimerRef.current.right)
      flashRef.current?.left.clear();flashRef.current?.right.clear();flashRef.current=null
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
    }
  }, [bundle, commitDiff, commitMetas, scheduleChunks])

  // 부팅: 설정 → QA 시드 또는 CLI 인자, 메뉴/두번째 인스턴스 구독
  useEffect(() => {
    if (!bundle || bundle.original.isDisposed() || bundle.modified.isDisposed()) return
    void (async () => {
      try {
        const stored = await api.getSettings()
        updateSettings(stored, false)
      } catch {
        // 설정 로드 실패 시 기본값 유지
      }
      const params = new URLSearchParams(window.location.search)
      // qasame=1 단독으로도 시드 — 백엔드 --qa-same이 qa=1 없이 쿼리를 붙여도 방어
      const qaSame = params.get('qasame') === '1'
      const qa = params.get('qa') === '1' || qaSame
      if (qa) {
        actionsRef.current.loadPayload('left', {
          path: '',
          name: 'sample-left.ts',
          content: QA_LEFT,
          encoding: 'utf8',
          hadBom: false,
          truncated: false
        })
        actionsRef.current.loadPayload('right', {
          path: '',
          name: 'sample-right.ts',
          content: qaSame ? QA_LEFT : QA_RIGHT,
          encoding: 'utf8',
          hadBom: false,
          truncated: false
        })
        // QA 스크린샷 결정성: 저장된 설정과 무관하게 typescript 강제(영속 안 함)
        updateSettings({ language: 'typescript' }, false)
      } else {
        try {
          const args = await api.getOpenedArgs()
          if (args.left) actionsRef.current.loadPayload('left', args.left)
          if (args.right) actionsRef.current.loadPayload('right', args.right)
        } catch {
          // CLI 인자 로드는 실패해도 앱 동작에 영향 없음
        }
      }
    })()
    const offMenu = api.onMenu((cmd) => actionsRef.current.handleMenu(cmd))
    const offOpenFiles = api.onOpenFiles((args) => {
      if (args.left) actionsRef.current.loadPayload('left', args.left)
      if (args.right) actionsRef.current.loadPayload('right', args.right)
    })
    return () => {
      offMenu()
      offOpenFiles()
    }
  }, [bundle, updateSettings])

  // 테마 적용: <html data-theme> + Monaco 테마 동기화
  useEffect(() => {
    const p=applyPalette(settings,systemDark)
    monaco.editor.setTheme(monacoThemeName(settings,p.scheme))
  }, [settings.theme,settings.themePreset,systemDark])

  // 설정 → 에디터 옵션 반영
  useEffect(() => {
    if (!bundle || bundle.original.isDisposed() || bundle.modified.isDisposed()) return
    const whitespaceChanged=lastWhitespaceRef.current!==settings.ignoreTrimWhitespace
    if(whitespaceChanged){mergeBusyRef.current=true;setDiffPending(true);setChunks(prev=>prev.map(c=>({...c,disabled:true})));lastWhitespaceRef.current=settings.ignoreTrimWhitespace;bundle.diffSession.invalidate()}
    bundle.editor.updateOptions({
      renderSideBySide: settings.renderSideBySide,
      ignoreTrimWhitespace: settings.ignoreTrimWhitespace,
      wordWrap: settings.wordWrap ? 'on' : 'off',
      diffWordWrap: settings.wordWrap ? 'on' : 'off',
      fontSize: settings.fontSize
    })
    reserveMergeLane(bundle.editor,settings.renderSideBySide)
    scheduleChunks()
  }, [bundle, settings.renderSideBySide, settings.ignoreTrimWhitespace, settings.wordWrap, settings.fontSize, scheduleChunks])

  // 언어: 수동 선택 우선, 자동('')이면 왼쪽 → 오른쪽 파일명 순으로 감지. 양판 공통 적용
  useEffect(() => {
    if (!bundle || bundle.original.isDisposed() || bundle.modified.isDisposed()) return
    const auto = detectLanguage(metas.left.name) ?? detectLanguage(metas.right.name) ?? 'plaintext'
    const lang = settings.language || auto
    monaco.editor.setModelLanguage(bundle.original, lang)
    monaco.editor.setModelLanguage(bundle.modified, lang)
    setEffectiveLang(lang)
  }, [bundle, settings.language, metas.left.name, metas.right.name])

  useEffect(() => {
    const left = metas.left.name
    const right = metas.right.name
    document.title = left || right ? `${left || '무제'} ↔ ${right || '무제'} — DiffDesk` : 'DiffDesk'
  }, [metas.left.name, metas.right.name])

  // 드래그&드롭: 반쪽 판정. capture로 Monaco 자체 드롭 처리보다 먼저 가로챈다
  useEffect(() => {
    const area = areaRef.current
    if (!area) return
    const sideOf = (e: DragEvent): PaneSide => {
      const rect = area.getBoundingClientRect()
      return e.clientX < rect.left + rect.width / 2 ? 'left' : 'right'
    }
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')
    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      setDropSide(sideOf(e))
    }
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget instanceof Node && area.contains(e.relatedTarget)) return
      setDropSide(null)
    }
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      e.stopPropagation()
      setDropSide(null)
      const files = Array.from(e.dataTransfer?.files ?? [])
      if (files.length === 0) return
      const loadFile = async (file: File, target: PaneSide) => {
        try {
          // Electron 32+에서 File.path 제거 — 경로는 반드시 webUtils(preload 래핑) 경유
          const path = api.getPathForFile(file)
          const payload = path ? await api.readPath(path) : await api.decodeBuffer(file.name, await file.arrayBuffer())
          actionsRef.current.loadPayload(target, payload)
        } catch (err) {
          alertError(err)
        }
      }
      if (files.length >= 2) {
        void loadFile(files[0], 'left')
        void loadFile(files[1], 'right')
      } else {
        void loadFile(files[0], sideOf(e))
      }
    }
    const swallow = (e: DragEvent) => e.preventDefault()
    area.addEventListener('dragover', onDragOver, true)
    area.addEventListener('dragleave', onDragLeave, true)
    area.addEventListener('drop', onDrop, true)
    // 영역 밖 드롭이 브라우저 파일 내비게이션으로 새지 않게
    window.addEventListener('dragover', swallow)
    window.addEventListener('drop', swallow)
    return () => {
      area.removeEventListener('dragover', onDragOver, true)
      area.removeEventListener('dragleave', onDragLeave, true)
      area.removeEventListener('drop', onDrop, true)
      window.removeEventListener('dragover', swallow)
      window.removeEventListener('drop', swallow)
    }
  }, [])

  // 브라우저 폴백 전용 단축키(Electron에서는 메뉴 액셀러레이터가 담당 — 중복 방지 위해 api 부재 시에만)
  useEffect(() => {
    if (hasNativeApi) return
    const onKeyDown = (e: KeyboardEvent) => {
      const act = actionsRef.current
      const key = e.key.toLowerCase()
      if (e.key === 'F7') {
        e.preventDefault()
        act.handleMenu(e.shiftKey ? 'prev-diff' : 'next-diff')
      } else if (e.ctrlKey && e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        act.handleMenu('copy-all-ltr')
      } else if (e.ctrlKey && e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        act.handleMenu('copy-all-rtl')
      } else if (e.ctrlKey && e.altKey && key === 'x') {
        e.preventDefault()
        act.handleMenu('swap')
      } else if (e.ctrlKey && !e.altKey && key === 's') {
        e.preventDefault()
        act.handleMenu('save-focused')
      } else if (e.ctrlKey && !e.altKey && key === 'o') {
        e.preventDefault()
        act.handleMenu(e.shiftKey ? 'open-right' : 'open-left')
      } else if (e.ctrlKey && e.key === '\\') {
        e.preventDefault()
        act.handleMenu('toggle-view')
      } else if (!e.ctrlKey && e.altKey && key === 'z') {
        e.preventDefault()
        act.handleMenu('toggle-wrap')
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  return (
    <div className="dd-app" data-side-by-side={settings.renderSideBySide}>
      <Toolbar
        diffCount={diff.count}
        language={settings.language}
        renderSideBySide={settings.renderSideBySide}
        ignoreTrimWhitespace={settings.ignoreTrimWhitespace}
        wordWrap={settings.wordWrap}
        theme={themeSelection(settings)}
        onCopyAllLtr={() => copyAllTo('ltr')}
        onCopyAllRtl={() => copyAllTo('rtl')}
        onSwap={swapPanes}
        onClear={clearAll}
        onLanguageChange={(id) => updateSettings({ language: id })}
        onToggleView={toggleView}
        onToggleWhitespace={toggleWhitespace}
        onToggleWrap={toggleWrap}
        onThemeChange={value=>updateSettings(themePatchFor(value))}
      />
      <StatusBand
        pending={diffPending}
        bothEmpty={bothEmpty}
        diffCount={diff.count}
        diffIndex={diff.index}
        counts={bandCounts}
        markers={bandMarkers}
        leftLines={lineCounts.left}
        rightLines={lineCounts.right}
        onPrev={() => navigateBy(-1)}
        onNext={() => navigateBy(1)}
        onJump={navigateTo}
      />
      <div className="dd-pane-headers">
        <PaneHeader
          side="left"
          active={activeSide==='left'}
          meta={metas.left}
          fileOpsEnabled={hasNativeApi}
          onOpen={() => void openInto('left')}
          onSave={() => void savePane('left', false)}
          onPaste={() => void pastePane('left')}
          onClearPane={() => clearPane('left')}
        />
        {settings.renderSideBySide && <div className="dd-gutter-heading">부분 병합</div>}
        <PaneHeader
          side="right"
          active={activeSide==='right'}
          meta={metas.right}
          fileOpsEnabled={hasNativeApi}
          onOpen={() => void openInto('right')}
          onSave={() => void savePane('right', false)}
          onPaste={() => void pastePane('right')}
          onClearPane={() => clearPane('right')}
        />
      </div>
      <DiffHost
        hostRef={hostRef}
        areaRef={areaRef}
        chunks={chunks}
        stripHidden={!settings.renderSideBySide}
        onApplyChunk={applyChunkAt}
        onHoverChunk={hoverChunk}
        laneLeft={laneLeft}
        receipt={receipt}
        showEmptyHint={bothEmpty}
        dropSide={dropSide}
      />
      <StatusBar
        leftLines={lineCounts.left}
        rightLines={lineCounts.right}
        diffCount={diff.count}
        diffIndex={diff.index}
        bothEmpty={bothEmpty}
        language={effectiveLang}
        leftEncoding={metas.left.encoding}
        rightEncoding={metas.right.encoding}
        cursorLine={cursor.line}
        cursorCol={cursor.col}
        feedback={feedback}
        activeSide={activeSide}
        canUndo={canUndo[activeSide]}
        onUndo={undoFocused}
      />
    </div>
  )
}
