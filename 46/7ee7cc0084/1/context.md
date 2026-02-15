# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Kiwoom 관련 코드 제거 (cron.ts, cron.test.ts)

## Context
Kiwoom 증권사 연동은 나중에 추가할 예정이므로, 현재 cron 모듈에서 Kiwoom 관련 코드를 모두 제거한다.

## 변경 파일

### 1. `apps/trader/src/cron.ts`

- **import 제거**: `createKiwoomOrderClient`, `KiwoomDailyOrderParams` (line 8, 12)
- **함수 삭제**: `executeKiwoomOrder` (lines 50-79)
- **`handleOrderExecution`**:
  - kiwoomToken 조회 제거 (line 88)
  - ...

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

