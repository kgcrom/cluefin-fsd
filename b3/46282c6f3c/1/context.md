# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# 국내업종 현재지수 API 추가

## Context
KIS 증권사 API 클라이언트에 "국내업종 현재지수" (v1_국내주식-063) 조회 기능을 추가한다.
기존 `getStockPrice`와 동일한 패턴으로 `getIndexPrice` 메서드를 추가.

- **Endpoint**: GET `/uapi/domestic-stock/v1/quotations/inquire-index-price`
- **TR ID**: `FHPUP02100000` (실전 전용, 모의투자 미지원)
- **Query Params**: `FID_COND_MRKT_DIV_CODE` ("U"), `FID_INPUT_ISCD...

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

