# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Plan: cron.ts에 KIS 시세 조회 연동 + market 필드 추가

## Context
`handleOrderExecution`에서 KIS 매수/매도 주문 실행 전에 종목 현재가(`getStockPrice`)와 업종 지수(`getIndexPrice`)를 조회하도록 연동한다. 업종 지수 조회를 위해 `trade_orders` 테이블에 `market` 컬럼(KOSPI/KOSDAQ)을 추가한다. 실제 매수/매도 조건 판단 로직은 이후 별도 구현 예정이며, 이번에는 데이터 조회 + 로...

