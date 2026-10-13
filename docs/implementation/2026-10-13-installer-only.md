# 설치 프로그램 전용 배포 및 작업 규칙 — 2026-10-13

사용자의 직접 요청에 따라 `main` 브랜치와 메인 워크트리에서 작업하며, 검증을 마친 변경의 커밋·푸시는 상시 승인된 것으로 기록했다. `AGENTS.md`와 README에 반영했다. `npm run pack`의 배포 타깃은 Windows x64 NSIS 설치 프로그램 하나다. ZIP과 portable EXE는 생성하지 않는다.

## 최신 설치 프로그램

- 경로: `release/installer-only-2026-10-12/DiffDesk-Setup-1.0.0.exe`
- 크기: 84,583,548 bytes.
- SHA-256: `7c11722d130ce8aef562fc38fab9018f73b6a7aba5def443feb11b544edd36fe`
- 현재 사용자 one-click 설치, 바탕화면·시작 메뉴 바로가기, 제거 프로그램을 제공한다. 제거 시 앱 설정은 보존한다.

## 검증

- 자동 테스트 19/19, renderer·Electron 타입 검사, 프로덕션 빌드, `git diff --check` 통과.
- electron-builder가 NSIS x64 타깃 하나를 빌드해 정상 종료했다. 이번 출력 폴더에는 ZIP이나 portable EXE가 없다. `win-unpacked`는 설치 프로그램 생성용 내부 산출물이다.
- 새 셋업의 압축 무결성 및 포함된 x64 실행 파일을 검사했다. 앱 파일 76개와 ASAR의 현재 renderer·Electron 빌드 파일 101개가 원본과 일치했다. 불일치와 앱 QA 스크립트는 0개다.
- Electron·Chromium·Monaco·React·ReactDOM의 라이선스 고지 5개가 원본과 일치했다.
- 셋업에서 추출한 실제 앱을 별도 설정 폴더로 3회 실행해 화면 캡처와 정상 종료를 확인했다. 로드 추정 시간 중앙값 787ms, 2500ms 캡처 대기를 포함한 전체 중앙값 3394ms. 해당 PC에서 측정한 결과다.
- 기존 사용자 바로가기와 실행 중인 앱을 보호하기 위해 설치·제거는 반복하지 않았다. 설치 동작 자체의 실제 검증은 `2026-10-12-windows-installer.md`에 기록되어 있다. 이번 검증 범위는 최신 셋업 내용과 포함 앱 실행이다.
- 별도 읽기 전용 코드 리뷰에서 제품·설정의 주요 문제는 발견되지 않았다.

검증 JSON은 `2026-10-13-installer-only-assets/`에 저장했다. 가운데 병합 공간은 개선 시안만 작성했으며 실제 제품에는 아직 적용하지 않았다.
