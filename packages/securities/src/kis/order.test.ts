import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createKisOrderClient } from "./order";
import type { KisOrderParams } from "./types";

const originalFetch = globalThis.fetch;

const rawResponse = {
  rt_cd: "0",
  msg_cd: "KIOK0000",
  msg1: "주문 전송 완료 되었습니다.",
  output: {
    KRX_FWDG_ORD_ORGNO: "91252",
    ODNO: "0000117057",
    ORD_TMD: "121052",
  },
};

beforeEach(() => {
  globalThis.fetch = mock(() =>
    Promise.resolve(new Response(JSON.stringify(rawResponse), { status: 200 })),
  );
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const credentials = { appkey: "my-appkey", appsecret: "my-appsecret" };
const token = "test-bearer-token";
const params: KisOrderParams = {
  accountNo: "50068923",
  accountProductCode: "01",
  stockCode: "005930",
  orderType: "00",
  quantity: "10",
  price: "66000",
};

describe("createKisOrderClient", () => {
  test("throws on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Forbidden", { status: 403, statusText: "Forbidden" })),
    );

    const client = createKisOrderClient("production");

    expect(client.buyOrder(credentials, token, params)).rejects.toThrow(
      "KIS order request failed: 403 Forbidden",
    );
  });
});
