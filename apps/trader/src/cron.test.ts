import { afterEach, describe, expect, mock, test } from "bun:test";

const mockGetActiveOrders = mock(() => Promise.resolve([]));
const mockGetRequestedQuantity = mock(() => Promise.resolve(0));
const mockCreateExecution = mock(() => Promise.resolve({}));
const mockUpdateOrderStatus = mock(() => Promise.resolve());
const mockGetUnfilledExecutions = mock(() => Promise.resolve([]));
const mockUpdateExecutionFill = mock(() => Promise.resolve());
const mockBuyOrder = mock(() => Promise.resolve({ output: { odno: "001", ordTmd: "121000" } }));
const mockSellOrder = mock(() => Promise.resolve({ output: { odno: "002", ordTmd: "121001" } }));
const mockGetDailyOrdersKis = mock(() =>
  Promise.resolve({
    rtCd: "0",
    msgCd: "MCA00000",
    msg1: "성공",
    output1: [],
    output2: {},
  }),
);

mock.module("@cluefin/cloudflare", () => ({
  createOrderRepository: () => ({
    getActiveOrders: mockGetActiveOrders,
    getRequestedQuantity: mockGetRequestedQuantity,
    createExecution: mockCreateExecution,
    updateOrderStatus: mockUpdateOrderStatus,
    getUnfilledExecutions: mockGetUnfilledExecutions,
    updateExecutionFill: mockUpdateExecutionFill,
  }),
}));

mock.module("@cluefin/securities", () => ({
  createKisAuthClient: () => ({
    getToken: mock(),
  }),
  createKisMarketClient: () => ({
    getStockPrice: mock(() => Promise.resolve({ output: { stckPrpr: "66000" } })),
    getIndexPrice: mock(() => Promise.resolve({ output: { bstpNmixPrpr: "2500" } })),
  }),
  createKisOrderClient: () => ({
    buyOrder: mockBuyOrder,
    sellOrder: mockSellOrder,
    getDailyOrders: mockGetDailyOrdersKis,
  }),
}));

const { handleOrderExecution, handleFillCheck } = await import("./cron");

function createMockD1() {
  const futureDate = new Date(Date.now() + 86_400_000).toISOString();
  const tokenRows: Record<string, unknown> = {
    kis: {
      broker: "kis",
      token: "kis-token",
      token_type: "Bearer",
      expires_at: futureDate,
      updated_at: new Date().toISOString(),
    },
  };
  return {
    prepare: () => ({
      bind: (...args: unknown[]) => ({
        first: () => Promise.resolve(tokenRows[args[0] as string] ?? null),
        run: () => Promise.resolve(),
      }),
    }),
  };
}

const mockEnv = {
  KIS_APP_KEY: "test-key",
  KIS_SECRET_KEY: "test-secret",
  KIS_ENV: "dev",
  KIS_ACCOUNT_NO: "12345",
  KIS_ACCOUNT_PRODUCT_CODE: "01",
  cluefin_fsd_db: createMockD1(),
};

