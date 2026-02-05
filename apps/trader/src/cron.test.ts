import { afterEach, describe, expect, mock, test } from "bun:test";

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
  createKisOrderClient: () => ({
    buyOrder: mockBuyOrder,
    sellOrder: mockSellOrder,
  }),
  createKiwoomOrderClient: () => ({
    buyOrder: mock(() => Promise.resolve({ ordNo: "K001" })),
  }),
}));

const { handleOrderExecution } = await import("./cron");

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

afterEach(() => {
  mockGetActiveOrders.mockClear();
  mockGetRequestedQuantity.mockClear();
  mockCreateExecution.mockClear();
  mockUpdateOrderStatus.mockClear();
  mockBuyOrder.mockClear();
  mockSellOrder.mockClear();
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
