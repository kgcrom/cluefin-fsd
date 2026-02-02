import { afterEach, beforeEach, describe, expect, mock, setSystemTime, test } from "bun:test";

const mockGetActiveOrders = mock(() => Promise.resolve([]));
const mockGetRequestedQuantity = mock(() => Promise.resolve(0));
const mockCreateExecution = mock(() => Promise.resolve({}));
const mockUpdateOrderStatus = mock(() => Promise.resolve());
const mockBuyOrder = mock(() => Promise.resolve({ output: { odno: "001", ordTmd: "121000" } }));
const mockSellOrder = mock(() => Promise.resolve({ output: { odno: "002", ordTmd: "121001" } }));

mock.module("@cluefin/cloudflare", () => ({
  createOrderRepository: () => ({
    getActiveOrders: mockGetActiveOrders,
    getRequestedQuantity: mockGetRequestedQuantity,
    createExecution: mockCreateExecution,
    updateOrderStatus: mockUpdateOrderStatus,
  }),
}));

mock.module("@cluefin/securities", () => ({
  createKisTradingClient: () => ({
    buyOrder: mockBuyOrder,
    sellOrder: mockSellOrder,
  }),
  createKiwoomOrderClient: () => ({
    buyOrder: mock(() => Promise.resolve({ ordNo: "K001" })),
  }),
}));

const { isOrderExecutionTime, isFillCheckTime, handleOrderExecution } = await import("./cron");

const mockEnv = {
  KIS_APP_KEY: "test-key",
  KIS_SECRET_KEY: "test-secret",
  KIS_ENV: "dev",
  BROKER_TOKEN_KIS: "kis-token",
  KIS_ACCOUNT_NO: "12345",
  KIS_ACCOUNT_PRODUCT_CODE: "01",
  KIWOOM_APP_KEY: "test-key",
  KIWOOM_SECRET_KEY: "test-secret",
  KIWOOM_ENV: "dev",
  BROKER_TOKEN_KIWOOM: "kiwoom-token",
  cluefin_fsd_db: {},
};

/** KST = UTC + 9h. 주어진 KST 시각에 해당하는 UTC Date를 만든다. */
function kstDate(hour: number, minute: number): Date {
  return new Date(Date.UTC(2025, 0, 6, hour - 9, minute));
}

afterEach(() => {
  setSystemTime();
  mockGetActiveOrders.mockClear();
  mockGetRequestedQuantity.mockClear();
  mockCreateExecution.mockClear();
  mockUpdateOrderStatus.mockClear();
  mockBuyOrder.mockClear();
  mockSellOrder.mockClear();
});

describe("isOrderExecutionTime", () => {
  test("KST 09:10 → true (거래 시작 경계)", () => {
    setSystemTime(kstDate(9, 10));
    expect(isOrderExecutionTime()).toBe(true);
  });

  test("KST 09:09 → false (거래 시작 전)", () => {
    setSystemTime(kstDate(9, 9));
    expect(isOrderExecutionTime()).toBe(false);
  });

  test("KST 15:01 → false (거래 종료 후)", () => {
    setSystemTime(kstDate(15, 1));
    expect(isOrderExecutionTime()).toBe(false);
  });
});

describe("isFillCheckTime", () => {
  test("KST 16:00 → true (체결 확인 시간)", () => {
    setSystemTime(kstDate(16, 0));
    expect(isFillCheckTime()).toBe(true);
  });

  test("KST 15:59 → false (체결 확인 시간 전)", () => {
    setSystemTime(kstDate(15, 59));
    expect(isFillCheckTime()).toBe(false);
  });
});

describe("handleOrderExecution", () => {
  test("잔여수량 0이면 주문 안 함", async () => {
    mockGetActiveOrders.mockResolvedValueOnce([
      {
        id: 1,
        stockCode: "005930",
        side: "buy",
        referencePrice: 66000,
        quantity: 10,
        broker: "kis",
        status: "monitoring",
      },
    ]);
    mockGetRequestedQuantity.mockResolvedValueOnce(10);

    await handleOrderExecution(mockEnv);

    expect(mockBuyOrder).not.toHaveBeenCalled();
    expect(mockCreateExecution).not.toHaveBeenCalled();
  });

  test("pending 상태 주문 실행 후 monitoring으로 전환", async () => {
    mockGetActiveOrders.mockResolvedValueOnce([
      {
        id: 2,
        stockCode: "005930",
        side: "buy",
        referencePrice: 66000,
        quantity: 10,
        broker: "kis",
        status: "pending",
      },
    ]);
    mockGetRequestedQuantity.mockResolvedValueOnce(0);

    await handleOrderExecution(mockEnv);

    expect(mockBuyOrder).toHaveBeenCalledTimes(1);
    expect(mockCreateExecution).toHaveBeenCalledTimes(1);
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith(2, "monitoring");
  });
});
