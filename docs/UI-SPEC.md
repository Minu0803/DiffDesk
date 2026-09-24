# DiffDesk UI/동작 스펙 (에이전트 공통 계약)

로컬 전용 텍스트/코드 비교·병합 데스크톱 앱. DiffChecker 대체 + 코드 비교 특화 + 2-way 병합.
모든 UI 문자열은 **한국어**. 오프라인 완전 동작(외부 요청 0건).

## 0. 파일 소유권 (충돌 방지 — 절대 준수)

| 소유 | 경로 |
|---|---|
| 오케스트레이터(수정 금지) | `package.json`, `tsconfig.json`, `electron/tsconfig.json`, `vite.config.ts`, `index.html`, `shared/ipc.ts`, `src/env.d.ts`, `docs/*` |
| Backend | `electron/**/*.ts` (tsconfig 제외), `electron-builder.yml` |
| Frontend | `src/**` 단, `src/styles/**`·`src/themes/**`·`src/env.d.ts` 제외 |
| Designer | `src/styles/tokens.css`, `src/styles/components.css`, `src/themes/monacoThemes.ts`, `assets/icon.svg`, `assets/icon.png`, `scripts/make-icon.mjs`, `build/icon.ico`, `docs/DESIGN.md` |

공통 금지: git 명령 일체, `npm install`(의존성은 전부 설치돼 있음 — 추가 필요하면 최종 보고에 요청만), 남의 소유 파일 수정(필요하면 보고서에 요청), `c:\Users\minwoo\Documents\GitHub\**` 등 다른 프로젝트 접근.
주석은 비자명한 의도·함정·계약만. 자명한 코드 설명 주석 금지.

## 1. 레이아웃

```
┌────────────────────────────────────────────────────────────────────┐
│ .dd-toolbar                                                        │
│ [←모두] [모두→] [⇄바꾸기] [지우기]                                    │
│                        (spacer)  [언어▾] [나란히|한줄] [공백] [줄바꿈] [테마] │
├────────────────────────────────────────────────────────────────────┤
│ .dd-band (32px 상시, v1.1) — empty│same(초록 전면)│diff("차이 k개"+칩+위치리본+[▲][▼] k/n) │
├──────────────────────────────┬─────────────────────────────────────┤
│ .dd-pane-header--left        │ .dd-pane-header--right              │
│ 파일명 ● [EUC-KR]  열기 저장 붙여넣기 비우기 │ (동일)                 │
├──────────────────────────────┴─────────────────────────────────────┤
│ .dd-editor-area (position:relative)                                │
│   .dd-diff-host  ← Monaco DiffEditor(양쪽 편집 가능)                 │
│   .dd-chunk-strip ← 두 판 경계 위 오버레이, 차이 블록마다 [→][←] 버튼   │
│   .dd-empty-hint  ← 양쪽 다 비었을 때 안내 오버레이                    │
│   .dd-drop-overlay--left/--right ← 드래그 중 반쪽 하이라이트           │
├────────────────────────────────────────────────────────────────────┤
│ .dd-statusbar: 왼쪽 120줄 · 오른쪽 118줄 | 차이 12개 (3/12) | TypeScript │
│                | 좌 UTF-8 · 우 EUC-KR | Ln 42, Col 7                │
└────────────────────────────────────────────────────────────────────┘
```

창: 기본 1440×900, 최소 960×600, 네이티브 프레임. 다크가 기본 느낌(테마 'system').

## 2. 클래스 인벤토리 (Frontend가 사용, Designer가 스타일 구현)

