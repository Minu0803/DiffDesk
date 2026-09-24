# DiffDesk 진행 상태

로컬 텍스트/코드 비교·병합 데스크톱 앱 (Electron + Monaco). GitHub 미사용, 로컬 전용.

## 상태

| 단계 | 상태 | 비고 |
|---|---|---|
| 스택 결정 (Electron 33 + Vite 5 + React 18 + Monaco 0.52) | ✅ | Node v24.14.0 확인 |
| 뼈대 스캐폴드 (설정/IPC 계약/스펙) | ✅ | 디자이너 파일 3종은 스텁 선배치 |
| npm install | ✅ | exit 0 |
| UI-SPEC 작성 | ✅ | docs/UI-SPEC.md — 소유권·병합 매트릭스·토큰 계약 포함 |
| 병렬 에이전트 — Designer | ✅ | 토큰·컴포넌트 CSS, Monaco 테마, icon.ico(7사이즈) 생성·검증 완료 |
| 병렬 에이전트 — Backend | ✅ | IPC 7채널·인코딩 스모크 10항목·Electron E2E 3회 통과. ⚠QA 시 `ELECTRON_RUN_AS_NODE` 환경변수 제거 필요 |
| 병렬 에이전트 — Frontend | ✅ | 병합 유닛 18/18, CDP 실구동 E2E 25/25 PASS |
| 통합 + typecheck + 런타임 QA | ✅ | 통합 결함 2건 수정: ①Monaco 0.52 gutter 컬럼+focusBorder outline(→ renderGutterMenu:false + focusBorder 투명) ②.dd-chunk-btn position:absolute로 →/← 겹침(→ 제거). 다크/라이트 스크린샷 QC 통과 |
| exe 빌드 (win-unpacked + portable) + 바탕화면 바로가기 | ✅ | winCodeSign symlink 이슈 → 캐시 수동 구성으로 해결. 패키징 exe QA 스크린샷 PASS, 아이콘 임베드 확인, 바로가기 생성, 프로필 초기화 완료 |

## 최종 산출물 (2026-07-11 완료)

- 실행: 바탕화면 `DiffDesk` 바로가기 → `release\win-unpacked\DiffDesk.exe` (282MB 폴더, 즉시 실행)
- 단일 파일: `release\DiffDesk-portable.exe` (73MB, 실행 시 임시 해제라 시작 몇 초 느림)
- 재빌드: `npm run pack`
- ⚠ 함정 기록: ①Monaco 0.52 디프 gutter는 `renderGutterMenu:false`로 꺼야 함(자체 병합 버튼과 중복+focusBorder outline 박스) ②불투명 `focusBorder`는 에디터/거터에 1px outline을 그림 → 투명 고정 ③`.dd-chunk-btn`에 position:absolute 금지(쌍 겹침) ④electron-builder winCodeSign 캐시는 darwin symlink 때문에 개발자모드 없인 자동 해제 실패 → `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0`에 수동 추출(이미 구성됨, 재빌드 시 재발 안 함) ⑤GUI exe를 PowerShell `&`로 부르면 대기 안 함 → `Start-Process -Wait` ⑥이 세션 셸에 `ELECTRON_RUN_AS_NODE=1` 누수 → electron 실행 전 제거 필요

## v1.1 — 상단 비교 결과 밴드 + 인디고 리프레시 (2026-07-15)

- 요구: 상단 중앙에 "완전히 동일" 명확 표시 + 차이 개수 표시 + 전체 디자인 개선. 시안 3종 아티팩트 중 사용자가 **B(스테이터스 밴드)** 선택 → FE/BE/Designer 3에이전트 병렬 구현
- `.dd-band` 32px 상시 행(empty/same/diff), 수정·추가·삭제 분해 칩(0이면 미렌더), 위치 리본(마커 클릭=해당 차이로 이동, 현재 마커 강조), 네비게이션 툴바→밴드 이동, 상태줄 상태 점(`.dd-statusbar__dot`)
- 팔레트: 인디고 액센트, 다크 베이스 `#17181d` — **3자 동기 계약**(tokens `--dd-bg` / monaco `editor.background` / main.ts `backgroundColor`, 단독 변경 금지). 라이트 `--dd-modified-bg`는 `#fff8c5`(4.52:1 AA — `#fff3c4`는 4.37 미달)
- QA: `--qa-same` 플래그 신설(`qa=1&qasame=1`, 렌더러는 오른쪽 판에도 QA_LEFT 시드) → 동일 상태 자동 캡처 가능. 라이트/다크 × diff/same 4장 + 패키징 exe 1장 QC PASS
- typecheck·build:renderer·build:electron·pack 전부 통과, 바로가기(win-unpacked)·portable 모두 갱신

## 재개 프롬프트 (다른 채팅에서 이어갈 때)

> 바탕화면 `C:\Users\minwoo\Desktop\DiffDesk` 프로젝트(Electron+Monaco 텍스트/코드 비교·병합 앱)를 이어서 진행해줘.
> `docs\PROGRESS.md`와 `docs\UI-SPEC.md`를 먼저 읽고, 상태 표에서 미완료 단계부터 계속해.
> 완료 기준: `npm run typecheck` 통과 → `npm run pack`으로 release\win-unpacked\DiffDesk.exe 생성 → 바탕화면 바로가기.
