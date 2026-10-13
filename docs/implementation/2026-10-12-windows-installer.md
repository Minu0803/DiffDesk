# Windows 설치 프로그램 — 2026-10-12

블랙 테마·비교 가독성 개선을 포함한 Windows x64 설치 프로그램을 추가했다. 아래는 설치 프로그램 전용 규칙을 적용하기 전의 기록이다. 현재 배포는 `2026-10-13-installer-only.md`를 참조한다.

## 당시 배포 파일

- 설치 파일: `release/installer-2026-10-12/DiffDesk-Setup-1.0.0.exe`
- 크기: 84,583,511 bytes.
- 설치 파일 SHA-256: `3ecbef48260d90cbf0bbe12980b2bc08a8089f3ae3a3725e95cb3c255f490b4d`
- 당시 ZIP: `release/installer-2026-10-12/DiffDesk-fast-start.zip`
- ZIP SHA-256: `337b1fc32cdcf8deac1c77cd1662e4e3dd4cbe31aaea717aa4568b54d163a350`

## 설치 동작

NSIS one-click 방식으로 현재 사용자 계정에 설치한다. 압축 해제가 필요 없고, 바탕화면·시작 메뉴 바로가기를 만들며 설치 완료 후 앱을 연다. Windows 설치된 앱 목록에는 `DiffDesk 1.0.0`으로 등록된다. 제거 프로그램도 제공하며 앱 설정은 보존한다. 현재 사용자 설치에 불필요한 관리자 권한 도우미는 패키징하지 않는다.

이 단계에서는 `npm run pack`에 NSIS 타깃을 추가하면서 기존 Windows x64 ZIP·portable 타깃을 유지했다. 이후 사용자의 요청에 따라 NSIS 설치 EXE만 생성하도록 변경했다. 이 환경에서는 npm 실행 파일 대신 해당 빌드 단계를 Node CLI로 실행했으며 설치된 Electron과 공식 Windows 도구 캐시를 사용했다. 설치 파일에는 별도의 코드 서명이 없다.

## 실제 검증

- 자동 테스트 19/19, renderer·Electron TypeScript 검사, renderer·Electron 프로덕션 빌드, `git diff --check` 통과.
- 기존 설치·바로가기가 없는 것을 확인하고 작업 폴더의 격리된 임시 경로에 실제 설치했다.
- 앱 목록의 이름·버전·설치 경로와 바탕화면·시작 메뉴 바로가기의 실행 대상을 검사했다.
- 설치된 패키지 파일 76개가 생성한 앱 폴더의 파일과 SHA-256 기준으로 일치했다. 설치된 앱을 세 번 실행해 실제 화면 캡처와 정상 종료를 확인했다.
- 실행 전체 시간 중앙값 3487ms, 내장 캡처 대기 2500ms를 제외한 로드 추정 시간 중앙값 881ms. 시작 시간은 해당 PC에서 측정한 결과다.
- 임시 설치를 실제 제거한 뒤 앱 실행 파일, 설치·제거 레지스트리, 바탕화면·시작 메뉴 바로가기가 제거된 것을 확인했다. 사용자 설정 삭제 옵션은 사용하지 않았다.
- 최신 ZIP의 무결성·압축 해제·x64 실행 파일 구조를 검사했다. 패키지 파일 76개 및 ASAR의 renderer·Electron 빌드 파일 101개가 현재 결과와 일치하며 불일치와 앱 QA 스크립트는 0개다.
- Electron·Chromium·Monaco·React·ReactDOM 라이선스 파일을 원본과 대조했다.

설치·제거 및 ZIP 검사 결과는 `2026-10-12-installer-assets/`에 저장했다.
