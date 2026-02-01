import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createKisTradingClient } from "./trading";
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

describe("createKisTradingClient", () => {
  describe("buyOrder", () => {
    describe("production env", () => {
      test("uses production URL and tr_id", async () => {
        const client = createKisTradingClient("production");
        await client.buyOrder(credentials, token, params);

        const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
        const url = callArgs[0] as string;
        const init = callArgs[1] as RequestInit;
        const headers = init.headers as Record<string, string>;

        expect(url).toBe(
          "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/trading/order-cash",
        );
        expect(headers.tr_id).toBe("TTTC0802U");
      });
    });

    describe("dev env", () => {
      test("uses dev URL and tr_id", async () => {
        const client = createKisTradingClient("dev");
        await client.buyOrder(credentials, token, params);

        const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
        const url = callArgs[0] as string;
        const init = callArgs[1] as RequestInit;
        const headers = init.headers as Record<string, string>;

        expect(url).toBe(
          "https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/trading/order-cash",
        );
        expect(headers.tr_id).toBe("VTTC0802U");
      });
    });

    test("sends POST with correct headers", async () => {
      const client = createKisTradingClient("production");
      await client.buyOrder(credentials, token, params);

      const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
      const init = callArgs[1] as RequestInit;
      const headers = init.headers as Record<string, string>;

      expect(init.method).toBe("POST");
      expect(headers["content-type"]).toBe("application/json; charset=UTF-8");
      expect(headers.authorization).toBe("Bearer test-bearer-token");
      expect(headers.appkey).toBe("my-appkey");
      expect(headers.appsecret).toBe("my-appsecret");
      expect(headers.custtype).toBe("P");
    });

    test("sends correct request body", async () => {
      const client = createKisTradingClient("production");
      await client.buyOrder(credentials, token, params);

      const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
      const init = callArgs[1] as RequestInit;
      const body = JSON.parse(init.body as string);

      expect(body).toEqual({
        CANO: "50068923",
        ACNT_PRDT_CD: "01",
        PDNO: "005930",
        ORD_DVSN: "00",
        ORD_QTY: "10",
        ORD_UNPR: "66000",
      });
    });

    test("parses response with camelCase mapping", async () => {
      const client = createKisTradingClient("production");
      const result = await client.buyOrder(credentials, token, params);

      expect(result.rtCd).toBe("0");
      expect(result.msgCd).toBe("KIOK0000");
      expect(result.msg1).toBe("주문 전송 완료 되었습니다.");
      expect(result.output).toEqual({
        krxFwdgOrdOrgno: "91252",
        odno: "0000117057",
        ordTmd: "121052",
      });
    });
  });

  describe("sellOrder", () => {
    test("uses sell tr_id for production", async () => {
      const client = createKisTradingClient("production");
      await client.sellOrder(credentials, token, params);

      const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
      const init = callArgs[1] as RequestInit;
      const headers = init.headers as Record<string, string>;

      expect(headers.tr_id).toBe("TTTC0801U");
    });

    test("uses sell tr_id for dev", async () => {
      const client = createKisTradingClient("dev");
      await client.sellOrder(credentials, token, params);

      const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
      const init = callArgs[1] as RequestInit;
      const headers = init.headers as Record<string, string>;

      expect(headers.tr_id).toBe("VTTC0801U");
    });

    test("parses response with camelCase mapping", async () => {
      const client = createKisTradingClient("production");
      const result = await client.sellOrder(credentials, token, params);

      expect(result.rtCd).toBe("0");
      expect(result.output).toEqual({
        krxFwdgOrdOrgno: "91252",
        odno: "0000117057",
        ordTmd: "121052",
      });
    });
  });

  test("throws on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Forbidden", { status: 403, statusText: "Forbidden" })),
    );

    const client = createKisTradingClient("production");

    expect(client.buyOrder(credentials, token, params)).rejects.toThrow(
      "KIS order request failed: 403 Forbidden",
    );
  });
});
