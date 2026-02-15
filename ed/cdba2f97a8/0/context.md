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

### Prompt 3

주식잔고조회 스펙 문서입니다.

첨부한 문서는 end point스펙과 request header + body
그리고 response header입니다.
response body는 길어서 텍스트로 붙입니다. <response>Body
주식주문(현금[V1_국내주식-001]) 정보 Element, 한글명, Type, Rquired, Length, Description
Element    한글명    Type    Required    Length    Description
rt_cd    성공 실패 여부    String    Y    1    0 : 성공
0 이외의 값 : 실패
msg_cd    응답코드    Strin...

### Prompt 4

[Request interrupted by user for tool use]

