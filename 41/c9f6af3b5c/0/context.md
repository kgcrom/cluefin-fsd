# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# 주식잔고조회 API 추가

## Context
KIS 증권사 API 클라이언트에 "주식잔고조회" (v1_국내주식-006) 기능을 추가한다.
계좌 기반 거래 조회이므로 기존 `getDailyOrders`와 동일한 패턴으로 `order.ts`에 `getBalance` 메서드를 추가.

- **Endpoint**: GET `/uapi/domestic-stock/v1/trading/inquire-balance`
- **TR ID**: `TTTC8434R` (실전), `VTTC8434R` (모의)
- **Response**: `output1` (보유종목 배열), `output2` ...

### Prompt 2

Base directory for this skill: /Volumes/kgcrom-2tb/kgcrom/.claude/skills/commit

## Format

```
<type>: <short summary in Korean>

<optional body in Korean>
```

## Core Rules

**Language:**
- Type prefix in English (feat, fix, refactor, docs, test, chore, perf, style)
- Summary and body in Korean
- Use concise verb forms: "추가", "수정", "삭제" (NOT "추가하도록 함", "수정하도록 함")

**Header:**
- Under 50 characters
- Lowercase start, no period at end
- Imperative mood: descr...

