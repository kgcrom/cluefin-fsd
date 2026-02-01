# ClueFin FSD

한국 증권사 API를 통합하는 트레이딩 플랫폼

## About

ClueFin FSD는 한국 증권사 Open API를 단일 인터페이스로 통합하여 인증, 주문, 시세 조회 등의 기능을 제공하는 모노레포 프로젝트입니다.

**지원 증권사**

- KIS (한국투자증권)
- Kiwoom (키움증권)

## Built With

- [TypeScript](https://www.typescriptlang.org/)
- [Bun](https://bun.sh/) (런타임 & 패키지 매니저)
- Bun Workspaces (모노레포 관리)
- [Hono](https://hono.dev/) (trader 웹 프레임워크)
- [Cloudflare Workers](https://workers.cloudflare.com/) (trader 배포)
- [Biome](https://biomejs.dev/) (lint & format)

## Project Structure

```
cluefin-fsd/
├── apps/
│   ├── broker/          # 증권사 인증 CLI (@cluefin/broker)
│   ├── trader/          # 트레이딩 API 서비스 — Cloudflare Workers (@cluefin/trader)
│   └── scheduler/       # 스케줄링 서비스 (@cluefin/scheduler)
├── packages/
│   ├── cloudflare/      # Cloudflare 런타임 유틸리티 (@cluefin/cloudflare)
│   └── securities/      # 증권사 API 클라이언트 라이브러리 (@cluefin/securities)
├── package.json
└── tsconfig.json
```

| 워크스페이스 | 설명 |
|---|---|
| `@cluefin/broker` | 증권사 인증 토큰 발급 CLI |
| `@cluefin/trader` | 트레이딩 API 서비스 (Hono + Cloudflare Workers) |
| `@cluefin/scheduler` | 자동 매매 스케줄러 (예정) |
| `@cluefin/cloudflare` | Cloudflare 런타임 유틸리티 (Secrets Store 등) |
| `@cluefin/securities` | KIS/Kiwoom 증권사 API 클라이언트 라이브러리 |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0 이상

```sh
curl -fsSL https://bun.sh/install | bash
```

### Installation

```sh
git clone https://github.com/<username>/cluefin-fsd.git
cd cluefin-fsd
bun install
```

### Environment Variables

프로젝트 루트에 `.env` 파일을 생성하고 필요한 환경변수를 설정합니다.

| 변수 | 설명 | 값 |
|---|---|---|
| `KIS_ENV` | KIS 환경 설정 | `prod` \| `dev` |
| `KIS_APP_KEY` | KIS 앱 키 | 한국투자증권에서 발급 |
| `KIS_SECRET_KEY` | KIS 시크릿 키 | 한국투자증권에서 발급 |
| `KIWOOM_ENV` | 키움 환경 설정 | `prod` \| `dev` |
| `KIWOOM_APP_KEY` | 키움 앱 키 | 키움증권에서 발급 |
| `KIWOOM_SECRET_KEY` | 키움 시크릿 키 | 키움증권에서 발급 |

## Usage

### Lint & Format

```sh
# 전체 검사 (lint + format)
bun run check

# 자동 수정
bun run check:fix

# lint만
bun run lint
bun run lint:fix

# format만
bun run format
bun run format:fix
```

앱별 상세 설정(D1, 로컬 개발, API 사용법 등)은 [apps/README.md](apps/README.md)를 참고하세요.

## Testing

```sh
# 전체 테스트
bun test

# securities 패키지 테스트
bun test packages/securities
```

## Roadmap

- [x] 증권사 인증 클라이언트 (KIS, Kiwoom)
- [x] KIS 시세 조회 (인트라데이 차트)
- [x] Kiwoom 시세 조회 (외국인/기관 순위, 거래량급증)
- [~] 트레이딩 API 서비스 (trader — 일부 구현)
- [ ] 자동 매매 스케줄러 (scheduler)