afterEach(() => {
  mockGetActiveOrders.mockClear();
  mockGetRequestedQuantity.mockClear();
  mockCreateExecution.mockClear();
  mockUpdateOrderStatus.mockClear();
  mockGetUnfilledExecutions.mockClear();
  mockUpdateExecutionFill.mockClear();
  mockBuyOrder.mockClear();
  mockSellOrder.mockClear();
  mockGetDailyOrdersKis.mockClear();
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

describe("handleFillCheck", () => {
  test("빈 미체결 목록이면 조기 반환", async () => {
    mockGetUnfilledExecutions.mockResolvedValueOnce([]);

    await handleFillCheck(mockEnv);

    expect(mockGetDailyOrdersKis).not.toHaveBeenCalled();
  });

  test("KIS 완전체결 주문", async () => {
    mockGetUnfilledExecutions.mockResolvedValueOnce([
      {
        id: 1,
        orderId: 10,
        brokerOrderId: "KIS001",
        requestedQty: 10,
        requestedPrice: 50000,
        broker: "kis",
        status: "ordered",
        createdAt: new Date(),
      },
    ]);

    mockGetDailyOrdersKis.mockResolvedValueOnce({
      rtCd: "0",
      msgCd: "MCA00000",
      msg1: "성공",
      output1: [
        {
          odno: "KIS001",
          totCcldQty: "10",
          avgPrvs: "50000",
          rjctQty: "0",
        },
      ],
      output2: {},
    });

    await handleFillCheck(mockEnv);

    expect(mockUpdateExecutionFill).toHaveBeenCalledWith(1, 10, 50000, "filled");
  });

  test("KIS 부분체결 주문", async () => {
    mockGetUnfilledExecutions.mockResolvedValueOnce([
      {
        id: 2,
        orderId: 20,
        brokerOrderId: "KIS002",
        requestedQty: 10,
        requestedPrice: 50000,
        broker: "kis",
        status: "ordered",
        createdAt: new Date(),
      },
    ]);

    mockGetDailyOrdersKis.mockResolvedValueOnce({
      rtCd: "0",
      msgCd: "MCA00000",
      msg1: "성공",
      output1: [
        {
          odno: "KIS002",
          totCcldQty: "5",
          avgPrvs: "50000",
          rjctQty: "0",
        },
      ],
      output2: {},
    });

    await handleFillCheck(mockEnv);

    expect(mockUpdateExecutionFill).toHaveBeenCalledWith(2, 5, 50000, "partial");
  });

  test("KIS 거부 주문", async () => {
    mockGetUnfilledExecutions.mockResolvedValueOnce([
      {
        id: 3,
        orderId: 30,
        brokerOrderId: "KIS003",
        requestedQty: 10,
        requestedPrice: 50000,
        broker: "kis",
        status: "ordered",
        createdAt: new Date(),
      },
    ]);

    mockGetDailyOrdersKis.mockResolvedValueOnce({
      rtCd: "0",
      msgCd: "MCA00000",
      msg1: "성공",
      output1: [
        {
          odno: "KIS003",
          totCcldQty: "0",
          avgPrvs: "0",
          rjctQty: "10",
        },
      ],
      output2: {},
    });

    await handleFillCheck(mockEnv);

    expect(mockUpdateExecutionFill).toHaveBeenCalledWith(3, 0, 0, "rejected");
  });

  test("API에 주문이 없으면 경고만 출력", async () => {
    mockGetUnfilledExecutions.mockResolvedValueOnce([
      {
        id: 6,
        orderId: 60,
        brokerOrderId: "KIS999",
        requestedQty: 10,
        requestedPrice: 50000,
        broker: "kis",
        status: "ordered",
        createdAt: new Date(),
      },
    ]);

    mockGetDailyOrdersKis.mockResolvedValueOnce({
      rtCd: "0",
      msgCd: "MCA00000",
      msg1: "성공",
      output1: [],
      output2: {},
    });

    await handleFillCheck(mockEnv);

    expect(mockUpdateExecutionFill).not.toHaveBeenCalled();
  });

  test("여러 KIS 주문 혼합 처리", async () => {
    mockGetUnfilledExecutions.mockResolvedValueOnce([
      {
        id: 7,
        orderId: 70,
        brokerOrderId: "KIS100",
        requestedQty: 10,
        requestedPrice: 50000,
        broker: "kis",
        status: "ordered",
        createdAt: new Date(),
      },
      {
        id: 8,
        orderId: 80,
        brokerOrderId: "KIS200",
        requestedQty: 5,
        requestedPrice: 60000,
        broker: "kis",
        status: "ordered",
        createdAt: new Date(),
      },
    ]);

    mockGetDailyOrdersKis.mockResolvedValueOnce({
      rtCd: "0",
      msgCd: "MCA00000",
      msg1: "성공",
      output1: [
        { odno: "KIS100", totCcldQty: "10", avgPrvs: "50000", rjctQty: "0" },
        { odno: "KIS200", totCcldQty: "5", avgPrvs: "60000", rjctQty: "0" },
      ],
      output2: {},
    });

    await handleFillCheck(mockEnv);

    expect(mockUpdateExecutionFill).toHaveBeenCalledTimes(2);
    expect(mockUpdateExecutionFill).toHaveBeenCalledWith(7, 10, 50000, "filled");
    expect(mockUpdateExecutionFill).toHaveBeenCalledWith(8, 5, 60000, "filled");
  });

  test("KIS 실패하면 에러 발생", async () => {
    mockGetUnfilledExecutions.mockResolvedValueOnce([
      {
        id: 12,
        orderId: 120,
        brokerOrderId: "KIS400",
        requestedQty: 10,
        requestedPrice: 50000,
        broker: "kis",
        status: "ordered",
        createdAt: new Date(),
      },
    ]);

    mockGetDailyOrdersKis.mockRejectedValueOnce(new Error("KIS API error"));

    await expect(handleFillCheck(mockEnv)).rejects.toThrow("KIS API error");

    expect(mockUpdateExecutionFill).not.toHaveBeenCalled();
  });
});
