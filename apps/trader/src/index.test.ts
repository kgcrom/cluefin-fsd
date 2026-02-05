import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockGetActiveOrders = mock(() => Promise.resolve([]));
const mockGetOrderById = mock(() => Promise.resolve(null));
const mockBuyOrder = mock(() => Promise.resolve({ output: { odno: "001", ordTmd: "121000" } }));
const mockSellOrder = mock(() => Promise.resolve({ output: { odno: "002", ordTmd: "121001" } }));
const mockKiwoomBuyOrder = mock(() => Promise.resolve({ ordNo: "K001", ordTm: "121000" }));

mock.module("@cluefin/cloudflare", () => ({
  createOrderRepository: () => ({
    getActiveOrders: mockGetActiveOrders,
    getOrderById: mockGetOrderById,
  }),
}));

mock.module("@cluefin/securities", () => ({
  createKisMarketClient: () => ({}),
  createKisOrderClient: () => ({
    buyOrder: mockBuyOrder,
    sellOrder: mockSellOrder,
  }),
  createKiwoomMarketClient: () => ({}),
  createKiwoomOrderClient: () => ({
    buyOrder: mockKiwoomBuyOrder,
  }),
}));

const { default: worker } = await import("./index");

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

const mockCtx = { waitUntil: mock(), passThroughOnException: mock() };

function req(method: string, path: string, body?: unknown) {
  const url = `http://localhost${path}`;
  const init: RequestInit = { method };
  if (body) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

beforeEach(() => {
  mockGetActiveOrders.mockClear();
  mockGetOrderById.mockClear();
  mockBuyOrder.mockClear();
  mockSellOrder.mockClear();
  mockKiwoomBuyOrder.mockClear();
});

describe("GET /orders", () => {
  test("broker 유효값이 아니면 400", async () => {
    const res = await worker.fetch(req("GET", "/orders?broker=nope"), mockEnv, mockCtx);
    expect(res.status).toBe(400);
  });
});

describe("GET /orders/:id", () => {
  test("숫자가 아닌 ID → 400", async () => {
    const res = await worker.fetch(req("GET", "/orders/abc"), mockEnv, mockCtx);
    expect(res.status).toBe(400);
  });

  test("존재하지 않는 ID → 404", async () => {
    mockGetOrderById.mockResolvedValueOnce(null);
    const res = await worker.fetch(req("GET", "/orders/999"), mockEnv, mockCtx);
    expect(res.status).toBe(404);
  });
});

describe("POST /kis/order", () => {
  test("토큰 없으면 401", async () => {
    const envNoToken = { ...mockEnv, BROKER_TOKEN_KIS: "" };
    const res = await worker.fetch(
      req("POST", "/kis/order", { side: "buy", stockCode: "005930" }),
      envNoToken,
      mockCtx,
    );
    expect(res.status).toBe(401);
  });

  test("잘못된 side → 400", async () => {
    const res = await worker.fetch(
      req("POST", "/kis/order", { side: "hold", stockCode: "005930" }),
      mockEnv,
      mockCtx,
    );
    expect(res.status).toBe(400);
  });

  test("side=buy → buyOrder 호출", async () => {
    const body = {
      side: "buy",
      stockCode: "005930",
      orderType: "00",
      quantity: "10",
      price: "66000",
      accountNo: "12345",
      accountProductCode: "01",
    };
    const res = await worker.fetch(req("POST", "/kis/order", body), mockEnv, mockCtx);
    expect(res.status).toBe(200);
    expect(mockBuyOrder).toHaveBeenCalledTimes(1);
    expect(mockSellOrder).not.toHaveBeenCalled();
  });

  test("side=sell → sellOrder 호출", async () => {
    const body = {
      side: "sell",
      stockCode: "005930",
      orderType: "00",
      quantity: "10",
      price: "66000",
      accountNo: "12345",
      accountProductCode: "01",
    };
    const res = await worker.fetch(req("POST", "/kis/order", body), mockEnv, mockCtx);
    expect(res.status).toBe(200);
    expect(mockSellOrder).toHaveBeenCalledTimes(1);
    expect(mockBuyOrder).not.toHaveBeenCalled();
  });
});

describe("POST /kiwoom/order", () => {
  test("side=sell → 501 미구현", async () => {
    const body = {
      side: "sell",
      stkCd: "005930",
      ordQty: "10",
      trdeTp: "0",
      dmstStexTp: "1",
    };
    const res = await worker.fetch(req("POST", "/kiwoom/order", body), mockEnv, mockCtx);
    expect(res.status).toBe(501);
  });
});