- `.dd-app` — 루트. grid rows: toolbar / band / pane-headers / editor-area(1fr) / statusbar
- `.dd-toolbar`, `.dd-toolbar__group`, `.dd-toolbar__divider`, `.dd-toolbar__spacer`
- `.dd-btn` 기본 버튼. 변형: `.dd-btn--icon`(아이콘 전용), `.dd-btn--ghost`. 상태: `[disabled]`, `.is-active`(토글 켜짐), `:focus-visible`
- `.dd-select` — 네이티브 select 스타일링 (언어 선택)
- `.dd-band`(상시 32px 행, v1.1) + 상태 `--empty`/`--same`/`--diff`, `__verdict`(aria-live), `__sub`, `__chip`+`--mod/--add/--del`(0이면 미렌더), `__ribbon`, `__mark`(button, 프론트는 inline `left%`만 — 중심정렬 transform은 CSS 소유)+`--mod/--add/--del`+`.is-current`, `__nav`(내부 `.dd-btn dd-btn--icon`), `__counter`. 구 `.dd-diff-counter`(툴바 카운터)는 v1.1에서 제거
- `.dd-pane-headers`(2열 grid), `.dd-pane-header`, `--left`/`--right`, `__name`, `__dirty`(● 수정됨 점), `__badge`(인코딩), `__actions`
- `.dd-editor-area`, `.dd-diff-host`
- `.dd-chunk-strip`(absolute 오버레이, pointer-events:none), `.dd-chunk-btn`(pointer-events:auto), `--ltr`(→), `--rtl`(←)
- `.dd-statusbar`, `.dd-statusbar__item`, `.dd-statusbar__sep`, `.dd-statusbar__dot`(+`is-same|is-diff|is-empty`, v1.1)
- `.dd-drop-overlay`, `--left`, `--right`, 표시 시 `.is-visible`
- `.dd-empty-hint`

## 3. 디자인 토큰 계약 (Designer가 정의, Frontend/Monaco가 소비)

`:root[data-theme="light"]`와 `:root[data-theme="dark"]` 두 벌 모두 정의:

- 타이포: `--dd-font-ui`(Segoe UI, Malgun Gothic 계열), `--dd-fs-ui`(13px), `--dd-fs-small`(11~12px)
- 치수: `--dd-toolbar-h`(42px), `--dd-band-h`(32px, v1.1), `--dd-paneheader-h`, `--dd-statusbar-h`, `--dd-radius`(10px), `--dd-radius-sm`, `--dd-gap`
- 색: `--dd-bg`, `--dd-bg-elev`, `--dd-bg-hover`, `--dd-bg-active`, `--dd-fg`, `--dd-fg-muted`, `--dd-fg-faint`,
  `--dd-border`, `--dd-border-strong`, `--dd-accent`, `--dd-accent-hover`, `--dd-accent-fg`, `--dd-focus-ring`,
  `--dd-danger`, `--dd-added`, `--dd-added-bg`, `--dd-removed`, `--dd-removed-bg`, `--dd-modified`, `--dd-modified-bg`(v1.1 앰버 쌍),
  `--dd-chunkbtn-bg`, `--dd-chunkbtn-fg`, `--dd-chunkbtn-border`, `--dd-chunkbtn-hover-bg`,
  `--dd-shadow`, `--dd-scrollbar-thumb`, `--dd-drop-overlay-bg`, `--dd-drop-overlay-border`
- 모노 폰트 원천: `src/themes/monacoThemes.ts`의 `MONO_FONT_STACK` (아래 §9). tokens.css의 `--dd-font-mono`도 같은 값으로.

테마 적용 방식: 렌더러가 `<html data-theme="dark|light">`를 세팅. 'system'이면 `matchMedia('(prefers-color-scheme: dark)')` — Electron `nativeTheme.themeSource`를 메인이 바꾸면 이 matchMedia가 따라오므로 렌더러는 이것만 보면 됨.

## 4. 핵심 동작

### 4.1 비교(디프)
- Monaco `createDiffEditor` 하나로 두 판 렌더. 옵션: `originalEditable: true`(왼쪽도 편집), `automaticLayout: true`, `renderSideBySide`(설정), `ignoreTrimWhitespace`(설정), `mouseWheelZoom: true`, `renderMarginRevertIcon: false`(자체 병합 버튼 사용), minimap 켬, `diffWordWrap`/`wordWrap`(설정)
- 입력 즉시 라이브 재계산(별도 "비교" 버튼 없음)
- 차이 개수/네비게이션 원천: `diffEditor.getLineChanges()` + `onDidUpdateDiff` (구버전 `createDiffNavigator`는 제거된 API — 쓰지 말 것)

### 4.2 병합 (chunk 복사) — 이 앱의 핵심 기능
`.dd-chunk-strip`은 두 에디터 경계 위 세로 오버레이. 각 lineChange마다 [→](왼→오 복사), [←](오→왼 복사) 미니 버튼 쌍.

