# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
bun install                                    # 의존성 설치
bun test                                       # 전체 테스트
bun test packages/securities                   # securities 패키지 테스트만
bun run broker:kis                             # KIS 인증 토큰 발급
bun run broker:kiwoom                          # Kiwoom 인증 토큰 발급
bun run check                                  # lint + format 검사
bun run check:fix                              # lint + format 자동 수정
bun run lint                                   # lint만 검사
bun run format                                 # format만 검사
```

broker CLI는 루트의 `.env` 파일을 `--env-file=../../.env`로 참조한다.

trader 로컬 개발: `cd apps/trader && bun run dev`

## Architecture

Bun 워크스페이스 모노레포. 패키지 간 의존은 `workspace:*` 프로토콜.

- `@cluefin/cloudflare` — Cloudflare 런타임 유틸리티 (Secrets Store 접근 등)
- trader (`apps/trader`)는 Hono + Cloudflare Workers로 동작

## Conventions

- TypeScript strict 모드, ESNext 타겟, bundler 모듈 해석
- 외부 런타임 의존성 없음 — Bun 내장 API와 표준 fetch만 사용. 예외: trader는 Hono 사용
- 패키지마다 barrel export (`index.ts`에서 re-export)
- 테스트는 Bun 내장 테스트 러너 (`*.test.ts`), `globalThis.fetch`를 `mock()`으로 대체하여 HTTP 호출 테스트
- 날짜는 KST(+09:00) 기준으로 파싱 — 브로커별 날짜 포맷이 다름 (KIS: `yyyy-MM-dd HH:mm:ss`, Kiwoom: `yyyyMMddHHmmss`)
- Biome으로 lint/format 통합 관리 (100자 line width, space indent)
