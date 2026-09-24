# DiffDesk 디자인 결정 요약

밀도 높고 차분한 프로 개발 도구 룩. **시안 B "스테이터스 밴드 + 인디고 소프트 리프레시" 적용**: 액센트 파랑→인디고, 다크 베이스는 블루블랙(#17181d, 백엔드 창 `backgroundColor`와 동기 계약), 툴바 아래 32px 비교 결과 밴드 추가, 컨트롤은 무테 소프트 스타일.
CSS 토큰(`src/styles/tokens.css`)이 단일 원천이며, Monaco 테마(`src/themes/monacoThemes.ts`)는 같은 팔레트의 hex를 직접 기입(동기 수정 필수).

## 색

| 역할 | 다크 | 라이트 | 비고 |
|---|---|---|---|
| 바탕 `--dd-bg` | `#17181d` | `#ffffff` | 다크는 백엔드 창 `backgroundColor`·Monaco `editor.background`와 3자 동기 |
| 크롬(툴바·밴드·헤더·상태줄) `--dd-bg-elev` | `#1e2027` | `#f8f9fc` | 에디터와 1단계 분리 |
| hover / active | `#262a34` / `#303543` | `#eef0f7` / `#e2e5f1` | 상태 단계는 밝기 1스텝씩 |
| 본문 `--dd-fg` | `#d7dae0` (11.6:1) | `#1f2328` (15.0:1) | 괄호는 elev 배경 대비 |
| 보조 `--dd-fg-muted` | `#9aa1ad` (6.2:1) | `#59636e` (5.8:1) | 상태줄·카운터·안내 문구 |
| 액센트 `--dd-accent`(+hover) | `#8b93ff` / `#7a82f5` | `#5558ce` / `#4649bd` | 인디고. 다크는 밝은 채움이라 `--dd-accent-fg:#1b1d2a`(잉크) 6.1/5.1, 라이트는 흰 글자 5.7/6.8 — 전 상태 AA |
| 포커스 링 `--dd-focus-ring` | `#8b93ff` (6.5:1) | `#5558ce` (5.7:1) | 액센트와 동색 통합(≥3:1 여유 충분) |
| 추가 `--dd-added` | `#57ab5a` (5.7:1) | `#1a7f37` (4.8:1) | GitHub diff 계열 저채도 녹색 |
| 삭제 `--dd-removed` | `#ec6a5e` (5.3:1) | `#cf222e` (5.1:1) | 저채도 적색, 네온 지양 |
| 수정 `--dd-modified`(+bg) | `#e0b13e` / `#3a3320` | `#9a6700` / `#fff3c4` | 신규 amber 계열. elev 대비 8.2/4.6, 칩 bg 위 6.3/**4.4(경계선 — 11px 볼드+1px 링으로 보강)** |

- 디프 배경은 Monaco에서 알파 오버레이로: 다크 `#2ea043`/`#e5534b`, 라이트 `#2ea043`/`#cf222e` — 리프레시에서도 녹/적 톤 유지.
- Monaco 미세 정합: 다크 거터 `#6f7590`·셀렉션 `#3a3f6e`·라인 하이라이트 `#a5adff0f`(인디고 틴트), 라이트 위젯/보더 `#f8f9fc`/`#dcdfea`·셀렉션 `#c7ccf2`. `focusBorder`는 투명 고정(불투명이면 디프 판에 outline 박스 — 검증된 함정).
- 텍스트성 색은 amber 칩(라이트) 1건 제외 전부 WCAG AA(4.5:1) 이상. `--dd-fg-faint`는 힌트/비활성 전용(AA 비적용 대상).

## 타이포

- UI: `'Segoe UI', 'Malgun Gothic', system-ui, sans-serif` — 웹폰트 없음, 완전 오프라인.
- 코드: `MONO_FONT_STACK = 'Cascadia Code', 'D2Coding', Consolas, 'Courier New', monospace` — `--dd-font-mono`와 동일 값 유지 계약.
- 크기 2단: `--dd-fs-ui` 13px, `--dd-fs-small` 12px. 밴드 verdict 13px/700, 칩 11px/700. 숫자는 `tabular-nums`.

## 스페이싱·치수

- 세로 리듬: 도구줄 42(`--dd-toolbar-h`, 40→42) / **밴드 32(`--dd-band-h`, 신규)** / 판 헤더 30 / 상태줄 26. 앱 그리드는 5행.
- 라운드: 컨트롤 6(`--dd-radius-sm`, 소프트 무드로 확대)·오버레이 10(`--dd-radius`, 6→10). 칩·배지는 999px 알약.

## 비교 결과 밴드 (신규)

- `.dd-band` 3상태: `--empty` = elev 바탕 + muted 문구 / `--same` = **줄 전체 초록**(`--dd-added-bg` 바탕 + `--dd-added` 글자, verdict 볼드) / `--diff` = elev 바탕 + 왼쪽 3px 앰버 바(`inset box-shadow` — border-left와 달리 상태 전환 시 콘텐츠 밀림 없음).
- `.dd-band__chip` 20px 알약(`--mod`/`--add`/`--del`): semantic 색 글자 + 연한 semantic bg + 같은 색 45% 링(`color-mix`, 솔리드 폴백 병기).
- `.dd-band__ribbon` 6px 트랙(`--dd-bg-active`, radius 3) 위에 `.dd-band__mark` 8×12px 마커 **button**(UA 리셋). 좌표는 프론트 inline `left`, 중심 정렬(translate)은 CSS 소유. `::after`로 20×24 히트영역, `.is-current`는 1.25배 + elev 헤일로/muted 링, hover는 brightness. `:focus-visible` 링 적용.
- `.dd-band__counter`가 툴바 `.dd-diff-counter`(제거됨)의 tabular-nums 스타일 승계. `.dd-statusbar__dot` 7px 원이 같은 semantic으로 상태줄에 에코(`is-same`/`is-diff`/`is-empty`).

## 컴포넌트 결정

- 버튼: 소프트 폴리시 — 상시 외곽선 제거(투명 보더 슬롯 유지로 1px 점프 방지), hover/active는 면(bg) 단계. 토글 켜짐(`.is-active`)은 인디고 솔리드 + `--dd-accent-fg`. 셀렉트는 값 홀더라 외곽선 유지.
- 청크 병합 버튼: 22px 원형 유지, 팔레트만 추종(다크 bg `#2c303b`, hover는 액센트 채움 + 잉크 글자).
- 드롭 오버레이: 반투명 인디고 면 + dashed 아웃라인(-6px), 120ms 페이드.
- 스크롤바: 다크 썸을 슬레이트(`#7e8492`)로 이동해 블루블랙과 정합, Monaco `scrollbarSlider.*` 동일 톤.
- 테마 부트스트랩: 다크 토큰 `:root` 병기(첫 프레임 플래시 방지) + `color-scheme` 지정 유지.
- `prefers-reduced-motion: reduce`에서 전 트랜지션 제거(밴드 마커 포함).

## 아이콘

- 모티브: 어두운 슬레이트 타일 위 두 문서 판(왼쪽 삭제=적색 바, 오른쪽 추가=녹색 바) + 중앙 파란 원형 배지의 좌우 교환 화살표.
- 배지 바깥에 타일색 헤일로를 둬 판과 분리 — 16px에서도 "밝은 두 판 + 파란 점" 실루엣 유지. 타일이 자체 배경을 가져 다크/라이트 바탕 모두 식별.
- `scripts/make-icon.mjs`: resvg로 16·24·32·48·64·128·256 래스터 → `build/icon.ico`, 256px → `assets/icon.png`.