**위치 계산**: 경계 x = `getOriginalEditor().getDomNode().getBoundingClientRect().right` − editor-area rect.left. 각 청크 y = `getModifiedEditor().getTopForLineNumber(max(modifiedStartLineNumber,1)) − getScrollTop()`. 갱신 트리거: modified 에디터 `onDidScrollChange`, `onDidUpdateDiff`, 양쪽 `onDidLayoutChange`, 창 리사이즈. 뷰포트 밖 버튼은 숨김. 한줄(inline) 모드에서는 스트립 전체 숨김.

**ILineChange 4케이스 적용 매트릭스** (o=original(왼), m=modified(오), End===0이 특수):

| 케이스 | 의미 | → (왼→오) | ← (오→왼) |
|---|---|---|---|
| oEnd>0, mEnd>0 | 수정 블록 | m의 mStart..mEnd 줄을 o의 oStart..oEnd 텍스트로 교체 | o의 oStart..oEnd 줄을 m의 mStart..mEnd 텍스트로 교체 |
| oEnd===0 | 오른쪽에만 추가된 블록 | m의 mStart..mEnd 줄 삭제 | m의 그 블록을 o의 oStart줄 **뒤에** 삽입 (oStart===0이면 맨 앞) |
| mEnd===0 | 왼쪽에서 삭제된 블록 | o의 oStart..oEnd 블록을 m의 mStart줄 **뒤에** 삽입 (mStart===0이면 맨 앞) | o의 oStart..oEnd 줄 삭제 |

**편집 적용은 반드시 `model.pushEditOperations`** (undo 스택 유지 — Ctrl+Z 가능해야 함). 범위 요령:
- 줄 교체: `Range(s, 1, e, model.getLineMaxColumn(e))`
- L줄 뒤 삽입: L===0 → `(1,1)`에 `text + '\n'`, 아니면 `(L, getLineMaxColumn(L))`에 `'\n' + text`
- s..e줄 삭제: e < lineCount → `Range(s,1,e+1,1)`, e===lineCount → `Range(s>1 ? s-1 : 1, s>1 ? getLineMaxColumn(s-1) : 1, e, getLineMaxColumn(e))`

**모두 →/←**: 대상 모델 전체 범위를 원본 값으로 pushEditOperations 한 방(undo 한 번에 복귀).
적용 후 디프는 자동 재계산 → `onDidUpdateDiff`에서 버튼 재배치.

### 4.3 파일 열기/저장/인코딩
- 판별 열기: 다이얼로그(`api.openFile()` → 대상 판에 로드), 드래그&드롭(왼쪽 반=왼판, 오른쪽 반=오른판), 붙여넣기 버튼(클립보드 전체 교체 — pushEditOperations로 undo 가능하게)
- 드롭 파일: `api.getPathForFile(file)`로 경로 획득 → `api.readPath()`. 경로가 ''(예외 케이스)면 `file.arrayBuffer()` → `api.decodeBuffer()`. **Electron 32+에서 `File.path`는 제거됨 — 반드시 webUtils 경유**
- 인코딩: 메인이 jschardet로 감지(신뢰도 < 0.8이면 utf8 폴백) + BOM 처리. CP949/EUC-KR 한글 파일 필수 지원. 저장은 원본 인코딩·BOM 유지
- 저장: Ctrl+S = 포커스된 판(기본 왼쪽). 판 헤더 저장 버튼 각각. 경로 없으면 다른 이름으로 저장. 저장/로드 시점의 `getAlternativeVersionId()` 대비로 dirty(●) 추적
- `truncated: true`면 판 헤더 배지에 "잘림" 표기(20MB 초과)
- 창 제목: `왼쪽이름 ↔ 오른쪽이름 — DiffDesk` (파일 없으면 `DiffDesk`) — `document.title`로

