import { describe, expect, test } from "bun:test";
import { toTradeExecution, toTradeOrder } from "./mapper";
import type { TradeExecutionRow, TradeOrderRow } from "./types";

describe("toTradeOrder", () => {
  test("snake_case를 camelCase로 변환", () => {
    const row: TradeOrderRow = {
      id: 1,
      stock_code: "005930",
      stock_name: "삼성전자",
      side: "buy",
      reference_price: 70000,
      quantity: 10,
      trailing_stop_pct: 3.5,
      volume_threshold: 1000000,
      broker: "kis",
      market: "kospi",
      status: "pending",
      memo: "테스트 메모",
      created_at: "2024-01-15 10:30:00",
      updated_at: "2024-01-15 10:30:00",
    };

    const result = toTradeOrder(row);

    expect(result).toEqual({
      id: 1,
      stockCode: "005930",
      stockName: "삼성전자",
      side: "buy",
      referencePrice: 70000,
      quantity: 10,
      trailingStopPct: 3.5,
      volumeThreshold: 1000000,
      broker: "kis",
      market: "kospi",
      status: "pending",
      memo: "테스트 메모",
      createdAt: "2024-01-15 10:30:00",
      updatedAt: "2024-01-15 10:30:00",
    });
  });

  test("null 필드 처리", () => {
    const row: TradeOrderRow = {
      id: 2,
      stock_code: "035720",
      stock_name: null,
      side: "sell",
      reference_price: 50000,
      quantity: 5,
      trailing_stop_pct: 2.0,
      volume_threshold: null,
      broker: "kiwoom",
      market: "kosdaq",
      status: "monitoring",
      memo: null,
      created_at: "2024-01-16 09:00:00",
      updated_at: "2024-01-16 09:00:00",
    };

    const result = toTradeOrder(row);

    expect(result.stockName).toBeNull();
    expect(result.volumeThreshold).toBeNull();
    expect(result.memo).toBeNull();
  });

  test("모든 필드 타입 보존", () => {
    const row: TradeOrderRow = {
      id: 3,
      stock_code: "000660",
      stock_name: "SK하이닉스",
      side: "buy",
      reference_price: 120000,
      quantity: 100,
      trailing_stop_pct: 5.0,
      volume_threshold: 500000,
      broker: "kis",
      market: "kospi",
      status: "executed",
      memo: "장기 투자",
      created_at: "2024-01-17 14:00:00",
      updated_at: "2024-01-17 15:30:00",
    };

    const result = toTradeOrder(row);

    expect(typeof result.id).toBe("number");
    expect(typeof result.stockCode).toBe("string");
    expect(typeof result.stockName).toBe("string");
    expect(typeof result.side).toBe("string");
    expect(typeof result.referencePrice).toBe("number");
    expect(typeof result.quantity).toBe("number");
    expect(typeof result.trailingStopPct).toBe("number");
    expect(typeof result.volumeThreshold).toBe("number");
    expect(typeof result.broker).toBe("string");
    expect(typeof result.status).toBe("string");
    expect(typeof result.memo).toBe("string");
    expect(typeof result.createdAt).toBe("string");
    expect(typeof result.updatedAt).toBe("string");
  });
});

describe("toTradeExecution", () => {
  test("snake_case를 camelCase로 변환", () => {
    const row: TradeExecutionRow = {
      id: 1,
      order_id: 10,
      broker_order_id: "ORD-12345",
      requested_qty: 50,
      requested_price: 70000,
      filled_qty: 50,
      filled_price: 69900,
      status: "filled",
      broker: "kis",
      broker_response: '{"success": true}',
      ordered_at: "2024-01-15 10:30:00",
      filled_at: "2024-01-15 10:31:00",
    };

    const result = toTradeExecution(row);

    expect(result).toEqual({
      id: 1,
      orderId: 10,
      brokerOrderId: "ORD-12345",
      requestedQty: 50,
      requestedPrice: 70000,
      filledQty: 50,
      filledPrice: 69900,
      status: "filled",
      broker: "kis",
      brokerResponse: '{"success": true}',
      orderedAt: "2024-01-15 10:30:00",
      filledAt: "2024-01-15 10:31:00",
    });
  });

  test("null 필드 처리", () => {
    const row: TradeExecutionRow = {
      id: 2,
      order_id: 20,
      broker_order_id: "ORD-67890",
      requested_qty: 100,
      requested_price: 50000,
      filled_qty: null,
      filled_price: null,
      status: "ordered",
      broker: "kiwoom",
      broker_response: null,
      ordered_at: "2024-01-16 09:00:00",
      filled_at: null,
    };

    const result = toTradeExecution(row);

    expect(result.filledQty).toBeNull();
    expect(result.filledPrice).toBeNull();
    expect(result.brokerResponse).toBeNull();
    expect(result.filledAt).toBeNull();
  });

  test("부분 체결 상태 처리", () => {
    const row: TradeExecutionRow = {
      id: 3,
      order_id: 30,
      broker_order_id: "ORD-PARTIAL",
      requested_qty: 100,
      requested_price: 80000,
      filled_qty: 30,
      filled_price: 79500,
      status: "partial",
      broker: "kis",
      broker_response: '{"partial": true}',
      ordered_at: "2024-01-17 11:00:00",
      filled_at: "2024-01-17 11:05:00",
    };

    const result = toTradeExecution(row);

    expect(result.status).toBe("partial");
    expect(result.filledQty).toBe(30);
    expect(result.requestedQty).toBe(100);
  });
});