### 4.4 도구줄 동작
- 이전/다음 차이(v1.1: 버튼·카운터는 밴드로 이동, 툴바에서 제거): currentIndex 순환, 해당 청크를 `revealRangeInCenter` + 커서 이동. 카운터 "k / n"은 `.dd-band__counter`
- 좌우 바꾸기: 두 모델의 **값**·파일 메타(경로/이름/인코딩/dirty)를 서로 교환 (모델 교체 아님, pushEditOperations로)
- 지우기: 양판 비우기(undo 가능) + 파일 메타 초기화
- 언어 select: '자동' + 주요 언어 큐레이션(plaintext, typescript, javascript, json, html, css, scss, xml, markdown, sql, csharp, java, python, shell, powershell, yaml, ini, cpp, go, rust, php, ruby, kotlin, swift, dockerfile). 자동=확장자 매핑(`monaco.languages.getLanguages()`의 extensions 활용), 수동 선택은 양판 공통 적용
- 보기 토글: 나란히↔한줄(`renderSideBySide`), 공백 무시(`ignoreTrimWhitespace`), 자동 줄바꿈
- 테마 버튼: system → light → dark 순환, 아이콘/라벨로 현 상태 표시
- 설정 변경은 300ms 디바운스로 `api.patchSettings()` 저장, 부팅 시 `getSettings()` 적용

### 4.5 상태줄
`왼쪽 {n}줄 · 오른쪽 {m}줄` | `● 차이 {k}개 ({i}/{k})`(v1.1: 앞에 `.dd-statusbar__dot` 상태 점) | 언어 | `좌 {enc} · 우 {enc}` | `Ln {l}, Col {c}`(포커스 판 커서)

### 4.6 시작/CLI/QA 모드
- 부팅 시 `api.getOpenedArgs()` → 있으면 좌/우 로드. `api.onOpenFiles` 구독(두 번째 인스턴스 인자)
- **QA 모드**: URL 쿼리 `?qa=1`이면 좌/우에 내장 샘플 시드(TypeScript, 40줄 내외, 한글 주석 포함, 수정·추가·삭제 블록과 긴 줄 1개 포함) + 언어 typescript. 스크린샷 QA의 기준 화면이므로 반드시 구현
- **QA 동일 상태(v1.1)**: `qasame=1`이면 오른쪽 판에도 `QA_LEFT`를 시드해 "완전히 동일" 상태를 만든다(`qasame=1` 단독으로도 시드 동작 — 백엔드 `--qa-same`이 `qa=1&qasame=1`을 부착)

### 4.7 스테이터스 밴드 (v1.1)
- 상시 32px 행(툴바 아래). 상태 판정 우선순위: 양판 모두 빈 문서 → `--empty`("비교할 내용이 없습니다") / 차이 0 → `--same`(초록 전면 "✓ 두 문서가 완전히 동일합니다", 좌우 줄수 같을 때만 보조 "{n}줄 모두 일치") / 차이 ≥1 → `--diff`("차이 {k}개" + 분해 칩 + 위치 리본 + 네비)
- 분해 분류(§4.2 매트릭스와 동일 기준): `originalEndLineNumber===0`→추가, `modifiedEndLineNumber===0`→삭제, 그 외→수정. 값이 0인 칩은 렌더하지 않음
- 위치 리본: 마커 left% = `clamp(max(modifiedStartLineNumber,1), 1, modified줄수) / modified줄수 × 100`. 마커는 button(클릭=`navigateTo(i)`, title/aria-label "차이 {i+1}로 이동"), 현재 인덱스에 `.is-current`. 프론트는 inline `left%`만 지정 — 중심정렬 `transform`은 CSS가 소유하므로 inline transform 금지
- 상태줄 점 연동: `is-same`=added색, `is-diff`=modified색, `is-empty`=faint색

## 5. 키보드 (메뉴 액셀러레이터 경유 — 메인의 메뉴가 MenuCommand를 renderer로 send)

| 키 | 동작 | MenuCommand |
|---|---|---|
| Ctrl+O / Ctrl+Shift+O | 왼쪽/오른쪽 열기 | open-left / open-right |
| Ctrl+S | 포커스 판 저장 | save-focused |
| F7 / Shift+F7 | 다음/이전 차이 | next-diff / prev-diff |
| Ctrl+Alt+Right / Left | 모두 오른쪽으로 / 왼쪽으로 | copy-all-ltr / copy-all-rtl |
| Ctrl+Alt+X | 좌우 바꾸기 | swap |
| Ctrl+\\ | 나란히↔한줄 | toggle-view |
| Alt+Z | 자동 줄바꿈 | toggle-wrap |

메뉴 구조(한국어): 파일(왼쪽 파일 열기, 오른쪽 파일 열기, ─, 저장, 왼쪽 다른 이름으로 저장, 오른쪽 다른 이름으로 저장, ─, 종료) / 비교(다음 차이, 이전 차이, ─, 모두 오른쪽으로 복사, 모두 왼쪽으로 복사, ─, 좌우 바꾸기, 모두 지우기) / 보기(나란히·한줄 전환, 공백 무시, 자동 줄바꿈, ─, 테마 전환, ─, 개발자 도구 F12) / 도움말(DiffDesk 정보)

## 6. 한국어 문자열 (양 에이전트 공통 사용)

열기 · 저장 · 붙여넣기 · 비우기 · 이전 차이 · 다음 차이 · 모두 왼쪽으로 · 모두 오른쪽으로 · 좌우 바꾸기 · 지우기 · 나란히 보기 · 한 줄 보기 · 공백 무시 · 자동 줄바꿈 · 테마: 시스템/라이트/다크 · 언어: 자동 · 차이 {k}개 · 차이 없음 · 수정됨 · 잘림 · 왼쪽(원본) · 오른쪽(대상) · "이 블록을 오른쪽으로 복사" · "이 블록을 왼쪽으로 복사" · 빈 화면 안내: "파일을 끌어다 놓거나, 붙여넣거나, 열기로 시작하세요" · (v1.1 밴드) "✓ 두 문서가 완전히 동일합니다" · "{n}줄 모두 일치" · "비교할 내용이 없습니다" · 수정 {n} · 추가 {n} · 삭제 {n} · "차이 {i}로 이동"

## 7. Backend 상세 (electron/)

- `main.ts`: BrowserWindow(1440×900, min 960×600, `show:false`+`ready-to-show`, `backgroundColor` 테마 따라 #17181d/#ffffff — v1.1부터 tokens `--dd-bg`·monaco `editor.background`와 3자 동기 계약, 단독 변경 금지. 설정 먼저 읽고 창 생성), `webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: false }` — **sandbox:false 필수** (preload가 컴파일된 `../shared/ipc.js`를 require하므로 sandbox에선 불가)
- 로드: `VITE_DEV_SERVER_URL` 있으면 그 URL(+`?qa=1` 필요 시), 없으면 `loadFile('dist/index.html', { query })`
- 단일 인스턴스: `requestSingleInstanceLock`, second-instance에서 argv 파일 인자 파싱 → `dd:open-files` send + 창 포커스
- CLI 인자: exe 뒤 파일 경로 최대 2개(왼/오). `--`로 시작하는 플래그 제외
- `--qa-screenshot=<절대경로.png>`: qa=1 강제, did-finish-load 후 2500ms 대기 → `webContents.capturePage()` → PNG 저장 → `app.exit(0)`. 15초 안전 타임아웃 시 exit(1). 스크립트 QA용
- `--qa-same`(v1.1): 로드 쿼리에 `qa=1&qasame=1` 부착(단독 사용 시에도 qa=1 동반). `--qa-screenshot`과 조합해 "완전히 동일" 상태 캡처. 파일 인자 파싱은 `--` 접두 스킵이라 오인 없음
- 창 bounds 저장/복원(settings.json에 windowBounds — Settings 타입 밖 확장 필드로 저장 파일에만)
- `encoding.ts`: jschardet 감지(GB2312→euc-kr 같은 한국어 환경 오탐 보정 포함해 cp949/euc-kr/utf8/utf16le 위주로 정규화, 신뢰도<0.8→utf8), BOM 감지·제거 후 `hadBom` 플래그, iconv-lite decode/encode, MAX_FILE_BYTES 초과 시 앞부분만+truncated
- `settings.ts`: `app.getPath('userData')/settings.json`, 손상 시 기본값 복구. theme 패치 시 `nativeTheme.themeSource` 반영
- `menu.ts`: §5 메뉴. 명령은 포커스 창 webContents로 `dd:menu` send
- `preload.ts`: `contextBridge.exposeInMainWorld('api', ...)` — `shared/ipc.ts`의 `DiffDeskApi` 시그니처와 채널명 **정확히** 일치. `getPathForFile`은 `webUtils.getPathForFile` try/catch 래핑
- `electron-builder.yml`: appId `com.minwoo.diffdesk`, productName DiffDesk, output `release`, files `dist/**`+`dist-electron/**`, win icon `build/icon.ico`, target: `dir`(x64) + `portable`(x64, artifactName `DiffDesk-portable.exe`), `npmRebuild: false`
- 다이얼로그 필터: 모든 파일(*.*) + 텍스트/코드 묶음

## 8. Frontend 상세 (src/)

- `main.tsx`: `./styles/tokens.css` → `./styles/components.css` 순서로 import, Monaco 환경 설정, `registerMonacoThemes(monaco)` 호출 후 React mount
- **Monaco + Vite worker 설정** (이 형태 그대로, 함정 많음):
```ts
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}
```
- ts/js 진단은 끄기(비교 도구에 빨간 밑줄 소음): `monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: true })` + javascriptDefaults 동일
- 컴포넌트 분리는 자유. 권장: `App.tsx`, `components/Toolbar.tsx`, `components/PaneHeader.tsx`, `components/DiffHost.tsx`, `components/ChunkStrip.tsx`, `components/StatusBar.tsx`, `hooks/useDiffEditor.ts`, `lib/mergeChunks.ts`, `lib/langDetect.ts`, `qa/sample.ts`
- Monaco 편집기 폰트: `fontFamily: MONO_FONT_STACK`(themes에서 import), `fontSize: settings.fontSize`
- 테마 전환 시 `monaco.editor.setTheme(MONACO_THEME_DARK|LIGHT)` + `<html data-theme>` 동기화
- beforeunload에서 dirty 경고는 생략(v1) — 로컬 도구 단순성 우선

## 9. Designer 상세

- `src/themes/monacoThemes.ts` — 정확히 이 export 시그니처:
```ts
import type * as monaco from 'monaco-editor'
export const MONACO_THEME_LIGHT = 'diffdesk-light'
export const MONACO_THEME_DARK = 'diffdesk-dark'
export const MONO_FONT_STACK = "'Cascadia Code', 'D2Coding', Consolas, 'Courier New', monospace"
export function registerMonacoThemes(m: typeof monaco): void
```
`defineTheme`로 두 테마 등록. base는 'vs'/'vs-dark', diff 관련 색(`diffEditor.insertedTextBackground`, `diffEditor.removedTextBackground`, `diffEditor.insertedLineBackground`, `diffEditor.removedLineBackground` 등)과 배경·라인넘버·선택 색을 tokens.css 팔레트와 일치시킬 것. **colors 값은 `#RRGGBB` 또는 `#RRGGBBAA` 형식만 허용(css var 사용 불가)**
- `tokens.css`: §3 토큰 전부 두 테마로. 다크 기본 무드는 VS Code 다크 계열의 차분한 개발자 도구 톤, 라이트는 눈부심 없는 종이 톤
- `components.css`: §2 클래스 전부. 밀도 높은 컴팩트 UI(도구줄 ~40px), hover/active/disabled/focus-visible 상태 완비, 커스텀 스크롤바(webkit), 청크 버튼은 20~22px 원형 계열 미니 버튼으로 배경 위에서도 또렷하게(테두리+그림자), 드롭 오버레이는 반투명 accent
- 아이콘: `assets/icon.svg`(두 문서 판 + 좌우 화살표 모티브, 다크·라이트 배경 모두에서 식별), `scripts/make-icon.mjs`로 @resvg/resvg-js 래스터화(16,24,32,48,64,128,256) → png-to-ico로 `build/icon.ico` 생성, 256px `assets/icon.png`도 저장. **스크립트를 실제 실행해 ico 생성까지 완료할 것**
- `docs/DESIGN.md`: 색·타이포·스페이싱 결정 요약(간결히)

## 10. 수용 기준 (각자 최종 보고에 결과 명시)

- 공통: 소유 파일만 수정, `npx tsc --noEmit -p tsconfig.json`(renderer측) / `-p electron/tsconfig.json`(backend측) 통과
- Backend: `npm run build:electron` 통과, 채널명·시그니처가 shared/ipc.ts와 일치
- Frontend: `npm run build:renderer` 통과, qa=1 시드 동작, 병합 4케이스 로직 자체 점검(스왑·전체복사 포함)
- Designer: `node scripts/make-icon.mjs` 성공해 `build/icon.ico` 실존, 토큰·클래스 커버리지 100%(§2·§3 대조)
